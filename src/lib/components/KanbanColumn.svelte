<script>
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import TaskCard from './TaskCard.svelte';
	import { todoStore, STATUS_META } from '$lib/stores/todoStore.svelte.js';

	/**
	 * @type {{
	 *   status: import('$lib/stores/todoStore.svelte.js').Status,
	 *   tasks: import('$lib/stores/todoStore.svelte.js').Task[],
	 *   onedit?: (task: any) => void
	 * }}
	 */
	let { status, tasks, onedit } = $props();

	const flipDurationMs = 160;

	// Local, drag-owned copy of the column. svelte-dnd-action mutates this list
	// during a drag; we commit to the store on finalize.
	let items = $state(tasks);
	// Plain (non-reactive) flag: while true, don't let store updates clobber the
	// in-progress drag. Read live inside the effect below.
	let dragging = false;

	// Resync from the store whenever it changes and we're not mid-drag.
	$effect(() => {
		const next = tasks;
		if (!dragging) items = next;
	});

	/** @param {CustomEvent<{items: any[]}>} e */
	function handleConsider(e) {
		dragging = true;
		items = e.detail.items;
	}

	/** @param {CustomEvent<{items: any[]}>} e */
	function handleFinalize(e) {
		items = e.detail.items;
		dragging = false;
		todoStore.setColumn(
			status,
			items.map((i) => i.id)
		);
	}
</script>

<section class="column" aria-label="{STATUS_META[status].label} column">
	<header class="col-head" style="--tone:{STATUS_META[status].tone}">
		<span class="col-kanji" aria-hidden="true">{STATUS_META[status].kanji}</span>
		<h2>{STATUS_META[status].label}</h2>
		<span class="col-count">{items.length}</span>
	</header>

	<div
		class="col-body"
		use:dndzone={{ items, flipDurationMs, dropTargetStyle: {} }}
		onconsider={handleConsider}
		onfinalize={handleFinalize}
	>
		{#each items as task (task.id)}
			<div class="card-wrap" animate:flip={{ duration: flipDurationMs }}>
				<TaskCard {task} {onedit} />
			</div>
		{/each}
	</div>

	{#if items.length === 0}
		<p class="col-empty">Drop tasks here</p>
	{/if}
</section>

<style>
	.column {
		display: flex;
		flex-direction: column;
		background: var(--linen-2);
		border: var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		min-height: 200px;
		overflow: hidden;
	}
	.col-head {
		display: flex;
		align-items: center;
		gap: var(--s2);
		padding: var(--s3);
		background: var(--paper);
		border-bottom: var(--border);
		border-left: 8px solid var(--tone);
	}
	.col-head h2 {
		font-size: 1rem;
		margin: 0;
	}
	.col-kanji {
		font-family: var(--serif);
		font-size: 1.3rem;
		color: var(--tone);
	}
	.col-count {
		margin-left: auto;
		font-weight: 700;
		font-size: 0.8rem;
		background: var(--indigo);
		color: var(--linen);
		border-radius: 999px;
		padding: 1px 10px;
	}
	.col-body {
		display: flex;
		flex-direction: column;
		gap: var(--s2);
		padding: var(--s2);
		flex: 1;
		min-height: 80px;
		overflow-y: auto;
		max-height: calc(100vh - 220px);
	}
	.card-wrap {
		outline: none;
	}
	.col-empty {
		text-align: center;
		font-size: 0.82rem;
		color: #8a857c;
		padding: var(--s3);
		margin: 0 var(--s2) var(--s2);
		border: 2px dashed #b8b1a4;
		border-radius: var(--radius);
	}

	@media (max-width: 768px) {
		.col-body {
			max-height: none;
		}
	}
</style>
