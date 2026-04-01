import { App, TFile, getAllTags } from 'obsidian';
import { OneNote } from 'onenote';
import  VirtFolderPlugin  from 'main';
import { SortTypes } from 'settings';

function _is_string(value:any)
{
    return typeof value === 'string';
}

class ScanSettings
{
	filter: string[] = [];
	ignored_tags: string[] = [];
	title: string = '';
	icon_prop: string = 'vf_icon';
    prop_regexp?:RegExp = undefined;

    set_filter(filter: string[])
    {
        this.filter = filter;
    }

    set_ignored_tags(tags: string[])
    {
        this.ignored_tags = tags;
    }

    set_title(title: string)
    {
        this.title = title;
    }

    set_icon_prop(prop: string)
    {
        this.icon_prop = prop;
    }

    set_prop(prop: string)
    {
		let regexp_str = `^${prop}(\\.\\d+){0,1}$`;
		this.prop_regexp = new RegExp(regexp_str);
    }

    is_valid()
    {
        return typeof this.prop_regexp !== 'undefined';
    }
};

export class BaseScanner
{
    note_list:  {[id: string] : OneNote} = {};
    top_list: string[] = [];
    orphans_list: string[] = [];
    last_active: string[] = ["1"];
    settings: ScanSettings = new ScanSettings();

    constructor(private app: App, private plugin: VirtFolderPlugin)
    {

    }

    test_prop_name(prop_name:string)
    {
        if(!this.settings.prop_regexp) return false;
        return this.settings.prop_regexp.test(prop_name.trim());
    }

    restore_utime(old_list: any)
    {
		for (let id in old_list)
		{
            // how about renamed file ?

            if (id in this.note_list)
            {
                let new_ut = this.note_list[id].utime;
                let old_ut = old_list[id].utime;

                if (old_ut > new_ut)
                {
                    this.note_list[id].utime = old_ut;
                }
            }
		}
    }

    rescan()
    {
        if(!this.settings.is_valid()) return;

        let old_list = this.note_list;
        this.init_note_list();
        this.build_links();
        this.build_top();
        this.sort_links();
        this.restore_utime(old_list)
    }

    get_filtered_count()
    {
        return this.app.vault.getMarkdownFiles().length - this.get_filtered_list().length;
    }

    get_filtered_list()
    {
        return this.app.vault.getMarkdownFiles().filter( (file) =>
        {
            for (let filter of this.settings.filter)
            {
                if (file.path.startsWith(filter)) return false;
            }

            if (this.settings.ignored_tags.length > 0)
            {
                let cache = this.app.metadataCache.getFileCache(file);
                if (cache)
                {
                    let tags = getAllTags(cache);
                    if (tags)
                    {
                        for (let tag of tags)
                        {
                            if (this.settings.ignored_tags.includes(tag)) return false;
                        }
                    }
                }
            }

            return true;
        });
    }

    get_meta_value(file:TFile, prop:string): string | null
    {
        let metadata = this.app.metadataCache.getFileCache(file);

        if(metadata?.frontmatter && prop in metadata.frontmatter)
        {
            let value = metadata.frontmatter[prop];

            if (typeof value === 'string') return value;

            if (Array.isArray(value) && value.length > 0) {
                let first = value[0];
                if (typeof first === 'string') return first;
            }

            return null;
        }

        return null;
    }

    // can we get it from Note class?

    get_note_title(file:TFile)
    {
        let name = file.basename;
        let title = this.get_meta_value(file, this.settings.title);
        return title ? title : name;
    }

    link_to_title(value:string)
    {
        let link_file = this.app.metadataCache.getFirstLinkpathDest(value, '');
        if(!link_file) return value;
        return this.get_note_title(link_file);
    }

    link_to_ctime(value:string)
    {
        let link_file = this.app.metadataCache.getFirstLinkpathDest(value, '');
        if(!link_file) return 0;
        return link_file.stat.ctime;
    }

    link_to_mtime(value:string)
    {
        let link_file = this.app.metadataCache.getFirstLinkpathDest(value, '');
        if(!link_file) return 0;
        return link_file.stat.mtime;
    }

    init_note_list()
    {
        this.note_list = {}

        // create empty notes
        for (let file of this.get_filtered_list())
        {
            let file_id = file.path
            this.note_list[file_id] = new OneNote(
                file_id, file.stat.mtime, file.stat.ctime,
                file.basename, this.get_note_title(file)
            );
        }
    }

