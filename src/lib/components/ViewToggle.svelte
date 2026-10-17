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
		<span aria-hidden="true">▦</span>
		<span class="vt-label">Board</span>
	</button>
	<button
		type="button"
		class="vt-btn"
		class:active={todoStore.view === 'list'}
		aria-pressed={todoStore.view === 'list'}
		onclick={() => todoStore.setView('list')}
	>
		<span aria-hidden="true">☰</span>
		<span class="vt-label">List</span>
	</button>
	<button
		type="button"
		class="vt-btn"
		class:active={todoStore.view === 'notes'}
		aria-pressed={todoStore.view === 'notes'}
		onclick={() => todoStore.setView('notes')}
	>
		<span aria-hidden="true">✎</span>
		<span class="vt-label">Notes</span>
	</button>
</div>

<style>
	.view-toggle {
		display: inline-flex;
		border: var(--border-thin);
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--paper);
		/* Shrink inside the header's action row rather than overflowing it. */
		min-width: 0;
		max-width: 100%;
	}
	.vt-btn {
		font-family: var(--gothic);
		font-weight: 700;
		font-size: 0.85rem;
		/* Fluid side padding: full --s3 when there is room, --s2 when there is not. */
		padding: 10px clamp(var(--s2), 3vw, var(--s3));
		background: var(--paper);
		color: var(--charcoal);
		border: none;
		cursor: pointer;
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--s1);
		/* Sized to the label by default; equal thirds of the row on narrow
		   viewports, where the toggle gets a full-width row of its own. */
		flex: 1 1 auto;
		min-width: 0;
		white-space: nowrap;
		transition: background var(--ease);
	}
	.vt-label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	/* Segment divider, drawn rather than bordered so that all three buttons
	   keep exactly the same box size. */
	.vt-btn + .vt-btn::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 0;
		border-left: var(--border-thin);
	}
	.vt-btn:hover {
		background: var(--linen-2);
	}
	.vt-btn.active {
		background: var(--indigo);
		color: var(--linen);
	}

	@media (max-width: 520px) {
		/* The toggle already owns a full row here (see Header), so segment it
		   into equal thirds instead of hugging each label. */
		.vt-btn {
			flex: 1 1 0;
		}
	}
</style>
