<script>
	import { todoStore, PRIORITY_META, CATEGORY_META } from '$lib/stores/todoStore.svelte.js';
	import { formatDueDate, isOverdue, dueRelative } from '$lib/utils/dates.js';
	import { slide } from 'svelte/transition';

	/**
	 * @type {{
	 *   task: import('$lib/stores/todoStore.svelte.js').Task,
	 *   onedit?: (task: import('$lib/stores/todoStore.svelte.js').Task) => void,
	 *   ondelete?: (task: import('$lib/stores/todoStore.svelte.js').Task) => void
	 * }}
	 */
	let { task, onedit, ondelete } = $props();

	let expanded = $state(false);

	let overdue = $derived(isOverdue(task.dueDate, task.status));
	let done = $derived(task.status === 'done');
	let rowId = $derived(`row-${task.id}`);
</script>

<article class="row" class:done>
	<input
		type="checkbox"
		class="check"
		checked={done}
		onchange={() => todoStore.toggleDone(task.id)}
		aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
	/>

	<div class="main">
		<div class="title-line">
			<button
				class="title"
				class:has-desc={task.description}
				onclick={() => (expanded = task.description ? !expanded : expanded)}
				aria-expanded={task.description ? expanded : undefined}
				aria-controls={task.description ? rowId : undefined}
				title={task.title}
			>
				{task.title}
			</button>
		</div>

		<div class="meta">
			<span class="badge" style="border-color:{PRIORITY_META[task.priority].tone}">
				<span class="dot" style="background:{PRIORITY_META[task.priority].tone}"></span>
				{PRIORITY_META[task.priority].label}
			</span>
			<span class="badge">{CATEGORY_META[task.category].label}</span>
			{#each task.tags as tag (tag)}
				<span class="chip">#{tag}</span>
			{/each}
			{#if task.dueDate}
				<span class="due" class:overdue title={dueRelative(task.dueDate)}>
					<span aria-hidden="true">📅</span>
					{formatDueDate(task.dueDate)}{#if overdue}<span class="due-flag"> · overdue</span>{/if}
				</span>
			{/if}
		</div>

		{#if expanded && task.description}
			<p id={rowId} class="desc" transition:slide={{ duration: 160 }}>{task.description}</p>
		{/if}
	</div>

	<div class="row-actions">
		<button class="icon-btn" onclick={() => onedit?.(task)} aria-label="Edit {task.title}"
			>✎</button
		>
		<button
			class="icon-btn icon-btn--danger"
			onclick={() => ondelete?.(task)}
			aria-label="Delete {task.title}">🗑</button
		>
	</div>
</article>

<style>
	.row {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: start;
		gap: var(--s3);
		padding: var(--s3);
		background: var(--paper);
		border: var(--border-thin);
		border-radius: var(--radius);
		box-shadow: var(--shadow-sm);
		transition: box-shadow var(--ease), transform var(--ease);
	}
	.row:hover {
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 var(--charcoal);
	}
	.row.done {
		opacity: 0.7;
		background: var(--linen-2);
	}
	.check {
		width: 22px;
		height: 22px;
		margin-top: 2px;
		accent-color: var(--matcha);
		cursor: pointer;
		flex: none;
	}
	.main {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--s2);
	}
	.title {
		font-family: var(--serif);
		font-weight: 600;
		font-size: 1rem;
		text-align: left;
		background: none;
		border: none;
		padding: 0;
		color: var(--charcoal);
		cursor: default;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.title.has-desc {
		cursor: pointer;
	}
	.title.has-desc::after {
		content: ' ▾';
		font-size: 0.7rem;
		color: var(--indigo);
	}
	.done .title {
		text-decoration: line-through;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s1) var(--s2);
	}
	.due {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--indigo);
	}
	.due.overdue {
		color: var(--vermilion);
	}
	.desc {
		font-size: 0.88rem;
		line-height: 1.5;
		color: var(--charcoal);
		background: var(--linen);
		border-left: 3px solid var(--gold);
		padding: var(--s2) var(--s3);
		border-radius: 0 4px 4px 0;
		white-space: pre-wrap;
	}
	.row-actions {
		display: flex;
		gap: var(--s1);
		flex: none;
	}

	@media (max-width: 520px) {
		.row {
			grid-template-columns: auto 1fr;
		}
		.row-actions {
			grid-column: 2;
			justify-content: flex-end;
		}
	}
</style>
