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
		updatedAt: Number.isFinite(Number(r.updatedAt)) ? Number(r.updatedAt) : 0
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
 * A local note the server has never seen is always kept. When both sides have
 * the same id, the copy with the greater `updatedAt` wins; on an equal
 * `updatedAt` the local copy is kept, because identical timestamps mean
 * neither side changed, so the user's on-screen copy is the one to trust.
 * @param {Note[]} localNotes
 * @param {Note[]} serverNotes
 * @returns {Note[]}
 */
export function mergeNotes(localNotes, serverNotes) {
	/** @type {Map<string, Note>} */
	const merged = new Map();
	for (const note of serverNotes ?? []) {
		const n = normalizeNote(note);
		merged.set(n.id, n);
	}
	for (const note of localNotes ?? []) {
		const n = normalizeNote(note);
		const existing = merged.get(n.id);
		if (!existing || n.updatedAt >= existing.updatedAt) merged.set(n.id, n);
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
