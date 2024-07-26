import { App, TFile } from 'obsidian';
import { BaseScanner } from 'base_scanner';

export class NoteData
{
    constructor(private base: BaseScanner)
    {
        // refector later
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