export class OneNote
{
    id: string; // file.path
    name: string;
    title: string;
    mtime: number;
    utime: number = 0; // created or used as folder

    parents: string[] = [];
	children: string[] = [];
	is_pinned: boolean = false;
	icon: string = '';
	highlight_color: string = '';
	highlight_opacity: number = 0;
	metadata: Record<string, string> = {};

    
    constructor(id: string, mtime: number, ctime: number, name:string, title:string)
    {
        this.id = id;
        this.mtime = mtime;
        this.name = name;
        this.title = title;
        this.utime = ctime;
    }

    clear()
    {
        this.parents = [];
        this.children = [];
        this.is_pinned = false;
        this.highlight_color = '';
        this.highlight_opacity = 0;
        this.metadata = {};
        this.mtime = 0;
        this.utime = 0;
    }

    is_no_parents(): boolean
    {
        return this.parents.length == 0;
    }

    is_no_children(): boolean
    {
        return this.children.length == 0;
    }

    has_children(): boolean
	{
		return this.children.length > 0;
	}

	count_children(): number
	{
		return this.children.length;
	}
}