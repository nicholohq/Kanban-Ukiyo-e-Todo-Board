<script>
	import { todoStore } from '$lib/stores/todoStore.svelte.js';
	import { isFilterActive } from '$lib/utils/filters.js';
	import CategoryFilter from './CategoryFilter.svelte';
	import PriorityFilter from './PriorityFilter.svelte';
	import TagFilter from './TagFilter.svelte';

	/** @type {{ open?: boolean, onclose?: () => void }} */
	let { open = false, onclose } = $props();

	let active = $derived(isFilterActive(todoStore.filters));

	// Lock body scroll while the mobile drawer is open (desktop sidebar is static).
	$effect(() => {
		if (!open || typeof window === 'undefined') return;
		if (!window.matchMedia('(max-width: 768px)').matches) return;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="sb-backdrop" onclick={onclose}></div>
{/if}

<aside class="sidebar" class:open aria-label="Filters" aria-hidden={undefined}>
	<div class="sidebar-head">
		<h2><span aria-hidden="true">絞</span> Filters</h2>
		<button class="icon-btn close-btn" onclick={onclose} aria-label="Close filters">×</button>
	</div>

	<div class="sidebar-scroll">
		<CategoryFilter />
		<PriorityFilter />
		<TagFilter />
	</div>

	<button
		class="btn btn--ghost clear"
		disabled={!active}
		onclick={() => todoStore.clearFilters()}
	>
		Clear all filters
	</button>
</aside>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		gap: var(--s4);
		padding: var(--s4);
		background: var(--paper);
		border: var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		align-self: start;
		position: sticky;
		top: calc(62px + var(--s4));
	}
	.sidebar-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.sidebar-head h2 {
		font-size: 1.05rem;
		margin: 0;
	}
	.sidebar-head h2 span {
		color: var(--vermilion);
	}
	.close-btn {
		display: none;
	}
	.sidebar-scroll {
		display: flex;
		flex-direction: column;
		gap: var(--s4);
	}
	.clear {
		border: var(--border-thin);
		justify-content: center;
	}

	.sb-backdrop {
		display: none;
	}

	/* --- Drawer behaviour on mobile --- */
	@media (max-width: 768px) {
		.sidebar {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			height: 100vh;
			height: 100dvh;
			width: min(320px, 86vw);
			z-index: 200;
			border-radius: 0;
			border-width: 0 4px 0 0;
			box-shadow: 6px 0 0 rgba(0, 0, 0, 0.15);
			transform: translateX(-105%);
			transition: transform 0.25s ease;
			overflow-y: auto;
		}
		.sidebar.open {
			transform: translateX(0);
		}
		.close-btn {
			display: inline-grid;
		}
		.sb-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 150;
			background: rgba(26, 42, 58, 0.5);
		}
	}
</style>
