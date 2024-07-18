import { App, TFile } from 'obsidian';
import { BaseScanner } from 'base_scanner';
import VirtFolderPlugin from 'main';

export class NoteData
{
    base: BaseScanner;

    constructor(private plugin: VirtFolderPlugin)
    {
        this.base = new BaseScanner(plugin.app, plugin.settings.propertyName);
    }

    onStartApp()
    {
        this.base.rescan();
    }

    onCreate(file: TFile)
    {
        this.base.rescan();
    }

    onChange(file:TFile)
    {
        this.base.rescan();      
    }

    onRename(file:TFile, oldPath:string)
    {
        this.base.rescan();      
    }

    onDelete(file: TFile)
    {
        this.base.rescan();      
    }
}