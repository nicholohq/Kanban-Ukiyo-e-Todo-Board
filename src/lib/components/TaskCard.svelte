<script>
	import { PRIORITY_META, CATEGORY_META } from '$lib/stores/todoStore.svelte.js';
	import { formatDueDate, isOverdue, dueRelative } from '$lib/utils/dates.js';

	/**
	 * @type {{
	 *   task: import('$lib/stores/todoStore.svelte.js').Task,
	 *   onedit?: (task: import('$lib/stores/todoStore.svelte.js').Task) => void
	 * }}
	 */
	let { task, onedit } = $props();

	let overdue = $derived(isOverdue(task.dueDate, task.status));
</script>

<div class="card" class:done={task.status === 'done'}>
	<div class="card-top">
		<span
			class="dot"
			style="background:{PRIORITY_META[task.priority].tone}"
			title="{PRIORITY_META[task.priority].label} priority"
		></span>
		<h3 class="card-title" title={task.title}>{task.title}</h3>
		<button
			class="icon-btn card-edit"
			onclick={() => onedit?.(task)}
			aria-label="Edit {task.title}">✎</button
		>
	</div>

	{#if task.description}
		<p class="card-desc">{task.description}</p>
	{/if}

	<div class="card-foot">
		<span class="chip cat">{CATEGORY_META[task.category].label}</span>
		{#if task.dueDate}
			<span class="due" class:overdue title={dueRelative(task.dueDate)}>
				<span aria-hidden="true">📅</span>
				{formatDueDate(task.dueDate)}
			</span>
		{/if}
		{#if task.tags.length}
			<span class="tagcount" title={task.tags.join(', ')}>
				<span aria-hidden="true">🏷</span>{task.tags.length}
			</span>
		{/if}
	</div>
</div>

<style>
	.card {
		background: var(--paper);
		border: var(--border-thin);
		border-radius: var(--radius);
		box-shadow: var(--shadow-sm);
		padding: var(--s3);
		display: flex;
		flex-direction: column;
		gap: var(--s2);
		cursor: grab;
	}
	.card:active {
		cursor: grabbing;
	}
	.card.done {
		background: var(--linen-2);
		opacity: 0.8;
	}
	.card-top {
		display: flex;
		align-items: center;
		gap: var(--s2);
	}
	.card-title {
		flex: 1;
		min-width: 0;
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.3;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.done .card-title {
		text-decoration: line-through;
	}
	.card-edit {
		flex: none;
		width: 28px;
		height: 28px;
		font-size: 0.9rem;
	}
	.card-desc {
		font-size: 0.82rem;
		line-height: 1.45;
		color: #55524c;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.card-foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s1) var(--s2);
	}
	.cat {
		font-size: 0.7rem;
		border-color: var(--gold);
		color: var(--charcoal);
	}
	.due {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--indigo);
	}
	.due.overdue {
		color: var(--vermilion);
	}
	.tagcount {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--matcha);
	}
</style>
