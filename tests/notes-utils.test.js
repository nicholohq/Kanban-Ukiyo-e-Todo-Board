import { describe, test, expect } from 'vitest';
import {
	normalizeNote,
	sortNotes,
	mergeNotes,
	sanitizeFilename,
	noteToTxt,
	cardTitleError
} from '../src/lib/utils/notes.js';

// `pending: false` by default — a note the server has confirmed is the normal
// state, and the merge only ever drops a note that is both absent from the
// server and confirmed.
const note = (over = {}) => ({
	id: 'n1',
	title: 'Sociology',
	body: 'x',
	position: 0,
	createdAt: 1,
	updatedAt: 1,
	pending: false,
	...over
});

describe('normalizeNote', () => {
	test('fills in a missing title and a null body', () => {
		const n = normalizeNote({
			id: 'n9',
			title: null,
			body: null,
			position: null,
			createdAt: null,
			updatedAt: null
		});
		expect(n).toEqual({
			id: 'n9',
			title: 'Untitled',
			body: '',
			position: 0,
			createdAt: 0,
			updatedAt: 0,
			pending: false
		});
	});

	test('keeps a real title and body', () => {
		expect(normalizeNote(note())).toMatchObject({ title: 'Sociology', body: 'x' });
	});
});

describe('sortNotes', () => {
	test('orders by position, then createdAt', () => {
		const a = note({ id: 'a', position: 2, createdAt: 5 });
		const b = note({ id: 'b', position: 0, createdAt: 9 });
		const c = note({ id: 'c', position: 0, createdAt: 1 });
		expect(sortNotes([a, b, c]).map((n) => n.id)).toEqual(['c', 'b', 'a']);
	});
});

