<script>
	import { todoStore } from '$lib/stores/todoStore.svelte.js';
</script>

<div class="view-toggle" role="group" aria-label="Choose view">
	<button
		type="button"
		class="vt-btn"
		class:active={todoStore.view === 'board'}
		aria-pressed={todoStore.view === 'board'}
		onclick={() => todoStore.setView('board')}
	>
		<span aria-hidden="true">▦</span> Board
	</button>
	<button
		type="button"
		class="vt-btn"
		class:active={todoStore.view === 'list'}
		aria-pressed={todoStore.view === 'list'}
		onclick={() => todoStore.setView('list')}
	>
		<span aria-hidden="true">☰</span> List
	</button>
</div>

<style>
	.view-toggle {
		display: inline-flex;
		border: var(--border-thin);
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--paper);
	}
	.vt-btn {
		font-family: var(--gothic);
		font-weight: 700;
		font-size: 0.85rem;
		padding: var(--s2) var(--s3);
		background: var(--paper);
		color: var(--charcoal);
		border: none;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: var(--s1);
		transition: background var(--ease);
	}
	.vt-btn + .vt-btn {
		border-left: var(--border-thin);
	}
	.vt-btn:hover {
		background: var(--linen-2);
	}
	.vt-btn.active {
		background: var(--indigo);
		color: var(--linen);
	}
</style>
