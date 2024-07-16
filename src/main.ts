import { TAbstractFile, Plugin, TFile } from 'obsidian';
import { WorkspaceLeaf } from "obsidian";
import { data, active_id } from './components/stores';
import { NoteData } from './data';
import { VF_SelectFile } from './select_file_modal';
import { VF_SelectPropModal  } from './select_prop_modal';
import { VIEW_TYPE_VF, RIBBON_ICON, VirtFolderView as VirtFolderView } from 'tree_view';
import { YamlParser } from 'yaml_parser';
import { VirtFolderSettingTab, VirtFolderSettings, DEFAULT_SETTINGS } from 'settings';

export default class VirtFolderPlugin extends Plugin
{
	data: NoteData;
	yaml: YamlParser;
	settings: VirtFolderSettings;
	
	async onload()
	{
		this.data = new NoteData(this.app);
		this.yaml = new YamlParser(this.app);

		await this.loadSettings(); // order is important
		this.addSettingTab(new VirtFolderSettingTab(this.app, this));

		this.registerView(
			VIEW_TYPE_VF,
			(leaf) => new VirtFolderView(leaf, this)
		  );

		this.addRibbonIcon(RIBBON_ICON, "Activate view", () => {
			this.activateView();
		});

		this.addCommand({
			id: "vf_reveal_active_file",
			name: "Reveal active file in folder's tree",
			callback: () => {
			  this.VF_RevealActiveFile();
			},
		});

		this.addCommand({
			id: "vf_open_tree_view",
			name: "Open tree view",
			callback: () => {
			  this.VF_OpenTreeView();
			},
		});
 
		this.addCommand({
			id: "vf_add_folder",
			name: "Add folder to YAML",
			callback: () => {
				this.VF_AddFolder();
			},
		});

		this.addCommand({
			id: "vf_replace_folder",
			name: "Replace folder in YAML",
			callback: () => {
				this.VF_MoveFolder();
			},
		});

		this.addCommand({
			id: "vf_remove_folder",
			name: "Remove folder from YAML",
			callback: () => {
				this.VF_RemoveFolder();
			},
		});

		this.app.workspace.onLayoutReady(() => 
		{
			// reactive
			this.data.onStartApp();
			this.update_data();

			this.registerEvent(this.app.metadataCache.on("resolve", this.onResolveMetadata));
			this.registerEvent(this.app.workspace.on("file-open", this.onOpenFile, this));
			this.registerEvent(this.app.vault.on("create", this.onCreateFile));
			this.registerEvent(this.app.vault.on("delete", this.onDeleteFile));
			this.registerEvent(this.app.vault.on("rename", this.onRenameFile));
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	updateActiveFile()
	{
		let file = this.app.workspace.getActiveFile();
		if(file) active_id.set(file.path);
		else active_id.set('');
	}

	setActiveFile(file: TFile | null)
	{
		if(file instanceof TFile)
		{
			active_id.set(file.path);
		}else{
			active_id.set('');
		}
	}

	update_data()
	{
		data.set(this.data.base);
		this.updateActiveFile();
	}

	onOpenFile = (file: TFile | null) => 
	{
		this.setActiveFile(file);
	};
	
	onCreateFile = (file: TAbstractFile) => 
	{
		if(file instanceof TFile)
		{
			this.data.onCreate(file);
			this.update_data();
		}
	};
	
	onDeleteFile = (file: TAbstractFile) =>
	{
		// file can be TFolder or TFile
		if(file instanceof TFile)
		{
			this.data.onDelete(file);
			this.update_data();
		}
	};
	
	onRenameFile = (file: TAbstractFile, oldPath: string) =>
	{
		if(file instanceof TFile)
		{
			this.data.onRename(file, oldPath);
			this.update_data();
		}
	};
	  
	onResolveMetadata = (file: TFile) =>
	{
		if (this.data.base.is_same_mtime(file))
		{
			return; 
		}

		this.data.onChange(file);
		this.update_data();
	};

	revealFile(path: string[])
	{
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_VF))
		{
			if (!(leaf.view instanceof VirtFolderView)) continue;
			leaf.view.component.focusTo(path);
		}
	}

	async activateView()
	{
		const { workspace } = this.app;
	
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_VF);
	
		if (leaves.length > 0) {
		  // A leaf with our view already exists, use that
		  leaf = leaves[0];
		} else {
		  // Our view could not be found in the workspace, create a new leaf
		  // in the right sidebar for it
		  leaf = workspace.getLeftLeaf(false);
		  if (leaf) await leaf.setViewState({ type: VIEW_TYPE_VF, active: true });
		}
	
		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf) workspace.revealLeaf(leaf);
	}

	VF_OpenTreeView()
	{
		this.activateView();
	}

	VF_RevealActiveFile()
	{
		this.activateView();

		let file = this.app.workspace.getActiveFile();
		if(!file) return;

		let path = this.data.base.get_next_path(file.path);
		if(path) this.revealFile(path);
	}

	updateUsedTime(file_id:string)
    {
        this.data.base.note_list[file_id].utime = Date.now();
    }

	VF_AddFolder()
	{
		let file = this.app.workspace.getActiveFile();
		if(!file) return;

		// 1. select file 
		new VF_SelectFile(this.app, this.data.base, (file_id:string) =>
			{
				// 2. add to yaml
				this.yaml.add_link('Folders', file_id);
				this.updateUsedTime(file_id);
				this.update_data();
			}
		).open();
	}

	VF_MoveFolder()
	{
		let file = this.app.workspace.getActiveFile();
		if(!file) return;

		// 1. select old link
		new VF_SelectPropModal (this.app, this.data.base, this.yaml, (old_link:string) =>
			{
				// 2. select new link
				new VF_SelectFile(this.app, this.data.base, (file_id:string) =>
					{
						// 3. replace link
						this.yaml.replace_link('Folders', old_link, file_id);
						this.updateUsedTime(file_id);
						this.update_data();
					}
				).open();
			}
		).open();
	}

	VF_RemoveFolder()
	{
		// 1. select old link
		new VF_SelectPropModal (this.app, this.data.base, this.yaml, (old_link:string) =>
			{
				// 2. remove it from the list
				this.yaml.remove_link('Folders', old_link);
				this.update_data();
			}
		).open();
	}
}

