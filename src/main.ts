import { TAbstractFile, Plugin, TFile, Notice, Modal, Setting, MarkdownRenderer, ItemView } from 'obsidian';
import { WorkspaceLeaf } from "obsidian";
import { data, active_id } from './components/stores';
import { NoteData } from './data';
import { BaseScanner } from 'base_scanner';
import { VF_SelectFile } from './select_file_modal';
import { VF_SelectPropModal  } from './select_prop_modal';
import { VIEW_TYPE_VF, VirtFolderView as VirtFolderView } from 'tree_view';
import { YamlParser } from 'yaml_parser';
import { VirtFolderSettingTab, VirtFolderSettings, DEFAULT_SETTINGS } from 'settings';
import { VF_IconPickerModal } from './icon_picker_modal';

export default class VirtFolderPlugin extends Plugin
{
	data: NoteData;
	base: BaseScanner;
	yaml: YamlParser;
	settings: VirtFolderSettings;
	
	async onload()
	{
		await this.loadSettings(); // order is important

		this.base = new BaseScanner(this.app, this);
		this.data = new NoteData(this.base);
		this.yaml = new YamlParser(this.app, this);

		this.addSettingTab(new VirtFolderSettingTab(this.app, this));

		this.registerView(
			VIEW_TYPE_VF,
			(leaf) => new VirtFolderView(leaf, this)
		  );

		// add cmd - pin folder (icon='folder-heart')

		this.addCommand({
			id: "open_tree_view",
			name: "Show tree",
			icon: "folder-tree",
			callback: () => {
			  this.VF_OpenTreeView();
			},
		});
 
		this.addCommand({
			id: "add_folder",
			name: "Add folder",
			icon: "folder-plus",
			callback: () => {
				this.VF_AddFolder();
			},
		});

		this.addCommand({
			id: "replace_folder",
			name: "Move folder",
			icon: "folder-output",
			callback: () => {
				this.VF_MoveFolder();
			},
		});

		this.addCommand({
			id: "remove_folder",
			name: "Delete folder",
			icon: "folder-minus",
			callback: () => {
				this.VF_RemoveFolder();
			},
		});

		this.addCommand({
			id: "reveal_active_file",
			name: "Reveal file",
			icon: "folder-search-2",
			callback: () => {
			  this.VF_RevealActiveFile();
			},
		});

		this.addCommand({
			id: "add_selected_to_folder",
			name: "Add selected files to virtual folder",
			icon: "folder-plus",
			callback: () => {
				let files: TFile[] = [];
				let leaves = this.app.workspace.getLeavesOfType('file-explorer');
				if(leaves.length > 0) {
					let view = leaves[0].view as any;
					if(view.tree?.selectedDoms) {
						for(let dom of view.tree.selectedDoms.values()) {
							if(dom.file instanceof TFile) files.push(dom.file);
						}
					}
				}
				if(files.length === 0) {
					let file = this.app.workspace.getActiveFile();
					if(file) files.push(file);
				}
				if(files.length === 0) return;
				this.VF_AddFilesToFolder(files);
			},
		});

		this.addCommand({
			id: "manage_icon",
			name: "Manage icon",
			icon: "image",
			callback: () => {
				this.VF_SetIcon();
			},
		});

		this.addCommand({
			id: "pin_note",
			name: "Pin note",
			icon: "pin",
			callback: () => {
				this.VF_TogglePin();
			},
		});

		this.addCommand({
			id: "navigate_parent",
			name: "Navigate to parent folder",
			icon: "arrow-up",
			callback: () => {
				this.VF_NavigateToParent();
			},
		});

		this.addCommand({
			id: "navigate_next",
			name: "Navigate to next sibling",
			icon: "arrow-down",
			callback: () => {
				this.VF_NavigateToSibling(1);
			},
		});

		this.addCommand({
			id: "navigate_prev",
			name: "Navigate to previous sibling",
			icon: "arrow-up",
			callback: () => {
				this.VF_NavigateToSibling(-1);
			},
		});

		this.addCommand({
			id: "navigate_child",
			name: "Navigate to first child",
			icon: "arrow-down",
			callback: () => {
				this.VF_NavigateToChild();
			},
		});

		this.registerView(VIEW_TYPE_VF_WHATSNEW, (leaf) => new VF_WhatsNewView(leaf, this.manifest.version));

		this.addCommand({
			id: "whatsnew",
			name: "What's new",
			icon: "info",
			callback: () => {
				this.app.workspace.getLeaf('tab').setViewState({
					type: VIEW_TYPE_VF_WHATSNEW,
					active: true,
				});
			},
		});

		this.app.workspace.onLayoutReady(async () =>
		{
			// reactive
			this.data.onStartApp();
			this.update_data();

			let activeFile = this.app.workspace.getActiveFile();
			if(activeFile)
			{
				this.setActiveFile(activeFile);
				let path = this.base.get_next_path(activeFile.path);
				if(path) this.revealFile(path);
			}

			if(this.isFirstRun)
			{
				const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_VF);
				if(leaves.length === 0) this.activateView();
			}

			this.registerEvent(this.app.metadataCache.on("resolve", this.onResolveMetadata));
			this.registerEvent(this.app.workspace.on("file-open", this.onOpenFile, this));
			this.registerEvent(this.app.vault.on("create", this.onCreateFile));
			this.registerEvent(this.app.vault.on("delete", this.onDeleteFile));
			this.registerEvent(this.app.vault.on("rename", this.onRenameFile));

			this.registerEvent(this.app.workspace.on('file-menu', (menu, file, source) => {
				if(!(file instanceof TFile)) return;
				menu.addItem((item) => {
					item.setTitle('Add to virtual folder')
						.setIcon('folder-plus')
						.onClick(() => {
							this.VF_AddFilesToFolder([file]);
						});
				});
				menu.addItem((item) => {
					item.setTitle('Manage icon')
						.setIcon('image')
						.onClick(() => {
							new VF_IconPickerModal(this, (icon: string) => {
								this.yaml.set_icon(file, icon);
								this.update_data();
							}).open();
						});
				});
				let note = this.base.note_by_id(file.path);
				let isPinned = note ? note.is_pinned : false;
				menu.addItem((item) => {
					item.setTitle(isPinned ? 'Unpin note' : 'Pin note')
						.setIcon('pin')
						.onClick(() => {
							this.yaml.toggle_pin(file, !isPinned);
							this.update_data();
						});
				});
			}));

			this.registerEvent(this.app.workspace.on('files-menu', (menu, files, source) => {
				let tfiles = files.filter((f): f is TFile => f instanceof TFile);
				if(tfiles.length === 0) return;
				menu.addItem((item) => {
					item.setTitle('Add to virtual folder')
						.setIcon('folder-plus')
						.onClick(() => {
							this.VF_AddFilesToFolder(tfiles);
						});
				});
			}));
		});
	}

	private isFirstRun = false;

	async loadSettings() {
		let saved = await this.loadData();
		this.isFirstRun = !saved;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
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
		data.set(this.base);
		this.updateActiveFile();
	}

	onOpenFile = (file: TFile | null) =>
	{
		this.setActiveFile(file);

		if(this.settings.autoReveal && file)
		{
			let path = this.base.get_next_path(file.path);
			if(path) this.revealFile(path);
		}
	};
	
	onCreateFile = (file: TAbstractFile) =>
	{
		if(file instanceof TFile && file.extension === 'md')
		{
			this.data.onCreate(file);
			this.update_data();
		}
	};
	
	onDeleteFile = (file: TAbstractFile) =>
	{
		// file can be TFolder or TFile
		if(file instanceof TFile && file.extension === 'md')
		{
			this.data.onDelete(file);
			this.update_data();
		}
	};
	
	onRenameFile = (file: TAbstractFile, oldPath: string) =>
	{
		if(file instanceof TFile && file.extension === 'md')
		{
			// Update customOrder references
			for(let key in this.settings.customOrder)
			{
				let order = this.settings.customOrder[key];
				let idx = order.indexOf(oldPath);
				if(idx !== -1) order[idx] = file.path;
			}
			if(oldPath in this.settings.customOrder)
			{
				this.settings.customOrder[file.path] = this.settings.customOrder[oldPath];
				delete this.settings.customOrder[oldPath];
			}
			this.saveSettings();

			this.data.onRename(file, oldPath);
			this.update_data();
		}
	};
	  
	onResolveMetadata = (file: TFile) =>
	{
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

	async VF_RevealActiveFile()
	{
		await this.activateView();

		let file = this.app.workspace.getActiveFile();
		if(!file) return;

		let path = this.base.get_next_path(file.path);
		if(path) this.revealFile(path);
	}

	updateUsedTime(file_id:string)
    {
        this.base.note_list[file_id].utime = Date.now();
    }

	VF_TogglePin()
	{
		let file = this.app.workspace.getActiveFile();
		if(!file) return;

		let note = this.base.note_by_id(file.path);
		let isPinned = note ? note.is_pinned : false;
		this.yaml.toggle_pin(file, !isPinned);
		this.update_data();
	}

	VF_NavigateToChild()
	{
		let file = this.app.workspace.getActiveFile();
		if(!file) return;

		let note = this.base.note_by_id(file.path);
		if(!note || note.children.length === 0) return;

		this.app.workspace.openLinkText(note.children[0], note.children[0], false);
	}

	VF_NavigateToParent()
	{
		let file = this.app.workspace.getActiveFile();
		if(!file) return;

		let note = this.base.note_by_id(file.path);
		if(!note || note.parents.length === 0) return;

		this.app.workspace.openLinkText(note.parents[0], note.parents[0], false);
	}

	VF_GetSiblingList(noteId: string): string[] | null
	{
		let note = this.base.note_by_id(noteId);
		if(!note) return null;

		if(note.parents.length > 0)
		{
			let parentId = note.parents[0];

			// Prefer the parent from the currently revealed path
			let lastActive = this.base.last_active;
			if(lastActive.length >= 2)
			{
				let lastParent = lastActive[lastActive.length - 2];
				if(note.parents.includes(lastParent)) parentId = lastParent;
			}

			let parent = this.base.note_by_id(parentId);
			if(!parent) return null;
			return parent.children;
		}

		if(note.has_children())
			return this.base.top_list;

		return this.base.orphans_list;
	}

	VF_NavigateToSibling(direction: 1 | -1)
	{
		let file = this.app.workspace.getActiveFile();
		if(!file) return;

		let list = this.VF_GetSiblingList(file.path);
		if(!list || list.length < 2) return;

		let index = list.indexOf(file.path);
		if(index === -1) return;

		let next = (index + direction + list.length) % list.length;
		this.app.workspace.openLinkText(list[next], list[next], false);
	}

	VF_SetIcon()
	{
		let file = this.app.workspace.getActiveFile();
		if(!file) return;

		new VF_IconPickerModal(this, (icon: string) =>
		{
			let activeFile = this.app.workspace.getActiveFile();
			if(!activeFile) return;
			this.yaml.set_icon(activeFile, icon);
			this.update_data();
		}).open();
	}

	VF_AddFolder()
	{
		let file = this.app.workspace.getActiveFile();
		if(!file) return;

		let excludeIds = this.base.get_all_descendants(file.path);
		excludeIds.add(file.path);

		// 1. select file
		new VF_SelectFile(this, (file_id:string) =>
			{
				// 2. add to yaml
				this.yaml.add_link(this.settings.propertyName, file_id);
				this.updateUsedTime(file_id);
				this.update_data();
			},
			excludeIds
		).open();
	}

	VF_AddFilesToFolder(files: TFile[])
	{
		let excludeIds = new Set<string>();
		for(let file of files)
		{
			excludeIds.add(file.path);
			let descendants = this.base.get_all_descendants(file.path);
			for(let d of descendants) excludeIds.add(d);
		}

		new VF_SelectFile(this, (folder_id:string) =>
			{
				for(let file of files)
				{
					this.yaml.add_link_to_file(file, this.settings.propertyName, folder_id);
				}
				this.updateUsedTime(folder_id);
				this.update_data();
			},
			excludeIds
		).open();
	}

	VF_MoveFolder()
	{
		let file = this.app.workspace.getActiveFile();
		if(!file) return;

		let excludeIds = this.base.get_all_descendants(file.path);
		excludeIds.add(file.path);

		// 1. select old link
		new VF_SelectPropModal (this, this.settings.propertyName, (old_link:string) =>
			{
				// 2. select new link
				new VF_SelectFile(this, (file_id:string) =>
					{
						// 3. replace link
						this.yaml.replace_link(this.settings.propertyName, old_link, file_id);
						this.updateUsedTime(file_id);
						this.update_data();
					},
					excludeIds
				).open();
			}
		).open();
	}

	VF_RemoveFolder()
	{
		// 1. select old link
		new VF_SelectPropModal (this, this.settings.propertyName, (old_link:string) =>
			{
				// 2. remove it from the list
				this.yaml.remove_link(this.settings.propertyName, old_link);
				this.update_data();
			}
		).open();
	}

	async createNoteInFolder(parentId: string|null, unique: boolean = false)
	{
		if(unique)
		{
			let commands = (this.app as any).commands;
			if(!commands || !commands.executeCommandById)
			{
				this.yaml.showMessage('Commands API is not available');
				return;
			}

			let ref = this.app.vault.on('create', async (file) => {
				if(!(file instanceof TFile)) return;
				this.app.vault.offref(ref);
				if(parentId) await this.app.fileManager.processFrontMatter(file as TFile, (fm) => {
					this.yaml._fm_add_link(fm, parentId, this.settings.propertyName);
				});

				let metaRef = this.app.metadataCache.on('resolve', (resolved) => {
					if(resolved.path !== (file as TFile).path) return;
					this.app.metadataCache.offref(metaRef);
					this.update_data();
					this.VF_RevealActiveFile();
				});
			});

			let executed = commands.executeCommandById('zk-prefixer');
			if(!executed)
			{
				this.app.vault.offref(ref);
				this.yaml.showMessage('Enable "Unique note creator" core plugin');
			}
			return;
		}

		let folder = this.app.fileManager.getNewFileParent('');
		let prefix = folder.path === '/' ? '' : folder.path + '/';

		let name = 'Untitled';
		let counter = 0;
		let path = `${prefix}${name}.md`;

		while(this.app.vault.getAbstractFileByPath(path))
		{
			counter++;
			path = `${prefix}${name} ${counter}.md`;
		}

		let file = await this.app.vault.create(path, '');

		if(parentId) await this.app.fileManager.processFrontMatter(file, (fm) => {
			this.yaml._fm_add_link(fm, parentId, this.settings.propertyName);
		});

		let metaRef = this.app.metadataCache.on('resolve', (resolved) => {
			if(resolved.path !== path) return;
			this.app.metadataCache.offref(metaRef);
			this.update_data();
			this.VF_RevealActiveFile();
		});

		await this.app.workspace.openLinkText(path, path);
	}

	async deleteNote(noteId: string)
	{
		let file = this.app.vault.getFileByPath(noteId);
		if(!file) return;

		let doDelete = async () => {
			await this.app.vault.trash(file!, true);
			new Notice('Note deleted');
			this.update_data();
		};

		if(this.settings.confirmDelete)
		{
			let note = this.base.note_by_id(noteId);
			let displayName = (note && this.settings.cmdShowTitle) ? note.title : file.basename;
			new VF_ConfirmModal(this.app, doDelete, 'Delete note', `Delete "${displayName}"?`).open();
		}
		else
		{
			await doDelete();
		}
	}

	async deleteNoteRecursive(noteId: string)
	{
		let file = this.app.vault.getFileByPath(noteId);
		if(!file) return;

		let descendants = this.base.get_all_descendants(noteId);
		let allIds = [noteId, ...descendants];

		let note = this.base.note_by_id(noteId);
		let displayName = (note && this.settings.cmdShowTitle) ? note.title : file.basename;

		let title = 'Delete notes';
		let message = `Delete "${displayName}" and ${descendants.size} nested notes?`;

		if(descendants.size === 0)
		{
			title = 'Delete note';
			message = `Delete "${displayName}"?`;
		}

		let doDelete = async () => {
			for(let id of allIds)
			{
				let f = this.app.vault.getFileByPath(id);
				if(f) await this.app.vault.trash(f, true);
			}
			new Notice(`${allIds.length} note(s) deleted`);
			this.update_data();
		};

		new VF_ConfirmModal(this.app, doDelete, title, message).open();
	}

	moveNoteToFolder(noteId:string, oldParentId:string|null, newParentId:string|null)
	{
		let noteFile = this.app.vault.getFileByPath(noteId);
		if(!noteFile) return;

		this.yaml.move_to_folder(noteFile, this.settings.propertyName, oldParentId, newParentId);

		if(newParentId)
		{
			let note = this.base.note_by_id(newParentId);
			if(note) note.utime = Date.now();
		}

		this.update_data();
	}

	reorderNote(noteId: string, targetId: string, parentKey: string, insertBefore: boolean)
	{
		let children: string[];
		if(parentKey === 'top_dir') children = this.base.top_list;
		else if(parentKey === 'orphan_dir') children = this.base.orphans_list;
		else
		{
			let parent = this.base.note_by_id(parentKey);
			if(!parent) return;
			children = parent.children;
		}

		if(!this.settings.customOrder[parentKey])
		{
			this.settings.customOrder[parentKey] = [...children];
		}

		let order = this.settings.customOrder[parentKey].filter(id => id !== noteId);

		let targetIdx = order.indexOf(targetId);
		if(targetIdx === -1) targetIdx = order.length - 1;

		let insertIdx = insertBefore ? targetIdx : targetIdx + 1;
		order.splice(insertIdx, 0, noteId);

		this.settings.customOrder[parentKey] = order;
		this.saveSettings();

		this.base.sort_links();
		this.update_data();
	}
}

