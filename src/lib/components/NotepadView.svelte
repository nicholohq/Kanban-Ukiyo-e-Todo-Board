<script>
	import { notesStore } from '$lib/stores/notesStore.svelte.js';
	import { sanitizeFilename, noteToTxt } from '$lib/utils/notes.js';
	import NoteTabs from './NoteTabs.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';

	/** Task 7 reads the selection from this element (selectionStart/End). */
	/** @type {HTMLTextAreaElement|null} */
	let textareaEl = $state(null);

	/** The strip's instance, so focus can land on a tab after a delete. */
	/** @type {any} */
	let noteTabsEl = $state(null);

	/** @type {import('$lib/utils/notes.js').Note|null} */
	let pendingDelete = $state(null);

	let syncText = $derived(
		notesStore.syncStatus === 'saving' || notesStore.syncStatus === 'loading'
			? 'Saving…'
			: notesStore.syncStatus === 'saved'
				? 'Saved'
				: ''
	);

	/** @param {Event & { currentTarget: HTMLTextAreaElement }} e */
	function onInput(e) {
		const note = notesStore.activeNote;
		if (!note) return;
		// No local mirror: the value lives in the store, so a tab switch inside
		// the debounce window can never lag behind the textarea.
		notesStore.updateBody(note.id, e.currentTarget.value);
	}

	/**
	 * Drop blanks and duplicates. A drag can emit a duplicate id, or an id for a
	 * note that was deleted mid-drag, and `reorderNotes` does not de-duplicate:
	 * an unclean list would put a duplicate entry into `notes`, which the next
	 * snapshot would then persist.
	 * @param {string[]} ids
	 * @returns {string[]}
	 */
	function cleanIds(ids) {
		/** @type {Set<string>} */
		const seen = new Set();
		/** @type {string[]} */
		const out = [];
		for (const id of ids) {
			if (!id || seen.has(id)) continue;
			seen.add(id);
			out.push(id);
		}
		return out;
	}

	/** @param {string} id */
	function selectNote(id) {
		notesStore.setActive(id);
	}

	function addNote() {
		notesStore.createNote();
	}

	/** @param {string} id @param {string} title */
	function renameNote(id, title) {
		notesStore.renameNote(id, title);
	}

	/** @param {string} id */
	function requestDelete(id) {
		const note = notesStore.notes.find((n) => n.id === id) ?? null;
		if (note) pendingDelete = note;
	}

	function confirmDelete() {
		if (pendingDelete) {
			notesStore.deleteNote(pendingDelete.id);
			// Focus whatever became active, or the ＋ button when the last note
			// went. The remaining tab buttons (or the ＋) already exist, so this
			// needs no tick.
			noteTabsEl?.focusNote(notesStore.activeNoteId);
		}
		pendingDelete = null;
	}

	/** @param {string} id @param {-1|1} delta */
	function moveNote(id, delta) {
		const ids = cleanIds(notesStore.notes.map((n) => n.id));
		const from = ids.indexOf(id);
		const to = from + delta;
		if (from === -1 || to < 0 || to >= ids.length) return;
		const next = [...ids];
		[next[from], next[to]] = [next[to], next[from]];
		notesStore.reorderNotes(next);
	}

	/** @param {string[]} orderedIds */
	function reorderNotes(orderedIds) {
		notesStore.reorderNotes(cleanIds(orderedIds));
	}

	function exportTxt() {
		const note = notesStore.activeNote;
		if (!note) return;
		const blob = new Blob([noteToTxt(note)], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${sanitizeFilename(note.title)}.txt`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}
</script>

<section class="notepad">
	<NoteTabs
		bind:this={noteTabsEl}
		notes={notesStore.notes}
		activeId={notesStore.activeNoteId}
		onselect={selectNote}
		onadd={addNote}
		onrename={renameNote}
		ondelete={requestDelete}
		onmove={moveNote}
		onreorder={reorderNotes}
	/>

	{#if notesStore.count === 0}
		<div class="empty">
			<p class="empty-line">Start a note for a subject you're studying</p>
			<button class="btn btn--primary" onclick={() => notesStore.createNote()}>New note</button>
		</div>
	{:else}
		<label class="visually-hidden" for="note-body">Note text</label>
		<textarea
			id="note-body"
			bind:this={textareaEl}
			class="textarea"
			placeholder="Start writing…"
			value={notesStore.activeNote?.body ?? ''}
			oninput={onInput}
		></textarea>
		<div class="tools">
			<button class="btn btn--sm" onclick={exportTxt} disabled={!notesStore.activeNote}>
				<span aria-hidden="true">⇩</span> Export .txt
			</button>
			<!-- Task 7 adds the Send-to-board button here. -->
			<p class="sync" aria-live="polite">{syncText}</p>
		</div>
	{/if}
</section>

<ConfirmDialog
	open={!!pendingDelete}
	title="Delete note?"
	message={pendingDelete ? `Delete "${pendingDelete.title}"?` : ''}
	confirmLabel="Delete"
	onconfirm={confirmDelete}
	oncancel={() => (pendingDelete = null)}
/>

<style>
	.notepad {
		background: var(--paper);
		border: var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: var(--s3);
		min-height: 60vh;
		display: flex;
		flex-direction: column;
	}
	.textarea {
		flex: 1;
		min-height: 320px;
		line-height: 1.8;
		font-size: 1rem;
		resize: vertical;
	}
	.tools {
		display: flex;
		align-items: center;
		gap: var(--s3);
		margin-top: var(--s3);
		min-height: 36px;
	}
	.sync {
		margin-left: auto;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.4px;
		color: var(--indigo);
		opacity: 0.8;
		min-height: 1em;
	}
	.empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--s3);
		text-align: center;
		padding: var(--s6) var(--s4);
	}
	.empty-line {
		font-family: var(--serif);
		font-size: 1.05rem;
		opacity: 0.8;
	}
</style>
