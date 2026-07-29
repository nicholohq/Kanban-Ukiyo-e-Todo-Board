<script>
	import { todoStore, STATUSES } from '$lib/stores/todoStore.svelte.js';
	import { isFilterActive } from '$lib/utils/filters.js';
	import KanbanColumn from './KanbanColumn.svelte';
	import EmptyState from './EmptyState.svelte';

	/**
	 * @type {{
	 *   onedit?: (task: any) => void,
	 *   onnew?: () => void
	 * }}
	 */
	let { onedit, onnew } = $props();

	let anyTasks = $derived(todoStore.filteredTasks.length > 0);
	let filtered = $derived(isFilterActive(todoStore.filters));
</script>

{#if anyTasks || !filtered}
	<div class="board">
		{#each STATUSES as status (status)}
			<KanbanColumn {status} tasks={todoStore.board[status]} {onedit} />
		{/each}
	</div>
{:else}
	<EmptyState
		kanji="無"
		title="No tasks match your filters"
		message="Try clearing search or filters to see the board."
	/>
{/if}

<style>
	.board {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--s3);
		align-items: start;
	}

	@media (max-width: 1024px) {
		.board {
			grid-template-columns: 1fr;
		}
	}
</style>
