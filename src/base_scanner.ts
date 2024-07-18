import { App, TFile } from 'obsidian';
import { OneNote } from 'onenote';

export class BaseScanner
{
    note_list:  {[id: string] : OneNote} = {};
    top_list: string[] = [];
    orphans_list: string[] = [];
    last_active: string[] = ["1"];
    filter:string[] = [];
    prop_name:string;
    prop_regexp:RegExp;

    constructor(private app: App, prop_name:string)
    {
        this.set_prop_name(prop_name);
    }

    set_prop_name(prop_name:string)
    {
        this.prop_name = prop_name;
        let regexp_str = `^${prop_name}(\\.\\d+){0,1}$`;        
        this.prop_regexp = new RegExp(regexp_str);
    }

    test_prop_name(prop_name:string)
    {
        return this.prop_regexp.test(prop_name.trim());
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
        let old_list = this.note_list;
        this.init_note_list();
        this.build_links();
        this.build_top();
        this.sort_links();
        this.restore_utime(old_list)
    }

    set_filter(filter:string[])
    {
        this.filter = filter;
    }

    get_filtred_count()
    {
        return this.app.vault.getMarkdownFiles().length - this.get_filted_list().length;
    }

    get_filted_list()
    {
        return this.app.vault.getMarkdownFiles().filter( (file) => 
        {
            for (let filter of this.filter)
            {
                if (file.path.startsWith(filter)) return false;
            }

            return true;
        });
    }

    init_note_list()
    {
        this.note_list = {}

        // create empty notes
        for (let file of this.get_filted_list())
        {
            let file_id = file.path
            this.note_list[file_id] = new OneNote(file_id, file.stat.mtime, file.stat.ctime, file.basename);
        }
    }

    filter_note_list()
    {
        // convert path separator to / ?

        let filter = 'Templates'

        for (let file_id in this.note_list)
        {
            if(file_id.startsWith(filter))
            {
                delete this.note_list[file_id];
            }
        }
    }

    build_links()
    {
        for (let file of this.get_filted_list())
        {
            let file_id = file.path

            let metadata = this.app.metadataCache.getFileCache(file);
            if (!metadata) continue;
			
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
                if("IsPinned" in metadata.frontmatter)
                {
                    let value = metadata.frontmatter["IsPinned"];
                    this.note_list[file_id].is_pinned = (value != "0" && value != "false");
                }		
            }
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
		let pinned = [];
		let normal = [];

		// cut array into pinned and normal items

		for(let id of links)
		{
            let note = this.note_list[id];

        	if(note.is_pinned)
			{
				pinned.push(id);
			}
			else
			{
				normal.push(id);
			}
		}

		pinned.sort();
		normal.sort();
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
        let min_count = 999;

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

    _get_shoretest_list(path_list: string[][])
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
        path_list = this._get_shoretest_list(path_list);

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
}