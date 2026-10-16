<script>
	import { tick } from 'svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	/**
	 * @typedef {import('$lib/utils/notes.js').Note} Note
	 */

	/**
	 * @type {{
	 *   notes: Note[],
	 *   activeId: string|null,
	 *   onselect?: (id: string) => void,
	 *   onadd?: () => void,
	 *   onrename?: (id: string, title: string) => void,
	 *   ondelete?: (id: string) => void,
	 *   onmove?: (id: string, delta: -1|1) => void,
	 *   onreorder?: (orderedIds: string[]) => void
	 * }}
	 */
	let { notes, activeId, onselect, onadd, onrename, ondelete, onmove, onreorder } = $props();

	const FLIP_DURATION_MS = 160;

	// Local, drag-owned copy of the strip. svelte-dnd-action mutates this list
	// while dragging; the final order is committed through onreorder.
	/** @type {Note[]} */
	let items = $state(notes);
	// True while a drag is in flight — and for a beat after a drop, so the click
	// a drag can generate does not also select the tab (the TaskCard guard).
	let dragging = $state(false);
	let dragTimeout = 0;

	// Resync from props whenever they change and we are not mid-drag.
	$effect(() => {
		const next = notes;
		if (!dragging) items = next;
	});
	$effect(() => () => clearTimeout(dragTimeout));

	/** @type {Map<string, HTMLButtonElement>} */
	const tabRefs = new Map();
	/** @type {HTMLButtonElement|null} */
	let addBtn = $state(null);

	/**
	 * Register a tab button so focus can be moved to it by id later.
	 * @param {HTMLButtonElement} node
	 * @param {string} id
	 */
	function tabRef(node, id) {
		tabRefs.set(id, node);
		return {
			/** @param {string} newId */
			update(newId) {
				tabRefs.delete(id);
				id = newId;
				tabRefs.set(id, node);
			},
			destroy() {
				tabRefs.delete(id);
			}
		};
	}

	/**
	 * Focus the tab for `id`, falling back to the ＋ button. Exposed so the
	 * parent can land focus somewhere sensible after a delete.
	 * @param {string|null} id
	 */
	export function focusNote(id) {
		const el = id ? tabRefs.get(id) : null;
		if (el) el.focus();
		else addBtn?.focus();
	}

	// ---- Reorder by drag ----------------------------------------------------

	/**
	 * Clean id order for the store. A drag can emit a duplicate id or an id for
	 * a note deleted mid-drag, and `reorderNotes` does not de-duplicate, so the
	 * list is cleaned here before it is handed to the parent.
	 * @param {Note[]} list
	 * @returns {string[]}
	 */
	function uniqueIds(list) {
		/** @type {Set<string>} */
		const seen = new Set();
		/** @type {string[]} */
		const ids = [];
		for (const item of list) {
			const id = item?.id;
			if (!id || seen.has(id)) continue;
			seen.add(id);
			ids.push(id);
		}
		return ids;
	}

	/** @param {CustomEvent<{ items: Note[] }>} e */
	function handleConsider(e) {
		dragging = true;
		items = e.detail.items;
	}

	/** @param {CustomEvent<{ items: Note[] }>} e */
	function handleFinalize(e) {
		items = e.detail.items;
		onreorder?.(uniqueIds(items));
		clearTimeout(dragTimeout);
		dragTimeout = setTimeout(() => (dragging = false), 100);
	}

	// ---- Tab selection / keyboard navigation --------------------------------

	/** @param {string} id */
	function handleTabClick(id) {
		if (dragging) return;
		onselect?.(id);
	}

	/** @param {number} index */
	function focusIndex(index) {
		const list = notes;
		if (!list.length) return;
		const i = ((index % list.length) + list.length) % list.length;
		const target = list[i];
		tabRefs.get(target.id)?.focus();
		onselect?.(target.id);
	}

	/** @param {KeyboardEvent} e @param {Note} note */
	function handleTabKeydown(e, note) {
		const index = notes.findIndex((n) => n.id === note.id);
		switch (e.key) {
			case 'ArrowRight':
				e.preventDefault();
				focusIndex(index + 1);
				break;
			case 'ArrowLeft':
				e.preventDefault();
				focusIndex(index - 1);
				break;
			case 'Home':
				e.preventDefault();
				focusIndex(0);
				break;
			case 'End':
				e.preventDefault();
				focusIndex(notes.length - 1);
				break;
			case 'Enter':
			case 'F2':
				e.preventDefault();
				startRename(note);
				break;
		}
	}

	// ---- Rename -------------------------------------------------------------

	/** @type {string|null} */
	let renamingId = $state(null);
	let renameValue = $state('');
	// Set when Escape abandons a rename: the blur that leaves the input
	// afterwards must not then commit the title the user just discarded.
	let renameAbandoned = false;

	/** @param {HTMLInputElement} node */
	function seedRenameInput(node) {
		node.focus();
		node.select();
	}

	/** @param {Note} note */
	function startRename(note) {
		closeMenu(false);
		renameValue = note.title;
		renamingId = note.id;
		renameAbandoned = false;
	}

	/** @param {string} id @param {boolean} refocus */
	async function endRename(id, refocus) {
		renamingId = null;
		if (refocus) {
			await tick();
			focusNote(id);
		}
	}

	/** @param {boolean} refocus */
	function commitRename(refocus) {
		const id = renamingId;
		if (!id) return;
		const value = renameValue.trim();
		const current = notes.find((n) => n.id === id);
		// Notes may share a title and a blank title is never sent: an empty
		// submit keeps the old title, silently, with no validation message.
		if (current && value && value !== current.title) onrename?.(id, value);
		endRename(id, refocus);
	}

	/** @param {KeyboardEvent} e */
	function onRenameKeydown(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commitRename(true);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			renameAbandoned = true;
			const id = renamingId;
			if (id) endRename(id, true);
		}
	}

	function onRenameBlur() {
		if (renameAbandoned) {
			renameAbandoned = false;
			return;
		}
		commitRename(false);
	}

	// ---- Tab menu (the keyboard-reachable reorder/rename/delete path) --------

	/** @type {string|null} */
	let menuId = $state(null);
	let menuLeft = $state(0);
	let menuTop = $state(0);
	let menuEl = $state(null);
	/** @type {HTMLButtonElement|null} */
	let menuOpener = null;

	let menuItems = $derived.by(() => {
		const id = menuId;
		if (!id) return [];
		const i = notes.findIndex((n) => n.id === id);
		return [
			{ action: 'rename', label: 'Rename', disabled: false },
			{ action: 'left', label: 'Move left', disabled: i <= 0 },
			{ action: 'right', label: 'Move right', disabled: i < 0 || i >= notes.length - 1 },
			{ action: 'delete', label: 'Delete', disabled: false }
		];
	});

	$effect(() => {
		if (!menuId || !menuEl) return;
		menuFocusable()[0]?.focus();
	});

	// The ⋯ lives on the active tab, so close the menu if the active tab moves.
	$effect(() => {
		if (menuId && menuId !== activeId) closeMenu(false);
	});

	/** @returns {HTMLElement[]} */
	function menuFocusable() {
		if (!menuEl) return [];
		return /** @type {HTMLElement[]} */ ([
			...menuEl.querySelectorAll('[role="menuitem"]:not([disabled])')
		]);
	}

	/** @param {Note} note @param {MouseEvent} e */
	function openMenu(note, e) {
		e.stopPropagation();
		if (menuId === note.id) {
			closeMenu(true);
			return;
		}
		menuOpener = /** @type {HTMLButtonElement} */ (e.currentTarget);
		const r = menuOpener.getBoundingClientRect();
		const width = 180;
		menuLeft = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8));
		menuTop = r.bottom + 4;
		menuId = note.id;
	}

	/** @param {boolean} refocus */
	function closeMenu(refocus) {
		if (menuId === null) return;
		menuId = null;
		if (refocus && menuOpener) menuOpener.focus();
		menuOpener = null;
	}

	/** @param {string} action */
	function handleMenuAction(action) {
		const id = menuId;
		if (!id) return;
		const note = notes.find((n) => n.id === id);
		if (!note) {
			closeMenu(true);
			return;
		}
		switch (action) {
			case 'rename':
				closeMenu(false);
				startRename(note);
				break;
			case 'left':
				onmove?.(id, -1);
				closeMenu(true);
				break;
			case 'right':
				onmove?.(id, 1);
				closeMenu(true);
				break;
			case 'delete':
				closeMenu(false);
				ondelete?.(id);
				break;
		}
	}

	/** @param {KeyboardEvent} e */
	function onMenuKeydown(e) {
		const list = menuFocusable();
		const current = list.indexOf(/** @type {HTMLElement} */ (document.activeElement));
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				if (list.length) list[(current + 1) % list.length].focus();
				break;
			case 'ArrowUp':
				e.preventDefault();
				if (list.length) list[(current - 1 + list.length) % list.length].focus();
				break;
			case 'Home':
				e.preventDefault();
				list[0]?.focus();
				break;
			case 'End':
				e.preventDefault();
				list[list.length - 1]?.focus();
				break;
			case 'Escape':
				e.preventDefault();
				closeMenu(true);
				break;
			case 'Tab':
				closeMenu(false);
				break;
		}
	}
