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

    add_link_to_file(file:TFile, yamlProp:string, file_id:string)
    {
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
            front[prop] = [formated_link];
            this.showMessage(`Set ${prop}: ${link}`);
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

    _extract_link_base(link:string): string|null
    {
        let regexp = /(?:\[\[(.+?)\||\[\[(.+?)\]\]|\[.+?\]\((.+?)\))/;
        let match = regexp.exec(link);
        if(!match) return null;
        return match[1] || match[2] || match[3] || null;
    }

    _find_link_for_path(front:any, prop:string, targetPath:string): string|null
    {
        if(!(prop in front) || !front[prop]) return null;

        for(let rawLink of front[prop])
        {
            let linkBase = this._extract_link_base(rawLink);
            if(!linkBase) continue;
            let resolved = this.app.metadataCache.getFirstLinkpathDest(linkBase, '');
            if(resolved && resolved.path === targetPath) return rawLink;
        }
        return null;
    }

    set_icon(file: TFile, icon: string)
    {
        this.app.fileManager.processFrontMatter(file, (fm) => {
            if(icon)
            {
                fm[this.plugin.settings.iconProp] = icon;
                this.showMessage(`Icon set: ${icon}`);
            }
            else
            {
                delete fm[this.plugin.settings.iconProp];
                this.showMessage('Icon removed');
            }
        });
    }

    toggle_pin(file: TFile, pin: boolean)
    {
        this.app.fileManager.processFrontMatter(file, (fm) => {
            if(pin)
            {
                fm['vf_pinned'] = true;
                this.showMessage('Note pinned');
            }
            else
            {
                delete fm['vf_pinned'];
                this.showMessage('Note unpinned');
            }
        });
    }

    move_to_folder(noteFile:TFile, yamlProp:string, oldParentPath:string|null, newParentPath:string|null)
    {
        this.app.fileManager.processFrontMatter(noteFile, (fm) =>
        {
            if (!Array.isArray(fm[yamlProp])) {
                fm[yamlProp] = [fm[yamlProp]];
            }

            if(oldParentPath)
            {
                let rawLink = this._find_link_for_path(fm, yamlProp, oldParentPath);
                if(rawLink)
                {
                    fm[yamlProp].remove(rawLink);
                }
            }

            if(newParentPath)
            {
                this._fm_add_link(fm, newParentPath, yamlProp);
            }
            else if(oldParentPath)
            {
                this.showMessage(`${yamlProp}'s link removed`);
            }
        });
    }
};




