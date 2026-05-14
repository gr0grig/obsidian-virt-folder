<script lang="ts">

	// based on `obsidian-dendron-tree-1.3.0`

	export let id = "unknown-link-id";
	export let type = "sub_note"; // or "top_dir" or "orphan_dir"
	export let node_path: string[] = []; // set by parents

	import { getPlugin, data, active_id } from "./stores";
	import { slide } from "svelte/transition";
	import { getIcon, Notice, Menu } from "obsidian";
	import { OneNote } from "onenote";
	import { SortTypes } from "settings";
	import { VF_IconPickerModal } from "../icon_picker_modal";
	import type { Action } from "svelte/action";
	import { tick } from "svelte";
	
    
    let plugin = getPlugin();
	let note: OneNote;

	let title = id;
	let noteIcon = '';
	let isPinned = false;
	let isCollapsed = true;
	let IsOpened = false;
	let highlightColor = '';
	let highlightOpacity = 0;
	let dataAttrs: Record<string, string> = {};

    let childCounter = 0;
	let childList: any[] = [];
	let myElement: HTMLDivElement;
	const children: Record<string, any> = {};

	$:
	{
		IsOpened = (id == $active_id);

		if(type == "top_dir")
		{
			title = 'ROOT';
			childCounter = $data.top_list.length;
			childList = $data.top_list;
			dataAttrs = {};
		}

		if(type == "orphan_dir")
		{
			title = 'Orphans';
			childCounter = $data.orphans_list.length;
			childList = $data.orphans_list;
			dataAttrs = {};
		}

		if(type == "sub_note")
		{
			note = $data.note_list[id];

			if (note)
			{
				title = note.title;
				noteIcon = note.icon || '';
				isPinned = note.is_pinned;
				highlightColor = note.highlight_color || '';
				highlightOpacity = note.highlight_opacity || 0;
				childCounter = note.count_children();
				childList = note.children;

				let attrs: Record<string, string> = {};
				for(let key in note.metadata)
				{
					attrs['data-' + key] = note.metadata[key];
				}
				dataAttrs = attrs;
			}
		}
	}

	$: tagHighlightStyle = (highlightColor && highlightOpacity > 0 && !IsOpened)
		? `background-color: color-mix(in srgb, ${highlightColor} ${highlightOpacity * 100}%, transparent)`
		: '';

	const applyDataAttrs: Action<HTMLElement, Record<string, string>> = function(node, attrs) {
		let prev: string[] = [];
		function update(newAttrs: Record<string, string>) {
			for(let key of prev) node.removeAttribute(key);
			prev = Object.keys(newAttrs);
			for(let key of prev) node.setAttribute(key, newAttrs[key]);
		}
		update(attrs);
		return { update };
	};

	const collapsedIcon: Action = function (node) {
	    node.appendChild(getIcon("right-triangle")!);
    };


	let expandTransitionWaiter: Promise<void> = Promise.resolve();
	let expandTransitionEnd: (value: void) => void;
	
	function expandTransitionStart() {
		expandTransitionWaiter = new Promise((resolve) => {
			expandTransitionEnd = resolve;
		});
	}

	function build_path(id: string)
	{
		return node_path.concat([id]);
	}

    function openNote(id:string, new_tab:boolean = false)
    {
		if(type == "top_dir" || type == "orphan_dir")
		{
			return;
		}

		// is file exist ?
        plugin.app.workspace.openLinkText(id, id, new_tab);   
    }

	function scrollIntoMiddle()
    {
        let scrollable = myElement.closest('.view-content') as HTMLElement;
        if (!scrollable) return; // Fallback if not found

        let elementRect = myElement.getBoundingClientRect();
        let containerRect = scrollable.getBoundingClientRect();
        let elementTopRelative = elementRect.top - containerRect.top + scrollable.scrollTop;
        let elementHeight = elementRect.height;
        let containerHeight = containerRect.height;


        if (elementHeight <= containerHeight) {
            // Center the element if it fits
            let targetTop = elementTopRelative - (containerHeight / 2) + (elementHeight / 2);
            scrollable.scrollTop = targetTop;
        } else {
            // Align the top of the element with the top of the container if it doesn't fit
            scrollable.scrollTop = elementTopRelative;
        }
    }

	let dropMode: 'none' | 'target' | 'before' | 'after' = 'none';

	function getDragParentId(): string|null
	{
		let parentId = node_path[node_path.length - 2];
		if(parentId === 'top_dir' || parentId === 'orphan_dir') return null;
		return parentId;
	}

	function getRawParentId(): string|null
	{
		return node_path.length >= 2 ? node_path[node_path.length - 2] : null;
	}

	function handleDragStart(event: DragEvent)
	{
		if(type !== 'sub_note' || !event.dataTransfer) return;
		event.dataTransfer.setData('text/plain', JSON.stringify({
			id: id,
			parentId: getDragParentId(),
			rawParentId: getRawParentId()
		}));
		event.dataTransfer.effectAllowed = 'move';
	}

	function handleDragOver(event: DragEvent)
	{
		event.preventDefault();
		if(event.dataTransfer) event.dataTransfer.dropEffect = 'move';

		if(plugin.settings.sortTreeBy === SortTypes.custom && type === 'sub_note')
		{
			let rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
			dropMode = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
		}
		else
		{
			dropMode = 'target';
		}
	}

	function handleDragLeave()
	{
		dropMode = 'none';
	}

	function handleDrop(event: DragEvent)
	{
		event.preventDefault();
		dropMode = 'none';
		if(!event.dataTransfer) return;

		let dragData;
		try { dragData = JSON.parse(event.dataTransfer.getData('text/plain')); }
		catch { return; }

		let draggedId: string = dragData.id;
		let oldParentId: string|null = dragData.parentId;
		let draggedRawParent: string|null = dragData.rawParentId;

		if(draggedId === id || node_path.includes(draggedId))
		{
			new Notice("Can't move a folder into itself");
			return;
		}

		// Reorder: same parent, custom sort, sub_note target
		let myRawParent = getRawParentId();
		if(draggedRawParent && draggedRawParent === myRawParent &&
		   plugin.settings.sortTreeBy === SortTypes.custom &&
		   type === 'sub_note')
		{
			let rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
			let insertBefore = event.clientY < rect.top + rect.height / 2;
			plugin.reorderNote(draggedId, id, draggedRawParent, insertBefore);
			return;
		}

		// Move to different parent
		let newParentId: string|null = null;
		if(type === 'sub_note') newParentId = id;

		if(oldParentId === newParentId) return;

		plugin.moveNoteToFolder(draggedId, oldParentId, newParentId);
	}

	function handleContextMenu(event: MouseEvent)
	{
		if(type !== 'sub_note' && type !== 'top_dir') return;

		event.preventDefault();

		const menu = new Menu();

		let folderId = type === 'top_dir' ? null : id;

		menu.addItem((item) => {
			item.setTitle('Create note')
				.setIcon('plus')
				.onClick(() => {
					plugin.createNoteInFolder(folderId);
				});
		});

		if((plugin.app as any).internalPlugins?.getPluginById('zk-prefixer')?.enabled)
		{
			menu.addItem((item) => {
				item.setTitle('Create unique note')
					.setIcon('fingerprint')
					.onClick(() => {
						plugin.createNoteInFolder(folderId, true);
					});
			});
		}

		if(type === 'sub_note')
		{
			let file = plugin.app.vault.getFileByPath(id);

			if(file)
			{
				menu.addItem((item) => {
					item.setTitle('Manage icon')
						.setIcon('image')
						.onClick(() => {
							new VF_IconPickerModal(plugin, (icon: string) => {
								let f = plugin.app.vault.getFileByPath(id);
								if(!f) return;
								plugin.yaml.set_icon(f, icon);
								plugin.update_data();
							}).open();
						});
				});

				let isPinned = note ? note.is_pinned : false;
				menu.addItem((item) => {
					item.setTitle(isPinned ? 'Unpin note' : 'Pin note')
						.setIcon('pin')
						.onClick(() => {
							let f = plugin.app.vault.getFileByPath(id);
							if(!f) return;
							plugin.yaml.toggle_pin(f, !isPinned);
							plugin.update_data();
						});
				});
			}

			menu.addSeparator();

			menu.addItem((item) => {
				item.setTitle('Delete note')
					.setIcon('trash-2')
					.onClick(() => {
						plugin.deleteNote(id);
					});
			});

			if(note && note.has_children())
			{
				menu.addItem((item) => {
					item.setTitle('Delete with children')
						.setIcon('trash-2')
						.onClick(() => {
							plugin.deleteNoteRecursive(id);
						});
				});
			}
		}

		menu.showAtMouseEvent(event);
	}

	export const focusNotes = async (pathNotes: string[]) =>
	{
		isCollapsed = false;
		await tick();

		let next:string|undefined = pathNotes.shift();

		if(pathNotes.length === 0) await expandTransitionWaiter;
		
		if(!next)
		{	
			if(myElement)
			{
				scrollIntoMiddle();
			}
			return;
		}

		if(next in children)
		{
			children[next].focusNotes(pathNotes);
		}
	}




