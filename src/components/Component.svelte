<script lang="ts">
	import Note from "./Note.svelte";
	import { data } from './stores';
	import { tick } from 'svelte';
	import { projectSearchTree } from '../search';
	export let matches: Set<string> | null = null;
	$: searchTree = matches && $data ? projectSearchTree($data, matches) : null;

	const children: Record<string, Note | null> = {};

	export async function focusTo(pathNotes: string[])
	{
		if(matches !== null) return;
		// Relocation can create/remove root components during the next flush.
		await tick();
		const [first, ...remaining] = pathNotes;
		if(!first) return;
		await children[first]?.focusNotes(remaining);
	}

</script>

{#if $data !== undefined}
	<div hidden={matches !== null}>
	<Note type="top_dir" node_path={['top_dir']} bind:this={children['top_dir']} />
	{#if $data.orphans_list.length && !$data.settings.hide_orphans}
	<Note type="orphan_dir" node_path={['orphan_dir']} bind:this={children['orphan_dir']} />
	{/if}
	</div>
	{#if searchTree}
		{#key matches}
			<Note type="top_dir" node_path={['top_dir']} tree={searchTree} />
		{/key}
	{/if}
{/if}

