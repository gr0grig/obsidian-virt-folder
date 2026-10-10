<script lang="ts">
	import Note from "./Note.svelte";
	import { data } from './stores';
	import { tick } from 'svelte';

	const children: Record<string, Note | null> = {};

	export async function focusTo(pathNotes: string[])
	{
		// Relocation can create/remove root components during the next flush.
		await tick();
		const [first, ...remaining] = pathNotes;
		if(!first) return;
		await children[first]?.focusNotes(remaining);
	}

</script>

{#if $data !== undefined}
	<Note type="top_dir" node_path={['top_dir']} bind:this={children['top_dir']} />
	{#if $data.orphans_list.length && !$data.settings.hide_orphans}
	<Note type="orphan_dir" node_path={['orphan_dir']} bind:this={children['orphan_dir']} />
	{/if}
{/if}