class VF_ConfirmModal extends Modal
{
	constructor(app: any, private onConfirm: () => void, private title: string = 'Delete note', private message: string = '')
	{
		super(app);
	}

	onOpen()
	{
		this.titleEl.setText(this.title);
		this.contentEl.createEl('p', {text: this.message});

		new Setting(this.contentEl)
			.addButton((btn) => {
				btn.setButtonText('Delete')
					.setWarning()
					.onClick(() => {
						this.close();
						this.onConfirm();
					});
			})
			.addButton((btn) => {
				btn.setButtonText('Cancel')
					.onClick(() => {
						this.close();
					});
			});
	}
}

const VIEW_TYPE_VF_WHATSNEW = "virt-folder-whatsnew";

const WHATSNEW_MD = `
Thank you for using VirtFolder! ❤️ This is an independent project, and every share helps new users discover it. If the plugin is useful to you, consider telling a friend or [starring the repo on GitHub](https://github.com/gr0grig/obsidian-virt-folder) — it really makes a difference!

---

## May 2026

- **Custom sort order** — manual note ordering via drag-and-drop in \`custom\` sort mode. Drag onto a sibling's top/bottom half to reorder. Order persists across sessions and survives renames.
- **Frontmatter as data attributes** — optional setting to expose all frontmatter as \`data-*\` HTML attributes on tree items, enabling CSS snippet styling based on any YAML property.

## April 2026

- **Tag-based highlighting** — color-coded note backgrounds based on tags. Configurable color and opacity per tag in settings.
- **Sibling navigation improvements** — Navigate next/previous sibling now stays within the current parent context for multi-parent notes.
- **Self-reference protection** — notes linking to themselves in the Folders property are now ignored, preventing them from disappearing from the tree.
- **Folder link as string** — optional setting to write single-parent folder links as a YAML string instead of a list. Auto-converts between string and list when parents change.
- **Click to collapse** — clicking a tree node now toggles expand/collapse (previously only expanded).
- **Array title support** — when the title YAML property is an array, the first element is used (PR #25).

## March 2026

- **Hide notes by tag** — filter notes from the tree by tag (Settings > Ignored tags).
- **Auto-reveal scroll fix** — notes taller than the viewport align to top instead of centering (PR #22).
- **Array property safety** — check if property is array before moving, preventing data corruption (PR #24).
- **Navigation commands** — navigate to parent, next/previous sibling, first child. Reveal active file in tree.
- **Configurable icon property** — YAML property name for emoji icons is now configurable in settings.

## February 2026

- **File explorer integration** — add files to virtual folders from Obsidian's file explorer context menu. Pin/unpin and manage icons from file explorer.
- **Delete with children** — recursive delete option in tree context menu.
- **Drag and drop** — move notes between folders by dragging in the tree. Safety: can't drop onto self or descendants.
- **Create notes from tree** — create note / create unique note via tree context menu. Works at ROOT level and under any note.
- **Database optimization** — incremental updates instead of full rescans.
- **Unicode YAML support** — folder property names now support any language characters.
- **Unique note creator** — integration with the Unique Note Creator plugin for auto-generated note names.
- **Auto-open tree on first run** — the tree view opens automatically when the plugin is installed for the first time.

## August 2024

- **Link format settings** — choose between \`[[WikiLinks]]\` and \`[Markdown](links)\` format for folder links in YAML.
- **Sorting options** — sort tree children by filename, title, creation time, or modification time. Reverse sort order toggle.

## July 2024

- **Initial release** — tree view sidebar with collapsible hierarchy built from YAML frontmatter links.
- **YAML-based structure** — notes define parent-child relationships via a configurable frontmatter property.
- **Custom display title** — use a YAML property as the display title instead of the filename.
- **Mobile support** — full compatibility with Obsidian Mobile.
- **Emoji icons** — set custom emoji icons on notes via an icon picker with categorized groups and search.
- **Pinned notes** — pin notes to the top of their sibling list.
- **Orphans section** — notes with no parents and no children are collected in a collapsible Orphans section.
- **Child counter** — badge showing the number of direct children on each note.
- **Active note highlight** — the currently open note is visually highlighted in the tree.
- **Auto-reveal** — optionally auto-scroll the tree to the active file when switching notes.
- **Confirm before deleting** — optional confirmation dialog for delete actions.
- **Ignored paths** — exclude notes by path prefix from the tree.
`;


class VF_WhatsNewView extends ItemView
{
	private version: string;

	constructor(leaf: WorkspaceLeaf, version: string)
	{
		super(leaf);
		this.version = version;
	}

	getViewType() { return VIEW_TYPE_VF_WHATSNEW; }
	getDisplayText() { return "What's new in VirtFolder"; }
	getIcon() { return "info"; }

	async onOpen()
	{
		let container = this.contentEl;
		container.empty();
		container.addClass('markdown-rendered');
		let md = `# VirtFolder v${this.version}\n` + WHATSNEW_MD;
		await MarkdownRenderer.render(this.app, md, container, '', this);
	}
}

