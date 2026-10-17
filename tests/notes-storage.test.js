import { describe, test, expect } from 'vitest';
import { openDB } from 'idb';
import { IndexedDBAdapter } from '../src/lib/storage/indexeddb.js';
import { LocalStorageAdapter } from '../src/lib/storage/local-storage.js';
import { DB_NAME, DB_VERSION, STORAGE_KEY, STORAGE_VERSION, STORES } from '../src/lib/storage/schema.js';
import { sampleState, makeNotes } from './fixtures.js';

describe('notes in the IndexedDB adapter', () => {
	test('round-trips notes, the active note and the notes view', async () => {
		const adapter = new IndexedDBAdapter();
		await adapter.initialize();

		await adapter.saveState({
			...sampleState(2, 'notes', makeNotes(2)),
			activeNoteId: 'n1'
		});

		const loaded = await adapter.loadState();
		expect(loaded?.notes.map((n) => n.id)).toEqual(['n0', 'n1']);
		expect(loaded?.activeNoteId).toBe('n1');
		expect(loaded?.view).toBe('notes');
	});

	test('replaces the previous note set (no duplication)', async () => {
		const adapter = new IndexedDBAdapter();
		await adapter.initialize();
		await adapter.saveState(sampleState(0, 'board', makeNotes(3)));
		await adapter.saveState(sampleState(0, 'board', makeNotes(1)));
		expect((await adapter.loadState())?.notes.map((n) => n.id)).toEqual(['n0']);
	});

	test('round-trips the pending flag on a note', async () => {
		const adapter = new IndexedDBAdapter();
		await adapter.initialize();
		const notes = [
			{ id: 'n0', title: 'Never synced', body: 'a', position: 0, createdAt: 1, updatedAt: 1, pending: true },
			{ id: 'n1', title: 'Confirmed', body: 'b', position: 1, createdAt: 2, updatedAt: 2, pending: false }
		];
		await adapter.saveState(sampleState(0, 'notes', notes));

		// The merge rule issues delete verdicts from this flag, so losing it on
		// reload would either drop a real note or resurrect a deleted one.
		expect((await adapter.loadState())?.notes.map((n) => n.pending)).toEqual([true, false]);
	});

	test('clear() empties the notes store too', async () => {
		const adapter = new IndexedDBAdapter();
		await adapter.initialize();
		await adapter.saveState(sampleState(1, 'board', makeNotes(2)));
		await adapter.clear();
		expect((await adapter.loadState())?.notes).toEqual([]);
	});

	test('upgrades a v1 database without losing tasks', async () => {
		// Build the exact database Session 004 shipped: three stores, no notes.
		const v1 = await openDB(DB_NAME, 1, {
			upgrade(db) {
				const tasks = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
				tasks.createIndex('status', 'status');
				tasks.createIndex('category', 'category');
				tasks.createIndex('priority', 'priority');
				db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
				db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
			}
		});
		await v1.put(STORES.TASKS, { id: 't0', title: 'old task', status: 'todo' });
		await v1.put(STORES.SETTINGS, { key: 'view', value: 'board' });
		v1.close();

		const adapter = new IndexedDBAdapter();
		await adapter.initialize(); // opens at DB_VERSION 2 — must not throw

		expect(adapter.available).toBe(true);
		const loaded = await adapter.loadState();
		expect(loaded?.tasks.map((t) => t.id)).toEqual(['t0']);
		expect(loaded?.notes).toEqual([]);

		// The new store must be usable after the upgrade.
		await adapter.saveState(sampleState(1, 'notes', makeNotes(1)));
		expect((await adapter.loadState())?.notes.map((n) => n.id)).toEqual(['n0']);
	});
});

describe('notes in the localStorage adapter', () => {
	test('round-trips notes and the active note', async () => {
		const adapter = new LocalStorageAdapter();
		await adapter.saveState({ ...sampleState(1, 'notes', makeNotes(2)), activeNoteId: 'n1' });

		const loaded = await adapter.loadState();
		expect(loaded?.notes.map((n) => n.id)).toEqual(['n0', 'n1']);
		expect(loaded?.activeNoteId).toBe('n1');
		expect(loaded?.view).toBe('notes');
	});

	test('round-trips the pending flag on a note', async () => {
		const adapter = new LocalStorageAdapter();
		const notes = [
			{ id: 'n0', title: 'Never synced', body: 'a', position: 0, createdAt: 1, updatedAt: 1, pending: true },
			{ id: 'n1', title: 'Confirmed', body: 'b', position: 1, createdAt: 2, updatedAt: 2, pending: false }
		];
		await adapter.saveState(sampleState(0, 'notes', notes));

		expect((await adapter.loadState())?.notes.map((n) => n.pending)).toEqual([true, false]);
	});

	test('normalises a payload written before notes existed', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ version: STORAGE_VERSION, tasks: [], filters: null, view: 'board' })
		);
		const adapter = new LocalStorageAdapter();
		const loaded = await adapter.loadState();
		expect(loaded?.notes).toEqual([]);
		expect(loaded?.activeNoteId).toBeNull();
	});
});

describe('the notes view survives persistence', () => {
	test('a stored "notes" view is not coerced back to board', async () => {
		const adapter = new LocalStorageAdapter();
		await adapter.saveState(sampleState(0, 'notes'));
		expect((await adapter.loadState())?.view).toBe('notes');
	});
});
