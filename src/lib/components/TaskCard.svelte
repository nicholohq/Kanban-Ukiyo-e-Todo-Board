<script>
	import { dragHandle } from 'svelte-dnd-action';
	import { PRIORITY_META, CATEGORY_META } from '$lib/stores/todoStore.svelte.js';
	import { formatDueDate, isOverdue, dueRelative } from '$lib/utils/dates.js';

	/**
	 * @type {{
	 *   task: import('$lib/stores/todoStore.svelte.js').Task,
	 *   onedit?: (task: import('$lib/stores/todoStore.svelte.js').Task) => void,
	 *   isdragging?: boolean
	 * }}
	 */
	let { task, onedit, isdragging = false } = $props();

	let overdue = $derived(isOverdue(task.dueDate, task.status));

	let dragging = $state(false);
	let dragTimeout = 0;

	$effect(() => {
		if (isdragging) {
			navigator.vibrate?.(10);
			dragging = true;
		} else if (dragging) {
			clearTimeout(dragTimeout);
			dragTimeout = setTimeout(() => {
				dragging = false;
			}, 100);
		}
		return () => clearTimeout(dragTimeout);
	});

	function handleCardClick() {
		if (dragging) return;
		onedit?.(task);
	}
</script>

<div class="card" class:done={task.status === 'done'} onclick={handleCardClick}>
	<div class="card-top">
		<div
			use:dragHandle
			class="card-handle"
			aria-label="Drag {task.title}"
		>
			<span aria-hidden="true">⠿</span>
		</div>
		<span
			class="dot"
			style="background:{PRIORITY_META[task.priority].tone}"
			title="{PRIORITY_META[task.priority].label} priority"
		></span>
		<h3 class="card-title" title={task.title}>{task.title}</h3>
		<button
			class="icon-btn card-edit"
			onclick|stopPropagation={() => onedit?.(task)}
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
		cursor: default;
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
	.card-handle {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		flex: none;
		cursor: grab;
		border-radius: var(--radius);
		color: var(--charcoal);
		opacity: 0.4;
		transition:
			opacity var(--ease),
			background var(--ease),
			transform var(--ease);
		font-size: 1.1rem;
	}
	.card-handle:hover {
		opacity: 1;
		background: var(--linen-2);
	}
	.card-handle:active {
		opacity: 1;
		cursor: grabbing;
		transform: scale(0.92);
		background: var(--linen-2);
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
		width: 44px;
		height: 44px;
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
