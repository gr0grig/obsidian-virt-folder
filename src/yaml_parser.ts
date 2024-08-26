import { App, Notice, TFile } from 'obsidian';
import  VirtFolderPlugin  from 'main';

export class YamlParser
{
	constructor(private app: App, private plugin: VirtFolderPlugin)
	{
        
	}

    showMessage(msg: string)
	{
		new Notice(msg);
	}

    _fm_add_link(front:any, selected: string, prop: string)
    {
        let file = this.app.vault.getFileByPath(selected);
        if(!file) return;
    
        let link = this.app.metadataCache.fileToLinktext(file, '');
        let formated_link = `[[${link}]]`;
    
        if(!this.plugin.settings.UseWikiLinks)
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
        this.app.fileManager.processFrontMatter(file, (fm) => { this._fm_add_link(fm, file_id, yamlProp); });
    }

    _fm_replace_link(front:any, selected: string, prop: string, old_link:string)
    {
        let file = this.app.vault.getFileByPath(selected);
        if(!file) return;
    
        let link = this.app.metadataCache.fileToLinktext(file, '');
        let formated_link = `[[${link}]]`;
    
        if(!this.plugin.settings.UseWikiLinks)
        {
            formated_link = `[${link}](${link})`;
        }
        
        if (prop in front && front[prop])
        {
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
        this.app.fileManager.processFrontMatter(file, (fm) => { this._fm_replace_link(fm, file_id, yamlProp, old_link); });
    }

    _fm_get_links(front:any, prop: string)
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
        this.app.fileManager.processFrontMatter(file, (fm) => { callback(this._fm_get_links(fm, yamlProp)); });
    }

    _fm_remove_link(front:any, prop: string, old_link:string)
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
        this.app.fileManager.processFrontMatter(file, (fm) => { this._fm_remove_link(fm, yamlProp, old_link); });
    }    
};