    _build_note_links(file: TFile)
    {
        let file_id = file.path;
        if(!(file_id in this.note_list)) return;

        let metadata = this.app.metadataCache.getFileCache(file);
        if (!metadata) return;

        if(metadata.frontmatterLinks)
        {
            for(let link of metadata.frontmatterLinks)
            {
                if (!this.test_prop_name(link.key)) continue;

                let link_file = this.app.metadataCache.getFirstLinkpathDest(link.link, '');
                if(!link_file) continue;

                let link_id = link_file.path;
                if(!(link_id in this.note_list)) continue;

                this.note_list[file_id].parents.push(link_id);
                this.note_list[link_id].children.push(file_id);
            }
        }

        if(metadata.frontmatter)
        {
            if("vf_pinned" in metadata.frontmatter)
            {
                let value = metadata.frontmatter["vf_pinned"];
                this.note_list[file_id].is_pinned = (value != "0" && value != "false" && value != false);
            }

            if(this.settings.icon_prop in metadata.frontmatter)
            {
                let value = metadata.frontmatter[this.settings.icon_prop];
                if(_is_string(value)) this.note_list[file_id].icon = value;
            }
        }
    }

    build_links()
    {
        for (let file of this.get_filtered_list())
        {
            this._build_note_links(file);
        }
    }

    is_orphan(note:OneNote)
    {
        return note.is_no_parents() && note.is_no_children();
    }

    is_top(note:OneNote)
    {
        return note.is_no_parents() && note.has_children();
    }

    is_orphan_or_top(note:OneNote)
    {
        return note.is_no_parents();
    }

    build_top()
    {
        this.orphans_list = [];
        this.top_list = [];

        for(let i in this.note_list)
        {
            let note = this.note_list[i];

            if(this.is_orphan(note))
            {
                this.orphans_list.push(note.id);
                continue;
            }

            if(this.is_top(note))
            {
                this.top_list.push(note.id);
            }
        }
    }

    l_sort(links: string[])
	{
        let links_copy: string[] = [...links];
        let sortBy: SortTypes = this.plugin.settings.sortTreeBy;
        let sortRev: boolean = this.plugin.settings.sortTreeRev;

        if(sortBy == SortTypes.file_name)
        {
            links_copy.sort();
        }

        if(sortBy == SortTypes.note_title)
        {
            links_copy.sort(
                (a,b) =>
                {
                    a = this.link_to_title(a);
                    b = this.link_to_title(b);
                    if(a < b) { return -1; }
                    if(a > b) { return 1; }
                    return 0;
                }
            );
        }

        if(sortBy == SortTypes.creation_time)
        {
            links_copy.sort(
                (a,b) => {return this.link_to_ctime(a) - this.link_to_ctime(b);}
            );
        }

        if(sortBy == SortTypes.modification_time)
        {
            links_copy.sort(
                (a,b) => {return this.link_to_mtime(a) - this.link_to_mtime(b);}
            );
        }

        if(sortRev) links_copy.reverse();

        // pinned notes go first, preserving sort order
        let pinned = links_copy.filter(id => this.note_list[id]?.is_pinned);
        let normal = links_copy.filter(id => !this.note_list[id]?.is_pinned);
        return pinned.concat(normal);
    }

    sort_links()
    {
        for (let id in this.note_list)
        {
            let note = this.note_list[id];
            note.children = this.l_sort(note.children);
        }

        this.orphans_list = this.l_sort(this.orphans_list);
        this.top_list = this.l_sort(this.top_list);
    }

    note_by_id(id: string): OneNote|undefined
    {
        if(id in this.note_list)
        {
            return this.note_list[id];
        }
    }

    get_all_descendants(id: string): Set<string>
    {
        let descendants = new Set<string>();
        let stack = [id];

        while(stack.length > 0)
        {
            let currentId = stack.pop()!;
            let current = this.note_by_id(currentId);
            if(!current) continue;

            for(let childId of current.children)
            {
                if(!descendants.has(childId))
                {
                    descendants.add(childId);
                    stack.push(childId);
                }
            }
        }

        return descendants;
    }

    is_same_mtime(file:TFile)
    {
        let id = file.path;
        let note = this.note_by_id(id);
        if(!note) return false;
        return note.mtime == file.stat.mtime;
    }

    _count_unique(arr:string[]): number
    {
        return new Set(arr).size;
    }

