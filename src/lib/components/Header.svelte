<script>
	import { todoStore } from '$lib/stores/todoStore.svelte.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { goto } from '$app/navigation';
	import ViewToggle from './ViewToggle.svelte';

	/** @type {{ onnew?: () => void, ontogglesidebar?: () => void, onchangepassword?: () => void }} */
	let { onnew, ontogglesidebar, onchangepassword } = $props();

	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	async function handleLogout() {
		menuOpen = false;
		await auth.logout();
		goto('/login');
	}

	let q = $state(todoStore.filters.search);
	// Last value this input committed to the store — lets us tell our own
	// (debounced) writes apart from external changes like "Clear filters".
	let lastPushed = todoStore.filters.search;
	/** @type {HTMLInputElement|null} */
	let searchEl = $state(null);
	/** @type {ReturnType<typeof setTimeout>|undefined} */
	let timer;

	// Debounce search input -> store (250ms).
	$effect(() => {
		const val = q;
		clearTimeout(timer);
		timer = setTimeout(() => {
			lastPushed = val;
			todoStore.setSearch(val);
		}, 250);
		return () => clearTimeout(timer);
	});

	// Pull the store value back into the box ONLY when it changed externally
	// (e.g. "Clear filters"), never mid-debounce — otherwise typing gets wiped.
	$effect(() => {
		const s = todoStore.filters.search;
		if (s !== lastPushed && s !== q) {
			q = s;
			lastPushed = s;
		}
	});

	function clearSearch() {
		q = '';
		searchEl?.focus();
	}

	/** @param {KeyboardEvent} e — Ctrl/Cmd+K focuses search. */
	function onWindowKeydown(e) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			searchEl?.focus();
			searchEl?.select();
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<header class="app-header">
	<div class="brand">
		<button
			class="hamburger icon-btn"
			onclick={ontogglesidebar}
			aria-label="Toggle filters"
			title="Toggle filters"
		>
			<span aria-hidden="true">☰</span>
		</button>
		<span class="brand-kanji" aria-hidden="true">浮世</span>
		<div class="brand-text">
			<h1>Ukiyo Kanban</h1>
			<p class="brand-sub">
				{todoStore.counts.filtered} of {todoStore.counts.total} tasks
			</p>
		</div>
	</div>

	<div class="search">
		<span class="search-icon" aria-hidden="true">🔍</span>
		<input
			bind:this={searchEl}
			bind:value={q}
			class="input search-input"
			type="text"
			placeholder="Search tasks…  (Ctrl+K)"
			aria-label="Search tasks by title or description"
		/>
		{#if q}
			<button class="search-clear" onclick={clearSearch} aria-label="Clear search">×</button>
		{/if}
	</div>

	<div class="actions">
		<ViewToggle />
		<button class="btn btn--primary" onclick={onnew}>
			<span aria-hidden="true">＋</span> New task
		</button>

		<div class="user-menu">
			<button
				class="user-btn"
				onclick={toggleMenu}
				aria-haspopup="true"
				aria-expanded={menuOpen}
				title="Account"
			>
				<span class="user-avatar" aria-hidden="true">{auth.user?.username?.charAt(0).toUpperCase() ?? '?'}</span>
				<span class="user-name">{auth.user?.username ?? ''}</span>
				<span class="user-caret" aria-hidden="true">▾</span>
			</button>

			{#if menuOpen}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<div
					class="menu-backdrop"
					onclick={toggleMenu}
					onkeydown={(e) => e.key === 'Escape' && toggleMenu()}
				></div>
				<div class="menu panel" role="menu">
					<button role="menuitem" onclick={() => { menuOpen = false; onchangepassword?.(); }}>
						<span aria-hidden="true">🔑</span> Change Password
					</button>
					<button role="menuitem" class="danger" onclick={handleLogout}>
						<span aria-hidden="true">⏻</span> Log Out
					</button>
				</div>
			{/if}
		</div>
	</div>
</header>

<style>
	.app-header {
		display: flex;
		align-items: center;
		gap: var(--s3);
		flex-wrap: wrap;
		padding: var(--s3) var(--s4);
		background: var(--indigo);
		border-bottom: var(--border);
		position: sticky;
		top: 0;
		z-index: var(--z-header);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: var(--s2);
		flex: 1 1 auto;
		min-width: 0;
	}
	.brand-kanji {
		font-family: var(--serif);
		font-size: 1.9rem;
		color: var(--gold);
		line-height: 1;
	}
	.brand-text h1 {
		color: var(--linen);
		font-size: 1.2rem;
		margin: 0;
		letter-spacing: 1px;
	}
	.brand-sub {
		color: var(--wasabi);
		font-size: 0.78rem;
		margin: 0;
	}
	.hamburger {
		display: none;
	}
	.search {
		position: relative;
		flex: 1 1 260px;
		max-width: 460px;
	}
	.search-icon {
		position: absolute;
		left: 10px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.85rem;
		opacity: 0.6;
		pointer-events: none;
	}
	.search-input {
		padding-left: 32px;
		padding-right: 32px;
	}
	.search-clear {
		position: absolute;
		right: 4px;
		top: 50%;
		transform: translateY(-50%);
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border: none;
		border-radius: var(--radius);
		background: transparent;
		color: var(--charcoal);
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
	}
	.search-clear:hover {
		background: var(--vermilion);
		color: var(--linen);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: var(--s2);
		/* Wrap rather than overflow the page. A no-op while the row fits (the
		   desktop layout is unaffected); below ~600px the row's own floor —
		   toggle + New task + account pill — is wider than the viewport. */
		flex-wrap: wrap;
	}
	.user-menu {
		position: relative;
	}
	.user-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		padding: var(--s1) var(--s2);
		border: 2px solid var(--linen);
		border-radius: var(--radius);
		background: transparent;
		color: var(--linen);
		font-family: var(--gothic);
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		transition: background var(--ease);
	}
	.user-btn:hover {
		background: rgba(255, 255, 255, 0.12);
	}
	.user-avatar {
		display: inline-grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--vermilion);
		color: var(--linen);
		font-size: 0.8rem;
		font-weight: 700;
	}
	.user-caret {
		font-size: 0.7rem;
		opacity: 0.7;
	}
	.menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 10;
	}
	.menu {
		position: absolute;
		top: calc(100% + var(--s2));
		right: 0;
		z-index: var(--z-context-menu);
		min-width: 180px;
		padding: var(--s1);
		display: flex;
		flex-direction: column;
	}
	.menu button {
		display: flex;
		align-items: center;
		gap: var(--s2);
		width: 100%;
		text-align: left;
		padding: var(--s2) var(--s3);
		border: none;
		border-radius: 4px;
		background: transparent;
		font-family: var(--gothic);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--charcoal);
		cursor: pointer;
	}
	.menu button:hover {
		background: var(--linen-2);
	}
	.menu button.danger {
		color: var(--vermilion);
	}
	.menu button.danger:hover {
		background: var(--vermilion);
		color: var(--linen);
	}

	@media (max-width: 1024px) {
		.hamburger {
			display: inline-grid;
		}
		.search {
			order: 3;
			flex-basis: 100%;
			max-width: none;
		}
	}
	@media (max-width: 520px) {
		.app-header {
			padding: var(--s2) var(--s3);
		}
		/* The action row already wraps (see .actions); at phone widths give the
		   view toggle a full-width row of its own so its three segments stay
		   comfortably wide instead of being squeezed. */
		.actions :global(.view-toggle) {
			flex: 1 1 100%;
		}
		.brand-text h1 {
			font-size: 1rem;
		}
		.actions .btn :global(span) {
			margin: 0;
		}
		.user-name {
			display: none;
		}
	}
</style>