describe('mergeNotes', () => {
	test('keeps every local note when the fetch failed — the list is not authoritative', () => {
		// A failed GET passes an empty list. That must not read as "the server
		// has nothing": an offline note has no other home.
		const local = note({ id: 'local', updatedAt: 50 });
		expect(mergeNotes([local], []).map((n) => n.id)).toEqual(['local']);
		expect(mergeNotes([local], [], { authoritative: false }).map((n) => n.id)).toEqual(['local']);
	});

	test('drops a confirmed local note the server no longer lists', () => {
		// The reported bug. A deletes the whole note and the server row is gone
		// (probe-verified), but B still holds a local copy — so without this rule
		// the note comes back on every reload, forever.
		const deleted = note({ id: 'gone', pending: false, updatedAt: 500 });
		const kept = note({ id: 'stay', pending: false, updatedAt: 400 });
		const merged = mergeNotes([deleted, kept], [kept], { authoritative: true });
		expect(merged.map((n) => n.id)).toEqual(['stay']);
	});

	test('keeps an unconfirmed local note the server has never listed', () => {
		// Created offline: the server row does not exist yet, so a successful
		// fetch still does not list it. The text must survive.
		const local = note({ id: 'offline', pending: true, updatedAt: 50 });
		expect(mergeNotes([local], [], { authoritative: true }).map((n) => n.id)).toEqual(['offline']);
	});

	test('reads a missing pending flag as confirmed', () => {
		// A record written before the flag existed cannot be assumed unconfirmed:
		// the app POSTs every new note, so a pre-flag note has almost certainly
		// been synced, and the opposite default would stop a deletion propagating
		// on every device that upgrades.
		expect(normalizeNote(note({ pending: undefined })).pending).toBe(false);

		const legacy = {
			id: 'v1',
			title: 'Old',
			body: 'text',
			position: 0,
			createdAt: 1,
			updatedAt: 1
		};
		// Absent from an authoritative list, so another device deleted it.
		expect(mergeNotes([legacy], [], { authoritative: true }).map((n) => n.id)).toEqual([]);
	});

	test('marks a note the server lists as confirmed, whichever copy wins', () => {
		const local = note({ id: 'n1', pending: true, body: 'local', updatedAt: 10 });
		const server = note({ id: 'n1', body: 'server', updatedAt: 30 });
		expect(mergeNotes([local], [server], { authoritative: true })[0]).toMatchObject({
			pending: false,
			body: 'server'
		});

		const newerLocal = note({ id: 'n1', pending: true, body: 'local', updatedAt: 99 });
		expect(mergeNotes([newerLocal], [server], { authoritative: true })[0]).toMatchObject({
			pending: false,
			body: 'local'
		});
	});

	test('keeps the newer copy when both sides have changed it', () => {
		const local = note({ id: 'n1', body: 'newer', updatedAt: 20 });
		const server = note({ id: 'n1', body: 'older', updatedAt: 10 });
		expect(mergeNotes([local], [server])[0].body).toBe('newer');
		expect(mergeNotes([server], [local])[0].body).toBe('newer');
	});

	test('takes the server copy when it is newer', () => {
		const local = note({ id: 'n1', body: 'old', updatedAt: 10 });
		const server = note({ id: 'n1', body: 'fresh', updatedAt: 30 });
		expect(mergeNotes([local], [server])[0].body).toBe('fresh');
	});

	test('takes the newer, shorter server copy so a deleted paragraph stays deleted', () => {
		// The §7 case: one device deletes a paragraph, so the server's body is
		// *shorter* and its updated_at is later. The other device must not keep
		// its longer local copy.
		const local = note({ id: 'n1', body: 'Chapter 4\nPARAGRAPH\nLast line', updatedAt: 1000 });
		const server = note({ id: 'n1', body: 'Chapter 4\nLast line', updatedAt: 1053 });
		expect(mergeNotes([local], [server])[0].body).toBe('Chapter 4\nLast line');
	});

	test('gives an equal updatedAt to the server, not to the local copy', () => {
		// A tie means the client holds no edit newer than this server row; it
		// does not mean the two copies agree. Keeping the local copy here is what
		// brings deleted text back on the second device.
		const local = note({ id: 'n1', body: 'Chapter 4\nPARAGRAPH\nLast line', updatedAt: 500 });
		const server = note({ id: 'n1', body: 'Chapter 4\nLast line', updatedAt: 500 });
		expect(mergeNotes([local], [server])[0].body).toBe('Chapter 4\nLast line');
	});

	test('still keeps a strictly newer local copy, so an unsynced edit survives', () => {
		const local = note({ id: 'n1', body: 'typed with no server row yet', updatedAt: 900 });
		const server = note({ id: 'n1', body: 'what the server last saw', updatedAt: 800 });
		expect(mergeNotes([local], [server])[0].body).toBe('typed with no server row yet');
	});

	test('keeps notes that exist only on the server', () => {
		expect(mergeNotes([], [note({ id: 's1' })]).map((n) => n.id)).toEqual(['s1']);
	});

	test('never returns undefined titles or bodies', () => {
		const merged = mergeNotes([], [note({ id: 's2', title: null, body: null })]);
		expect(merged[0]).toMatchObject({ title: 'Untitled', body: '' });
	});

	test('returns notes in position order regardless of input order', () => {
		const merged = mergeNotes(
			[note({ id: 'a', position: 2 })],
			[note({ id: 'b', position: 0 }), note({ id: 'c', position: 1 })]
		);
		expect(merged.map((n) => n.id)).toEqual(['b', 'c', 'a']);
	});
});

describe('sanitizeFilename', () => {
	test('replaces characters a file system will not take', () => {
		expect(sanitizeFilename('Ch.4: "quotes" <draft>')).toBe('Ch.4 quotes draft');
	});

	test('collapses whitespace and trims', () => {
		expect(sanitizeFilename('  To   do  ')).toBe('To do');
	});

	test('falls back to "note" for a blank name', () => {
		expect(sanitizeFilename('   ')).toBe('note');
	});

	test('handles path separators', () => {
		expect(sanitizeFilename('a/b\\c')).toBe('a b c');
	});
});

describe('noteToTxt', () => {
	test('returns the body with CRLF normalised to LF', () => {
		expect(noteToTxt(note({ body: 'a\r\nb\rc' }))).toBe('a\nb\nc');
	});

	test('returns an empty string for a note with no body', () => {
		expect(noteToTxt(note({ body: null }))).toBe('');
	});
});

describe('cardTitleError', () => {
	test('requires a title, matching the task form wording', () => {
		expect(cardTitleError('   ', false)).toBe('Please enter a title.');
	});

	test('refuses a duplicate, matching the task form wording', () => {
		expect(cardTitleError('Buy milk', true)).toBe('A task with this title already exists.');
	});

	test('accepts a clean title', () => {
		expect(cardTitleError('Buy milk', false)).toBeNull();
	});
});
