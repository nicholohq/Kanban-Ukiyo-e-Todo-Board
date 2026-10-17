/**
 * The notepad's state — a runes-based store for notes only.
 *
 * This store owns the note list, the active note and the note sync status. It
 * does **not** persist anything itself: `todoStore` is the single snapshot
 * writer and saves `notesStore.notes` / `activeNoteId` alongside the tasks.
 * The import graph is one-way (`todoStore` → `notesStore`), never the reverse.
 *
 * @typedef {import('$lib/utils/notes.js').Note} Note
 */

import { browser } from '$app/environment';
import { loadState } from '$lib/utils/storage.js';
import { mergeNotes } from '$lib/utils/notes.js';
import { toasts } from '$lib/stores/toasts.svelte.js';
import {
	fetchNotes,
	createNote as createNoteApi,
	updateNote as updateNoteApi,
	deleteNote as deleteNoteApi,
	reorderNotes as reorderNotesApi
} from '$lib/utils/api.js';

/** @returns {string} a reasonably unique id. */
function makeId() {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
	return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

class NotesStore {
	/** @type {Note[]} */
	notes = $state([]);
	/** @type {string|null} */
	activeNoteId = $state(null);
	/** @type {'idle'|'loading'|'saving'|'saved'|'error'} */
	syncStatus = $state('idle');

	/**
	 * Ids queued for the next server flush — never the note text itself.
	 * @type {Set<string>}
	 */
	#pending = new Set();
	/** @type {ReturnType<typeof setTimeout>|null} */
	#syncTimer = null;
	/** @type {ReturnType<typeof setTimeout>|null} */
	#savedFlagTimer = null;

	// ---- Derived projections ------------------------------------------------

	/** The note currently open in the notepad, or null when there is none. */
	activeNote = $derived(this.notes.find((n) => n.id === this.activeNoteId) ?? null);

	/** @returns {number} how many notes exist. */
	get count() {
		return this.notes.length;
	}

	// ---- Load ---------------------------------------------------------------

	/**
	 * Load the notepad: merge the locally cached notes with the server's copy,
	 * then restore the active note.
	 * @returns {Promise<void>}
	 */
	async init() {
		this.syncStatus = 'loading';
		const persisted = browser ? await loadState() : null;
		const local = persisted?.notes;
		/** @type {Note[]} */
		let server = [];
		// Only a list that actually came back can certify that a note was
		// deleted. If the fetch failed the merge must keep everything local —
		// otherwise an offline reload would read as "the server deleted it all".
		let authoritative = false;
		try {
			server = await fetchNotes();
			authoritative = true;
		} catch {
			server = [];
		}
		const merged = mergeNotes(local, server, { authoritative });
		this.notes = merged;

		const persistedActive = persisted?.activeNoteId ?? null;
		this.activeNoteId =
			persistedActive && merged.some((n) => n.id === persistedActive)
				? persistedActive
				: (merged[0]?.id ?? null);

		this.syncStatus = 'idle';
	}

	/** @param {string} id */
	setActive(id) {
		this.activeNoteId = id;
	}

	// ---- Server sync --------------------------------------------------------

	/**
	 * Mark a note confirmed — the server now has a row for it. From here on the
	 * merge reads the note's absence from the server as a deletion rather than as
	 * "never synced".
	 * @param {string} id
	 */
	#confirm(id) {
		this.notes = this.notes.map((n) => (n.id === id ? { ...n, pending: false } : n));
	}

	/**
	 * Queue a note for the debounced server flush. Only the id is remembered;
	 * the text is read back at flush time.
	 * @param {string} id
	 */
	#queueSync(id) {
		this.#pending.add(id);
		this.syncStatus = 'saving';
		if (this.#syncTimer) clearTimeout(this.#syncTimer);
		this.#syncTimer = setTimeout(() => this.#flush(), 1000);
	}

	/**
	 * Push every queued note to the server.
	 *
	 * The queue holds ids, not text, so a flush always reads each note's
	 * *current* text from `this.notes`: switching tabs or editing a different
	 * note inside the debounce window can never write one note's body into
	 * another, and a note deleted before the flush is simply skipped.
	 */
	async #flush() {
		if (this.#pending.size === 0) return;
		const ids = [...this.#pending];
		this.#pending.clear();
		try {
			for (const id of ids) {
				const note = this.notes.find((n) => n.id === id);
				if (!note) continue; // deleted during the debounce window
				const saved = await updateNoteApi(id, { title: note.title, body: note.body });
				// A PATCH only succeeds against a row that exists, so this note is
				// confirmed. Adopt the server's own timestamp as well: keeping the
				// client's `Date.now()` from the edit would leave the two sides
				// comparing values from different clocks, and this client's could
				// then win a merge it should lose the next time another device edits.
				const stamp = Number(saved?.updatedAt);
				this.notes = this.notes.map((n) => {
					if (n.id !== id) return n;
					const next = { ...n, pending: false };
					return Number.isFinite(stamp) ? { ...next, updatedAt: stamp } : next;
				});
			}
		} catch {
			this.syncStatus = 'error';
			toasts.error('Failed to sync note to server.');
			return;
		}
		this.syncStatus = 'saved';
		if (this.#savedFlagTimer) clearTimeout(this.#savedFlagTimer);
		this.#savedFlagTimer = setTimeout(() => (this.syncStatus = 'idle'), 1500);
	}

	// ---- CRUD ---------------------------------------------------------------

	/**
	 * Create a note and make it active.
	 * @param {string} [title]
	 * @returns {Note}
	 */
	createNote(title = 'Untitled') {
		const now = Date.now();
		/** @type {Note} */
		const note = {
			id: makeId(),
			title: String(title ?? '').trim() || 'Untitled',
			body: '',
			position: this.notes.length,
			createdAt: now,
			updatedAt: now,
			// Unconfirmed until the server accepts it. The merge keeps an
			// unconfirmed local-only note, and only a confirmed note can be
			// dropped when the server stops listing it.
			pending: true
		};
		this.notes = [...this.notes, note];
		this.activeNoteId = note.id;
		createNoteApi(note)
			.then(() => this.#confirm(note.id))
			.catch(() => toasts.error('Failed to save note to server.'));
		return note;
	}

	/**
	 * Rename a note. The server persists the title verbatim, so a blank title
	 * must be resolved here — never sent.
	 * @param {string} id
	 * @param {string} title
	 */
	renameNote(id, title) {
		const clean = String(title ?? '').trim() || 'Untitled';
		const current = this.notes.find((n) => n.id === id);
		// An unchanged title is not an edit. Stamping one here would give this
		// copy a client-side `updatedAt` the server never sees, which is how a
		// stale local copy ends up out-ranking a newer server row in `mergeNotes`.
		if (!current || current.title === clean) return;
		this.notes = this.notes.map((n) =>
			n.id === id ? { ...n, title: clean, updatedAt: Date.now() } : n
		);
		this.#queueSync(id);
	}

	/**
	 * Replace a note's body.
	 * @param {string} id
	 * @param {string} body
	 */
	updateBody(id, body) {
		const next = String(body ?? '');
		const current = this.notes.find((n) => n.id === id);
		// Same reasoning as `renameNote`: re-entering the text that is already
		// there (an input event with no change) must not restamp this copy.
		if (!current || current.body === next) return;
		this.notes = this.notes.map((n) =>
			n.id === id ? { ...n, body: next, updatedAt: Date.now() } : n
		);
		this.#queueSync(id);
	}

	/** @param {string} id */
	deleteNote(id) {
		const index = this.notes.findIndex((n) => n.id === id);
		if (index === -1) return;

		const remaining = this.notes.filter((n) => n.id !== id).map((n, i) => ({ ...n, position: i }));
		this.notes = remaining;

		if (this.activeNoteId === id) {
			// The note that took its place, else the new last note, else nothing.
			this.activeNoteId = remaining[index]?.id ?? remaining[remaining.length - 1]?.id ?? null;
		}

		this.#pending.delete(id);
		deleteNoteApi(id).catch(() => toasts.error('Failed to sync deletion to server.'));
	}

	/**
	 * Reorder the notepad from an explicit id order. Anything not listed keeps
	 * its relative order behind the listed notes.
	 * @param {string[]} orderedIds
	 */
	reorderNotes(orderedIds) {
		const byId = new Map(this.notes.map((n) => [n.id, n]));
		const listed = orderedIds.map((id) => byId.get(id)).filter(Boolean);
		const listedIds = new Set(listed.map((n) => n.id));
		const rest = this.notes.filter((n) => !listedIds.has(n.id));
		this.notes = [...listed, ...rest].map((n, i) => ({ ...n, position: i }));

		reorderNotesApi(orderedIds).catch(() => toasts.error('Failed to sync note order to server.'));
	}
}

/** The app-wide notepad singleton store. */
export const notesStore = new NotesStore();
