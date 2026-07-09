<script>
	import { todoStore, STATUSES, STATUS_META } from '$lib/stores/todoStore.svelte.js';
	import { isFilterActive } from '$lib/utils/filters.js';
	import TaskRow from './TaskRow.svelte';
	import EmptyState from './EmptyState.svelte';

	/**
	 * @type {{
	 *   onedit?: (task: import('$lib/stores/todoStore.svelte.js').Task) => void,
	 *   onnew?: () => void
	 * }}
	 */
	let { onedit, onnew } = $props();

	/** @type {'created'|'due'|'priority'|'title'} */
	let sort = $state('created');

	const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

	/** @type {Record<string, (a: any, b: any) => number>} */
	const comparators = {
		created: (a, b) => b.createdAt - a.createdAt,
		title: (a, b) => a.title.localeCompare(b.title),
		priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
		due: (a, b) => {
			if (!a.dueDate && !b.dueDate) return 0;
			if (!a.dueDate) return 1;
			if (!b.dueDate) return -1;
			return a.dueDate.localeCompare(b.dueDate);
		}
	};

	// Sort a copy, then bucket by status (preserving sorted order).
	let grouped = $derived.by(() => {
		const sorted = [...todoStore.filteredTasks].sort(comparators[sort]);
		/** @type {Record<string, any[]>} */
		const g = { todo: [], 'in-progress': [], done: [] };
		for (const t of sorted) (g[t.status] ?? g.todo).push(t);
		return g;
	});

	let hasTasks = $derived(todoStore.filteredTasks.length > 0);
	let filtered = $derived(isFilterActive(todoStore.filters));
</script>

<div class="list-view">
	<div class="list-toolbar">
		<div class="field sort-field">
			<label for="sort">Sort by</label>
			<select id="sort" class="select" bind:value={sort}>
				<option value="created">Newest</option>
				<option value="due">Due date</option>
				<option value="priority">Priority</option>
				<option value="title">Title (A–Z)</option>
			</select>
		</div>
	</div>

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
							<TaskRow {task} {onedit} />
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
	.list-toolbar {
		display: flex;
		justify-content: flex-end;
	}
	.sort-field {
		flex-direction: row;
		align-items: center;
		gap: var(--s2);
	}
	.sort-field label {
		white-space: nowrap;
	}
	.sort-field .select {
		width: auto;
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