    _is_recursion(arr:string[])
    {
        return this._count_unique(arr) != arr.length;
    }

    _build_path(note:OneNote, path:string[], path_list:string[][])
    {
        // skip infinite loop
        if(this._is_recursion(path)) return;

        // down-to-top, search from last to root
        if(this.is_orphan(note))
        {
            let new_path = ['orphan_dir'].concat(path);
            path_list.push(new_path);
            return;
        }

        if(this.is_top(note))
        {
            let new_path = ['top_dir'].concat(path);
            path_list.push(new_path);
            return;
        }

        for(let parent of note.parents)
        {
            let sub_note = this.note_by_id(parent);
            if(!sub_note) continue;

            let new_path = [sub_note.id].concat(path);
            this._build_path(sub_note, new_path, path_list);
        }
    }

    build_path_list(id: string)
    {
        let note = this.note_by_id(id);
        if(!note) return undefined;

        let path_list: string[][] = [];
        this._build_path(note, [note.id], path_list);

        return path_list;
    }
    
    _get_min_path(path_list: string[][])
    {
        let min_path:string[] = [];
        let min_count = Number.MAX_SAFE_INTEGER;

        for(let path of path_list)
        {
            let len = path.length;

            if(len < min_count)
            {
                min_count = len;
                min_path = path;
            }
        }

        return min_path.slice();
    }

    get_shortest_path(id: string)
    {
        let path_list = this.build_path_list(id);;
        if(!path_list) return undefined;
        let path = this._get_min_path(path_list);
        return path;
    }

    _array_index(path_list: string[][], old_path: string[])
    {
        for(let i in path_list)
        {
            let path = path_list[i];

            if(path.join('/') == old_path.join('/'))
            {
                return parseInt(i);
            }
        }
    }

    _next_index(path_len: number, old_index: number)
    {
        return (path_len > old_index + 1) ? old_index + 1 : 0;
    }

    _split_into_parents(path_list: string[][])
    {
        let parent_list: {[id: string]: string[][];} = {};

        for(let path of path_list)
        {
            let parent:string = path[path.length-2];
            if (!(parent in parent_list)) parent_list[parent] = [];
            parent_list[parent].push(path);
        }

        return parent_list;
    }

    _get_shortest_list(path_list: string[][])
    {
        let parent_list = this._split_into_parents(path_list);
        let shortest_list = [];

        for (let parent in parent_list)
        {
            let path_parent = parent_list[parent];
            shortest_list.push(this._get_min_path(path_parent));
        }

        return shortest_list;
    }

    get_next_path(id: string)
    {
        let path_list = this.build_path_list(id);
        if(!path_list) return undefined;

        // remove similar, save shortest
        path_list = this._get_shortest_list(path_list);

        let old_index = this._array_index(path_list, this.last_active);
        let path = undefined;

        if(old_index === undefined)
        {
            path = this._get_min_path(path_list);
        }
        else
        {
            let next_index = this._next_index(path_list.length, old_index);
            path = path_list[next_index];
        }

        this.last_active = path.slice();
        return path;
    }

    // --- incremental updates ---

    is_filtered(file: TFile): boolean
    {
        for (let filter of this.settings.filter)
        {
            if (file.path.startsWith(filter)) return true;
        }

        if (this.settings.ignored_tags.length > 0)
        {
            let cache = this.app.metadataCache.getFileCache(file);
            if (cache)
            {
                let tags = getAllTags(cache);
                if (tags)
                {
                    for (let tag of tags)
                    {
                        if (this.settings.ignored_tags.includes(tag)) return true;
                    }
                }
            }
        }

        return false;
    }

    rebuild_top_and_sort()
    {
        this.build_top();
        this.sort_links();
    }

    _detach_parents(file_id: string)
    {
        let note = this.note_by_id(file_id);
        if(!note) return;

        for (let parent_id of note.parents)
        {
            let parent = this.note_by_id(parent_id);
            if(parent)
            {
                parent.children = parent.children.filter(id => id !== file_id);
            }
        }
        note.parents = [];
        note.is_pinned = false;
    }

    _detach_children(file_id: string)
    {
        let note = this.note_by_id(file_id);
        if(!note) return;

        for (let child_id of note.children)
        {
            let child = this.note_by_id(child_id);
            if(child)
            {
                child.parents = child.parents.filter(id => id !== file_id);
            }
        }
        note.children = [];
    }

