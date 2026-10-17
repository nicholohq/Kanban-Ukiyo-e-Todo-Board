import { describe, test, expect } from 'vitest';
import { LocalStorageAdapter } from '../src/lib/storage/local-storage.js';
import { STORAGE_KEY, STORAGE_VERSION } from '../src/lib/storage/schema.js';
import { sampleState } from './fixtures.js';

describe('LocalStorageAdapter', () => {
	test('reports contract metadata (type, version, available)', () => {
		const adapter = new LocalStorageAdapter();
		expect(adapter.type).toBe('localStorage');
		expect(adapter.version).toBe(STORAGE_VERSION);
		expect(adapter.available).toBe(true);
	});

	test('save/load round-trip preserves tasks, order and view', async () => {
		const adapter = new LocalStorageAdapter();
		const state = sampleState(3, 'list');

		const result = await adapter.saveState(state);
		expect(result.ok).toBe(true);

		const loaded = await adapter.loadState();
		expect(loaded).not.toBeNull();
		expect(loaded?.tasks.map((t) => t.id)).toEqual(['t0', 't1', 't2']);
		expect(loaded?.view).toBe('list');
		expect(loaded?.version).toBe(STORAGE_VERSION);
	});

	test('loadState returns null when nothing is persisted', async () => {
		const adapter = new LocalStorageAdapter();
		expect(await adapter.loadState()).toBeNull();
	});

	test('clear() removes persisted state', async () => {
		const adapter = new LocalStorageAdapter();
		await adapter.saveState(sampleState(2));
		await adapter.clear();
		expect(await adapter.loadState()).toBeNull();
	});

	test('migrates the v1 payload instead of discarding it', async () => {
		// v1 shipped before notes carried a `pending` flag. The adapter returns
		// null for a payload it cannot migrate (see the mismatch test below), so a
		// version bump with no migrate case would throw away every local note and
		// task on the localStorage fallback — the one outcome the notepad must
		// never cause.
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				version: 1,
				tasks: [{ id: 't0' }],
				filters: null,
				view: 'notes',
				notes: [
					{ id: 'n0', title: 'Old note', body: 'text', position: 0, createdAt: 1, updatedAt: 1 }
				],
				activeNoteId: 'n0'
			})
		);

		const adapter = new LocalStorageAdapter();
		const loaded = await adapter.loadState();

		expect(loaded).not.toBeNull();
		expect(loaded?.version).toBe(STORAGE_VERSION);
		expect(loaded?.notes.map((n) => n.id)).toEqual(['n0']);
		expect(loaded?.tasks.map((t) => t.id)).toEqual(['t0']);
	});

	test('rejects a payload written under a mismatched version', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ version: STORAGE_VERSION + 999, tasks: [{ id: 'x' }] })
		);
		const adapter = new LocalStorageAdapter();
		expect(await adapter.loadState()).toBeNull();
	});

	test('normalises a missing view to "board" and missing tasks to []', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ version: STORAGE_VERSION, filters: null })
		);
		const adapter = new LocalStorageAdapter();
		const loaded = await adapter.loadState();
		expect(loaded?.tasks).toEqual([]);
		expect(loaded?.view).toBe('board');
	});
});
