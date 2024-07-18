<script lang="ts">
	import Note from "./Note.svelte";
	import { data } from './stores';

	const children: Record<string, Note> = {};

	export function focusTo(pathNotes: string[])
	{
		let first:string|undefined = pathNotes.shift();
		if(!first) return;
		children[first].focusNotes(pathNotes);
	}

</script>

{#if $data !== undefined}
	<Note type="top_dir" node_path={['top_dir']} bind:this={children['top_dir']} />
	{#if $data.orphans_list.length}
	<Note type="orphan_dir" node_path={['orphan_dir']} bind:this={children['orphan_dir']} />
	{/if}
{/if}