    add_note(file: TFile)
    {
        if(this.is_filtered(file)) return;

        let file_id = file.path;
        this.note_list[file_id] = new OneNote(
            file_id, file.stat.mtime, file.stat.ctime,
            file.basename, this.get_note_title(file)
        );

        this._build_note_links(file);
        this.rebuild_top_and_sort();
    }

    remove_note(file_id: string)
    {
        let note = this.note_by_id(file_id);
        if(!note) return;

        this._detach_parents(file_id);
        this._detach_children(file_id);

        delete this.note_list[file_id];
        this.rebuild_top_and_sort();
    }

    rename_note(file: TFile, oldPath: string)
    {
        let old_note = this.note_by_id(oldPath);
        if(!old_note)
        {
            this.add_note(file);
            return;
        }

        let newPath = file.path;

        // update references in parent notes
        for (let parent_id of old_note.parents)
        {
            let parent = this.note_by_id(parent_id);
            if(parent)
            {
                let idx = parent.children.indexOf(oldPath);
                if(idx !== -1) parent.children[idx] = newPath;
            }
        }

        // update references in child notes
        for (let child_id of old_note.children)
        {
            let child = this.note_by_id(child_id);
            if(child)
            {
                let idx = child.parents.indexOf(oldPath);
                if(idx !== -1) child.parents[idx] = newPath;
            }
        }

        old_note.id = newPath;
        old_note.name = file.basename;
        old_note.title = this.get_note_title(file);
        old_note.mtime = file.stat.mtime;

        delete this.note_list[oldPath];
        this.note_list[newPath] = old_note;

        this.rebuild_top_and_sort();
    }

    _read_expected_parents(file: TFile): string[]
    {
        let parents: string[] = [];
        let metadata = this.app.metadataCache.getFileCache(file);
        if(!metadata || !metadata.frontmatterLinks) return parents;

        for(let link of metadata.frontmatterLinks)
        {
            if(!this.test_prop_name(link.key)) continue;
            let link_file = this.app.metadataCache.getFirstLinkpathDest(link.link, '');
            if(!link_file) continue;
            let link_id = link_file.path;
            if(!(link_id in this.note_list)) continue;
            parents.push(link_id);
        }
        return parents;
    }

    _read_expected_pinned(file: TFile): boolean
    {
        let metadata = this.app.metadataCache.getFileCache(file);
        if(!metadata || !metadata.frontmatter) return false;
        if(!("vf_pinned" in metadata.frontmatter)) return false;
        let value = metadata.frontmatter["vf_pinned"];
        return (value != "0" && value != "false" && value != false);
    }

    _read_expected_icon(file: TFile): string
    {
        let metadata = this.app.metadataCache.getFileCache(file);
        if(!metadata || !metadata.frontmatter) return '';
        if(!(this.settings.icon_prop in metadata.frontmatter)) return '';
        let value = metadata.frontmatter[this.settings.icon_prop];
        return _is_string(value) ? value : '';
    }

    _arrays_equal(a: string[], b: string[]): boolean
    {
        if(a.length !== b.length) return false;
        for(let i = 0; i < a.length; i++)
        {
            if(a[i] !== b[i]) return false;
        }
        return true;
    }

    update_note(file: TFile)
    {
        let file_id = file.path;
        let note = this.note_by_id(file_id);

        if(!note)
        {
            if(!this.is_filtered(file))
            {
                this.add_note(file);
            }
            return;
        }

        if(this.is_filtered(file))
        {
            this.remove_note(file_id);
            return;
        }

        let expected_parents = this._read_expected_parents(file);
        let expected_pinned = this._read_expected_pinned(file);
        let expected_title = this.get_note_title(file);
        let expected_icon = this._read_expected_icon(file);

        if(note.mtime == file.stat.mtime &&
           note.title == expected_title &&
           note.is_pinned == expected_pinned &&
           note.icon == expected_icon &&
           this._arrays_equal(note.parents, expected_parents))
        {
            return;
        }

        let old_utime = note.utime;
        this._detach_parents(file_id);

        note.mtime = file.stat.mtime;
        note.title = expected_title;
        note.is_pinned = expected_pinned;
        note.icon = expected_icon;

        for(let parent_id of expected_parents)
        {
            note.parents.push(parent_id);
            this.note_list[parent_id].children.push(file_id);
        }

        note.utime = old_utime;
        this.rebuild_top_and_sort();
    }
}