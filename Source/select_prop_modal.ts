import { App, SuggestModal, Notice } from 'obsidian';
import { BaseScanner } from 'base_scanner';
import { YamlParser } from 'yaml_parser';

function get_link_base(link:string)
{
    /*
        [[link1]]
        [[link2|name]]
        [name](link3)
    */

    let regexp_1 = /(?:\[\[(.+?)\||\[\[(.+?)\]\]|\[.+?\]\((.+?)\))/;
    let result = null
    let match = regexp_1.exec(link);

    if (match)
    {
        if (match[1]) result = match[1];
        if (match[2]) result = match[2];
        if (match[3]) result = match[3];
    }
    
    return result;
}

interface NoteLink
{
	name: string;
    full: string;
}

export class VF_SelectPropModal  extends SuggestModal<NoteLink>
{
    useMarkdownLinks: boolean;
    yamlProp: string;
    prop_list: string[];

	constructor(app:App, private base: BaseScanner, private yaml: YamlParser, private onSubmit: (result: string) => void)
	{
		super(app);
		
		this.useMarkdownLinks = ((this.app.vault as any).getConfig('useMarkdownLinks'));
		this.setPlaceholder('Select one to remove');
        this.yamlProp = 'Folders';
	}

    open()
    {
		this.yaml.get_links(this.yamlProp, (links)=>
		{
            if(links.length == 0)
			{
                // do nothig if empty prop list
                new Notice(`${this.yamlProp} is empty`)
				return;
			}
	
			if(links.length == 1)
			{
                // return immediately if only one link
                this.onSubmit(links[0]);
                return;
			}

            // redner list if multiple links
            super.open();
		});
    }
    
    async getSuggestions(query: string): Promise<NoteLink[]>
    {
		let notes: NoteLink[] = [];
        let file = this.app.workspace.getActiveFile();

		if(file)
		{
			await this.app.fileManager.processFrontMatter(file, (fm) => {this._get_prop_list(fm, this.yamlProp); });

            for(let item of this.prop_list)
            {
                let name = get_link_base(item);
                if (!name) continue;
                notes.push({name:name, full:item})
            }
		}
        
        return notes;
    }

    renderSuggestion(item: NoteLink, el: HTMLElement)
    {
        el.createEl('div', {text: item.name});
    }

    onChooseSuggestion(item: NoteLink, evt: MouseEvent | KeyboardEvent)
    {
        this.onSubmit(item.full);
    }

	_get_prop_list(front:any, prop: string)
	{
		if (prop in front && front[prop])
		{
            this.prop_list = front[prop];
		}
		else
		{
			this.prop_list = [];
		}
	}
}
