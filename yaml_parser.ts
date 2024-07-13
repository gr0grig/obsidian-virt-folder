import { App, Notice } from 'obsidian';

export class YamlParser
{
    useMarkdownLinks:boolean;

	constructor(private app:App)
	{
		// undocumented
		this.useMarkdownLinks = ((this.app.vault as any).getConfig('useMarkdownLinks'));
	}

    showMessage(msg: string)
	{
		new Notice(msg);
	}

    _parse_frontmatter(front:any, selected: string, prop: string)
    {
        let file = this.app.vault.getFileByPath(selected);
        if(!file) return;
    
        let link = this.app.metadataCache.fileToLinktext(file, '');
        let formated_link = `[[${link}]]`;
    
        if(this.useMarkdownLinks)
        {
            formated_link = `[${link}](${link})`;
        }
        
        // add link to Folders
        if (prop in front && front[prop])
        {
            // check wiki and md ?
            if(front[prop].contains(formated_link))
            {
                this.showMessage(`${prop}'s link already exist`);
                return;
            }
        }
        else
        {
            front[prop] = [];
        }
        
        front[prop].push(formated_link);
        this.showMessage(`Set ${prop}: ${link}`);
    }

    add_link(yamlProp:string, file_id:string)
    {
        let file = this.app.workspace.getActiveFile();
        if(!file) return;
        this.app.fileManager.processFrontMatter(file, (fm) => { this._parse_frontmatter(fm, file_id, yamlProp); });
    }

    _parse_frontmatter_2(front:any, selected: string, prop: string, old_link:string)
    {
        let file = this.app.vault.getFileByPath(selected);
        if(!file) return;
    
        let link = this.app.metadataCache.fileToLinktext(file, '');
        let formated_link = `[[${link}]]`;
    
        if(this.useMarkdownLinks)
        {
            formated_link = `[${link}](${link})`;
        }
        
        // add link to Folders
        if (prop in front && front[prop])
        {
            // check wiki and md ?
            if(front[prop].contains(formated_link))
            {
                this.showMessage(`${prop}'s link already exist`);
                return;
            }

            if(!front[prop].contains(old_link))
            {
                this.showMessage(`Can't find ${old_link} in ${prop}`);
                return;
            }

            // replace old one
            let i = front[prop].indexOf(old_link);
            front[prop][i] = formated_link;
            this.showMessage(`Set ${prop}: ${link}`);
        }
        else
        {
            front[prop] = [];
        }
    }

    replace_link(yamlProp:string, old_link:string, file_id:string)
    {
        let file = this.app.workspace.getActiveFile();
        if(!file) return;
        this.app.fileManager.processFrontMatter(file, (fm) => { this._parse_frontmatter_2(fm, file_id, yamlProp, old_link); });
    }

    _parse_frontmatter_3(front:any, prop: string)
    {
        if (prop in front && front[prop])
        {
            return front[prop]
        }
        else
        {
            return [];
        }
    }

    get_links(yamlProp:string, callback: (result: string[]) => void)
    {
        let file = this.app.workspace.getActiveFile();
        if(!file) return;
        this.app.fileManager.processFrontMatter(file, (fm) => { callback(this._parse_frontmatter_3(fm, yamlProp)); });
    }

    _parse_frontmatter_4(front:any, prop: string, old_link:string)
    {
        if (prop in front && front[prop])
        {
            if (front[prop].contains(old_link))
            {
                front[prop].remove(old_link);
                this.showMessage(`${prop}'s link removed`);
            }
            else
            {
                this.showMessage(`${prop}'s link not exist`);
            }
        }
    }

    remove_link(yamlProp:string, old_link:string)
    {
        let file = this.app.workspace.getActiveFile();
        if(!file) return;
        this.app.fileManager.processFrontMatter(file, (fm) => { this._parse_frontmatter_4(fm, yamlProp, old_link); });
    }
   
};




