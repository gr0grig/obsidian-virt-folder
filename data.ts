import { App, TFile, FrontMatterCache, FrontmatterLinkCache} from 'obsidian';
import { BaseScanner } from 'base_scanner';

export class NoteData
{
    base: BaseScanner;

    constructor(private app: App)
    {
        this.base = new BaseScanner(app);
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