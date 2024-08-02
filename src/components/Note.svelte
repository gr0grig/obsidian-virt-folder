<script lang="ts">

	// based on `obsidian-dendron-tree-1.3.0`

	export let id = "unknown-link-id";
	export let type = "sub_note"; // or "top_dir" or "orphan_dir"
	export let node_path: string[] = []; // set by parents

	import { getPlugin, data, active_id } from "./stores";
	import { slide } from "svelte/transition";
	import { getIcon } from "obsidian";
	import { OneNote } from "onenote";
	import type { Action } from "svelte/action";
	import { tick } from "svelte";
	
    
    let plugin = getPlugin();
	let note: OneNote;

	let title = id;
	let isCollapsed = true;
	let IsOpened = false;

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
		}

		if(type == "orphan_dir")
		{
			title = 'Orphans';
			childCounter = $data.orphans_list.length;
			childList = $data.orphans_list;
		}

		if(type == "sub_note")
		{
			note = $data.note_list[id];

			if (note)
			{
				title = note.title;
				childCounter = note.count_children();
				childList = note.children;
			}
		}
	}

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
		//debugger;
		let elementRect = myElement.getBoundingClientRect();
		let absoluteElementTop = elementRect.top + window.scrollY;
		let middle = absoluteElementTop - (window.innerHeight / 2);
		myElement.win.scrollTo(0, middle);
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
				//scrollIntoMiddle();
				//  "center" | "end" | "nearest" | "start";
				myElement.scrollIntoView({block: "center"});
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
		class="tree-item-self is-clickable mod-collapsible {IsOpened ? 'current_note' : ''}"
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
			
			isCollapsed = false;
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
			{title} 
		</div>

    {#if childCounter > 0}
        <span class="counter">
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


<style>
   	.counter {
        text-align: right;
        margin-left: auto;
		background-color: var(--background-secondary-alt);
		position: sticky;
		top: 0;
		color: var(--text-normal);
        padding: 2px 4px;
	}

	.current_note
	{
		background-color: var(--background-secondary-alt);
	}

</style>