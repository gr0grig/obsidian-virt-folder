import { ItemView, WorkspaceLeaf, SearchComponent } from "obsidian";
import Component from "./components/Component.svelte";
import { plugin, data } from './components/stores';
import VirtFolderPlugin  from './main';
import { createCoreQuery, findMatches } from './search';

export const TREE_ICON = "folder-tree";
export const VIEW_TYPE_VF = "virt-folder-view";

export class VirtFolderView extends ItemView
{
	component: Component;
	icon = TREE_ICON;
	private searchInput: SearchComponent;
	private searchEl: HTMLElement;
	private statusEl: HTMLElement;
	private query = '';
	private searchVersion = 0;
	private searchTimer: ReturnType<typeof setTimeout> | undefined;
	private closed = false;

	constructor(leaf: WorkspaceLeaf, private plugin: VirtFolderPlugin) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_VF;
	}

	getDisplayText() {
		return "VirtFolder";
	}

  async onOpen() {
	plugin.set(this.plugin);
	this.closed = false;
	this.searchEl = this.contentEl.createDiv('vf-tree-search');
	this.searchInput = new SearchComponent(this.searchEl)
		.setPlaceholder('Search notes…')
		.onChange(value => {
			this.query = value.trim();
			this.scheduleSearch();
		});
	this.searchInput.inputEl.setAttribute('aria-label', 'Search virtual folders');
	this.statusEl = this.searchEl.createDiv('vf-search-status');
	this.statusEl.setAttribute('role', 'status');
	this.registerDomEvent(this.searchInput.inputEl, 'keydown', event => {
		if (event.key === 'Escape') {
			event.preventDefault();
			this.searchInput.setValue('');
			this.query = '';
			this.scheduleSearch();
		}
	});

    this.component = new Component({
      target: this.contentEl.createDiv('vf-tree-content')
    });
	this.register(data.subscribe(() => {
		if (this.query) this.scheduleSearch();
	}));
  }

	private scheduleSearch() {
		const version = ++this.searchVersion;
		clearTimeout(this.searchTimer);
		if (!this.query) {
			this.component.$set({ matches: null });
			this.statusEl.setText('');
			return;
		}
		this.statusEl.setText('Searching…');
		this.searchTimer = setTimeout(() => void this.runSearch(version), 180);
	}

	private async runSearch(version: number) {
		const cancelled = () => this.closed || version !== this.searchVersion;
		try {
			const query = createCoreQuery(this.app, this.query);
			const files = this.app.vault.getMarkdownFiles().filter(file => file.path in this.plugin.base.note_list);
			const matches = await findMatches(this.app, files, query, cancelled);
			if (cancelled() || !matches) return;
			this.component.$set({ matches });
			this.statusEl.setText(matches.size ? `${matches.size} matching ${matches.size === 1 ? 'note' : 'notes'}` : 'No matching notes');
		} catch (error) {
			if (cancelled()) return;
			this.component.$set({ matches: new Set<string>() });
			this.statusEl.setText(error instanceof Error ? error.message : String(error));
		}
	}

  async onClose() {
	this.closed = true;
	this.searchVersion++;
	clearTimeout(this.searchTimer);
    this.component.$destroy();
  }

  getComponent()
  {
	return this.component;
  }
}
