import { App, FuzzySuggestModal, Notice, FuzzyMatch } from 'obsidian';
import { OneNote } from 'onenote';
import  VirtFolderPlugin  from 'main';

interface ShowedItem
{
	id: string;
	name: string;
	title: string;
	parents: string[];
	utime: number;
}

export class VF_SelectFile extends FuzzySuggestModal<ShowedItem>
{
	selected: string = '';

	constructor(private plugin: VirtFolderPlugin, private onSubmit: (result: string) => void)
	{
		super(plugin.app);
		this.setPlaceholder('Type note\'s title');
	}

	getAliases(note: OneNote)
	{
		// next time			
	}

	getItemName(item: ShowedItem)
	{
		if(this.plugin.settings.cmdSearchBy == 'title') return item.title;
		return item.name;
	}

	getItemText(item: ShowedItem): string
	{
		return this.getItemName(item);
	}

	getItems(): ShowedItem[]
	{	
		let notes: ShowedItem[] = [];

		for (let id in this.plugin.base.note_list)
		{
			notes.push(this.plugin.base.note_list[id]);
		}

		// sort with update time
		notes.sort(function(a,b){ return b.utime - a.utime});
		return notes;
	}

	onChooseItem(item: ShowedItem, evt: MouseEvent | KeyboardEvent): void
	{
		this.onSubmit(item.id);
	}

	_format_parents(parents: string[])
	{
		let links = [];

		for (let id of parents)
		{
			let note = this.plugin.base.note_by_id(id);
			if(!note) continue;
			links.push(this.getItemName(note));
		}

        return links;
	}

	renderSuggestion(item: FuzzyMatch<ShowedItem>, el: HTMLElement): void 
	{
		el.createEl('div', {text: this.getItemName(item.item)});
        let small = el.createEl('small', {cls: 'vf_search_parents'});	

        for(let parent of item.item.parents)
        {
            let path: any = this.plugin.base.get_shortest_path(parent);
            let links = this._format_parents(path);
            let line = small.createEl('div', {cls:'vf_serach_div'});	

            for(let id of links)
            {
                line.createEl('span', {text: id, cls: 'vf_serach_link'});
            }
        }
	}
}
