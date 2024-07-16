import { ItemView, WorkspaceLeaf } from "obsidian";
import Component from "./components/Component.svelte";
import { plugin } from './components/stores';
import VirtFolderPlugin  from './main';

export const TREE_ICON = "folder-tree";
export const VIEW_TYPE_VF = "virt-folder-view";

export class VirtFolderView extends ItemView
{
	component: Component;
	icon = TREE_ICON;

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

    this.component = new Component({
      target: this.contentEl
    });
  }

  async onClose() {
    this.component.$destroy();
  }

  getComponent()
  {
	return this.component;
  }
}
