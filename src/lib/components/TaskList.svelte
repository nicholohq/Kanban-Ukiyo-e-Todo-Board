<script>
	import { todoStore, STATUSES, STATUS_META } from '$lib/stores/todoStore.svelte.js';
	import { isFilterActive } from '$lib/utils/filters.js';
	import TaskRow from './TaskRow.svelte';
	import EmptyState from './EmptyState.svelte';

	/**
	 * @type {{
	 *   onedit?: (task: import('$lib/stores/todoStore.svelte.js').Task) => void,
	 *   ondelete?: (task: import('$lib/stores/todoStore.svelte.js').Task) => void,
	 *   onnew?: () => void,
	 *   oncontextmenu?: (task: any, x: number, y: number) => void
	 * }}
	 */
	let { onedit, ondelete, onnew, oncontextmenu } = $props();

	// Bucket the filtered tasks by status, preserving store order (newest first).
	let grouped = $derived.by(() => {
		/** @type {Record<string, any[]>} */
		const g = { todo: [], 'in-progress': [], done: [] };
		for (const t of todoStore.filteredTasks) (g[t.status] ?? g.todo).push(t);
		return g;
	});

	let hasTasks = $derived(todoStore.filteredTasks.length > 0);
	let filtered = $derived(isFilterActive(todoStore.filters));
</script>

<div class="list-view">
	{#if hasTasks}
		{#each STATUSES as status (status)}
			{#if grouped[status].length}
				<section class="group" aria-labelledby="grp-{status}">
					<h2 id="grp-{status}" class="group-head">
						<span class="group-kanji" aria-hidden="true">{STATUS_META[status].kanji}</span>
						{STATUS_META[status].label}
						<span class="group-count">{grouped[status].length}</span>
					</h2>
					<div class="group-rows">
						{#each grouped[status] as task (task.id)}
							<TaskRow {task} {onedit} {ondelete} {oncontextmenu} />
						{/each}
					</div>
				</section>
			{/if}
		{/each}
	{:else if filtered}
		<EmptyState
			kanji="無"
			title="No tasks match your filters"
			message="Try clearing search or filters to see more."
		/>
	{:else}
		<EmptyState kanji="始" title="No tasks yet" message="Create your first task to get going.">
			<button class="btn btn--primary" onclick={onnew}>＋ New task</button>
		</EmptyState>
	{/if}
</div>

<style>
	.list-view {
		display: flex;
		flex-direction: column;
		gap: var(--s4);
	}
	.group {
		display: flex;
		flex-direction: column;
		gap: var(--s2);
	}
	.group-head {
		display: flex;
		align-items: center;
		gap: var(--s2);
		font-size: 1rem;
		padding-bottom: var(--s1);
		border-bottom: var(--border-thin);
	}
	.group-kanji {
		color: var(--vermilion);
		font-size: 1.2rem;
	}
	.group-count {
		margin-left: auto;
		font-family: var(--gothic);
		font-size: 0.8rem;
		font-weight: 700;
		background: var(--indigo);
		color: var(--linen);
		border-radius: 999px;
		padding: 1px 10px;
	}
	.group-rows {
		display: flex;
		flex-direction: column;
		gap: var(--s2);
	}
</style>