</script>


<div class="tree-item is-clickable" bind:this={myElement}>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="tree-item-self is-clickable mod-collapsible {IsOpened ? 'vf-current-note' : ''}"
		class:vf-tag-highlight={tagHighlightStyle !== ''}
		class:vf-drop-target={dropMode === 'target'}
		class:vf-drop-before={dropMode === 'before'}
		class:vf-drop-after={dropMode === 'after'}
		style={tagHighlightStyle}
		use:applyDataAttrs={dataAttrs}
		draggable={type === 'sub_note'}
		on:dragstart={handleDragStart}
		on:dragover|preventDefault={handleDragOver}
		on:dragleave={handleDragLeave}
		on:drop={handleDrop}
		on:contextmenu={handleContextMenu}
		on:click={(event) =>
		{
			if(event.shiftKey)
			{
				openNote(id, false);
				return;
			}
			
			if(event.ctrlKey)
			{
				openNote(id, true);
				return;
			}
			
			isCollapsed = !isCollapsed;
			openNote(id);
		}}
	>
        
    {#if childCounter > 0}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="tree-item-icon collapse-icon"
			class:is-collapsed={isCollapsed}
			on:click|stopPropagation={() => {
				isCollapsed = !isCollapsed;
			}}
            use:collapsedIcon
		/>
    {/if}
    
		<div class="tree-item-inner">
			{#if noteIcon}
				<span class="vf-note-icon">{noteIcon}</span>
			{/if}
			{title}
			{#if isPinned}
				<span class="vf-pin-icon">📌</span>
			{/if}
		</div>

    {#if childCounter > 0}
        <span class="vf-counter">
            {childCounter}
        </span>
    {/if}

	</div>

	{#if childCounter > 0 && !isCollapsed}
		<div
			class="tree-item-children"
			transition:slide={{ duration: 100 }}
			on:introstart={expandTransitionStart}
			on:introend={() => {
				// expandTransitionEnd is dyanmic listener
				expandTransitionEnd();
			}}
		>

			{#each childList as child (child)}
				<svelte:self id={child} node_path="{build_path(child)}" bind:this={children[child]} />
			{/each}


		</div>
	{/if}
</div>
