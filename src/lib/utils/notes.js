/**
 * Pure helpers for the notepad. No Svelte, no storage, no network — the note
 * model's judgement calls live here so they can be tested in isolation and the
 * storage layer can lean on them.
 */

/**
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string} body
 * @property {number} position
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {boolean} pending Set only by a note created on this device and not
 *   yet accepted by the server. The merge drops a note the server has stopped
 *   listing only when the note is confirmed; an unconfirmed note is always kept,
 *   because its text has no other home.
 */

/**
 * Coerce a persisted/unknown record into a well-formed note. The title is
 * trimmed (a blank title becomes 'Untitled'), but the body is left exactly as
 * given — leading and trailing whitespace in a note is the user's.
 * @param {unknown} raw
 * @returns {Note}
 */
export function normalizeNote(raw) {
	const r = /** @type {Record<string, any>} */ (raw) ?? {};
	return {
		id: String(r.id ?? ''),
		title: String(r.title ?? '').trim() || 'Untitled',
		body: String(r.body ?? ''),
		position: Number.isFinite(Number(r.position)) ? Number(r.position) : 0,
		createdAt: Number.isFinite(Number(r.createdAt)) ? Number(r.createdAt) : 0,
		updatedAt: Number.isFinite(Number(r.updatedAt)) ? Number(r.updatedAt) : 0,
		// Only an explicit `true` marks a note unconfirmed. A record written
		// before the flag existed therefore reads as confirmed — the app POSTs
		// every new note, so a pre-flag note has almost certainly been synced,
		// and reading them as unconfirmed instead would stop a deletion
		// propagating on every device that upgrades.
		pending: r.pending === true
	};
}

/**
 * Order notes by position, then by creation time as a stable tie-breaker.
 * @param {Note[]} notes
 * @returns {Note[]}
 */
export function sortNotes(notes) {
	return [...notes].sort((a, b) => a.position - b.position || a.createdAt - b.createdAt);
}

/**
 * Merge the local and server copies of the notepad, keyed by id.
 *
 * Both sides of a shared id: the copy with the greater `updatedAt` wins, and on
 * an equal `updatedAt` the **server** copy wins. The tie rule used to favour the
 * local copy, on the reasoning that identical timestamps mean neither side
 * changed. That reasoning does not hold here: `POST /api/notes` stores the
 * *client's* `updatedAt` verbatim, so a client's copy and its server row start
 * out byte-identical, and a client that never adopts the server's later
 * timestamps can hold a stamp the server cannot know about. A tie therefore only
 * means "the client holds no edit newer than this row" — not "the two copies
 * agree". A genuinely unsynced local edit still wins: it compares strictly
 * greater.
 *
 * Local only: a note the server does not list is dropped **once it is
 * confirmed**, and kept while it is `pending` (created here, not yet accepted by
 * the server). Given an authoritative list, a confirmed local note that has gone
 * missing was deleted by another device. The two cases are otherwise
 * indistinguishable — "created here, never synced" and "deleted elsewhere" are
 * both just "a local id with no server row" — so without the flag a deletion
 * could never propagate.
 *
 * `authoritative` must be true **only** for a list returned by a successful
 * fetch. A failed fetch passes nothing, and nothing local may be dropped on the
 * strength of a request that never completed.
 * @param {Note[]} localNotes
 * @param {Note[]} serverNotes
 * @param {{authoritative?: boolean}} [options]
 * @returns {Note[]}
 */
export function mergeNotes(localNotes, serverNotes, { authoritative = false } = {}) {
	/** @type {Map<string, Note>} */
	const merged = new Map();
	for (const note of serverNotes ?? []) {
		// Being listed by the server is what confirms a note exists.
		const n = normalizeNote(note);
		merged.set(n.id, { ...n, pending: false });
	}
	for (const note of localNotes ?? []) {
		const n = normalizeNote(note);
		const existing = merged.get(n.id);
		if (existing) {
			// Present on both sides, so confirmed either way.
			if (n.updatedAt > existing.updatedAt) merged.set(n.id, { ...n, pending: false });
			continue;
		}
		// Absent from the server: deleted elsewhere, or never confirmed and so
		// with no other home for its text.
		if (authoritative && !n.pending) continue;
		merged.set(n.id, n);
	}
	return sortNotes([...merged.values()]);
}

/**
 * Turn a note title into a filename-safe stem. Characters a file system will
 * not take are replaced by a space, whitespace runs collapse, the result is
 * trimmed, and a blank result falls back to 'note'.
 * @param {unknown} name
 * @returns {string}
 */
export function sanitizeFilename(name) {
	return (
		String(name ?? '')
			.replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim() || 'note'
	);
}

/**
 * The plain-text export of a note: its body with every line ending normalised
 * to LF.
 * @param {Note} note
 * @returns {string}
 */
export function noteToTxt(note) {
	return String(note?.body ?? '').replace(/\r\n?/g, '\n');
}

/**
 * Validate a card title, reusing the wording of `TaskForm.svelte` exactly
 * ('Please enter a title.' / 'A task with this title already exists.') so the
 * notepad shows the same messages. Migrating `TaskForm` onto this helper is
 * deliberately out of scope for this feature.
 * @param {unknown} title
 * @param {boolean} isDuplicate
 * @returns {string|null}
 */
export function cardTitleError(title, isDuplicate) {
	if (!String(title ?? '').trim()) return 'Please enter a title.';
	if (isDuplicate) return 'A task with this title already exists.';
	return null;
}