</script>

<svelte:window onscroll={() => closeMenu(false)} onresize={() => closeMenu(false)} />

<div class="strip">
	<div
		class="tabs"
		role="tablist"
		aria-label="Notes"
		use:dndzone={{ items, flipDurationMs: FLIP_DURATION_MS, type: 'note-tab' }}
		onconsider={handleConsider}
		onfinalize={handleFinalize}
	>
		{#each items as note (note.id)}
			<div
				class="tab"
				class:active={note.id === activeId}
				role="presentation"
				animate:flip={{ duration: FLIP_DURATION_MS }}
			>
				{#if renamingId === note.id}
					<input
						class="tab-input"
						value={renameValue}
						use:seedRenameInput
						oninput={(e) => (renameValue = e.currentTarget.value)}
						onkeydown={onRenameKeydown}
						onblur={onRenameBlur}
						aria-label="Note title"
					/>
				{:else}
					<button
						class="tab-label"
						role="tab"
						aria-selected={note.id === activeId}
						tabindex={note.id === activeId ? 0 : -1}
						title={note.title}
						use:tabRef={note.id}
						onclick={() => handleTabClick(note.id)}
						ondblclick={() => startRename(note)}
						onkeydown={(e) => handleTabKeydown(e, note)}
					>
						{note.title}
					</button>
					{#if note.id === activeId}
						<button
							class="tab-more"
							type="button"
							aria-label="Note actions"
							aria-haspopup="menu"
							aria-expanded={menuId === note.id}
							onclick={(e) => openMenu(note, e)}
						>
							<span aria-hidden="true">⋯</span>
						</button>
					{/if}
				{/if}
			</div>
		{/each}
	</div>

	<button class="add" type="button" aria-label="New note" bind:this={addBtn} onclick={() => onadd?.()}>
		<span aria-hidden="true">＋</span>
	</button>
</div>

{#if menuId}
	<div
		class="menu-overlay"
		role="presentation"
		onclick={() => closeMenu(true)}
		oncontextmenu={(e) => {
			e.preventDefault();
			closeMenu(true);
		}}
	></div>
	<div
		class="menu"
		bind:this={menuEl}
		style="left:{menuLeft}px;top:{menuTop}px;"
		role="menu"
		tabindex="-1"
		aria-label="Note actions"
		onkeydown={onMenuKeydown}
		onclick={(e) => e.stopPropagation()}
	>
		{#each menuItems as item (item.action)}
			<button
				type="button"
				class="menu-item"
				role="menuitem"
				disabled={item.disabled}
				onclick={() => handleMenuAction(item.action)}
			>
				{item.label}
			</button>
		{/each}
	</div>
{/if}

<style>
	.strip {
		display: flex;
		align-items: center;
		gap: var(--s2);
		overflow-x: auto;
		padding-bottom: var(--s1);
		margin-bottom: var(--s3);
	}
	.tabs {
		display: flex;
		flex-direction: row;
		gap: var(--s1);
		flex: 0 0 auto;
	}
	.tab {
		display: inline-flex;
		align-items: stretch;
		flex: none;
		max-width: 220px;
		background: var(--linen-2);
		border: var(--border-thin);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.tab.active {
		background: var(--paper);
		box-shadow: var(--shadow-sm);
	}
	.tab-label {
		font-family: var(--serif);
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--charcoal);
		background: none;
		border: none;
		padding: var(--s2) var(--s3);
		max-width: 180px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		cursor: pointer;
	}
	.tab-input {
		font-family: var(--serif);
		font-size: 0.88rem;
		color: var(--charcoal);
		background: var(--paper);
		border: none;
		outline: none;
		padding: var(--s2) var(--s3);
		width: 160px;
	}
	.tab-more {
		display: inline-grid;
		place-items: center;
		border: none;
		border-left: var(--border-thin);
		background: none;
		color: var(--charcoal);
		padding: 0 var(--s2);
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
	}
	.tab-more:hover {
		background: var(--linen);
	}
	.add {
		display: inline-grid;
		place-items: center;
		flex: none;
		width: 40px;
		height: 40px;
		font-size: 1.1rem;
		color: var(--charcoal);
		background: var(--paper);
		border: var(--border-thin);
		border-radius: var(--radius);
		cursor: pointer;
	}
	.add:hover {
		background: var(--linen-2);
	}
	.menu-overlay {
		position: fixed;
		inset: 0;
		z-index: var(--z-context-menu);
	}
	.menu {
		position: fixed;
		z-index: var(--z-context-menu);
		display: flex;
		flex-direction: column;
		min-width: 180px;
		padding: var(--s2);
		background: var(--paper);
		border: var(--border-thin);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}
	.menu-item {
		display: flex;
		align-items: center;
		width: 100%;
		text-align: left;
		font-family: var(--gothic);
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--charcoal);
		background: none;
		border: none;
		border-radius: var(--radius);
		padding: var(--s2) var(--s3);
		cursor: pointer;
		min-height: 44px;
	}
	.menu-item:hover:not(:disabled) {
		background: var(--linen-2);
	}
	.menu-item:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
