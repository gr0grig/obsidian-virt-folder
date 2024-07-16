import { App, FuzzySuggestModal, Notice, FuzzyMatch } from 'obsidian';
import { BaseScanner } from 'base_scanner';

interface NotePath
{
	id: string;
	name: string;
	parents: string[];
	utime: number;
}

export class VF_SelectFile extends FuzzySuggestModal<NotePath>
{
	selected: string = '';

	constructor(app:App, private base: BaseScanner, private onSubmit: (result: string) => void)
	{
		super(app);
		this.setPlaceholder('Type note\'s title');
	}

	getItems(): NotePath[]
	{	
		let notes: NotePath[] = [];

		for (let id in this.base.note_list)
		{
			notes.push(this.base.note_list[id]);
		}

		// sort with update time
		notes.sort(function(a,b){ return b.utime - a.utime});
		return notes;
	}

	getItemText(item: NotePath): string {
		return item.name;
	}

	onChooseItem(item: NotePath, evt: MouseEvent | KeyboardEvent): void
	{
		this.onSubmit(item.id);
	}

	_format_parents(parents: string[])
	{
		let links = [];

		for (let id of parents)
		{
			let note = this.base.note_by_id(id);
			if(!note) continue;

			links.push(note.name);
		}

        return links;
	}

	renderSuggestion(item: FuzzyMatch<NotePath>, el: HTMLElement): void 
	{
		el.createEl('div', {text: item.item.name});
        let small = el.createEl('small', {cls: 'vf_search_parents'});	

        for(let parent of item.item.parents)
        {
            let path: any = this.base.get_shortest_path(parent);
            let links = this._format_parents(path);
            let line = small.createEl('div', {cls:'vf_serach_div'});	

            for(let id of links)
            {
                line.createEl('span', {text: id, cls: 'vf_serach_link'});
            }
        }
	}
}
