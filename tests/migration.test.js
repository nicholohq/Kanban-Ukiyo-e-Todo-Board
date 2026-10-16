import { describe, test, expect } from 'vitest';
import { IndexedDBAdapter } from '../src/lib/storage/indexeddb.js';
import { LocalStorageAdapter } from '../src/lib/storage/local-storage.js';
import { migrateFromLocalStorage, isIndexedDBAvailable } from '../src/lib/storage/migration.js';
import { STORAGE_KEY, STORAGE_VERSION } from '../src/lib/storage/schema.js';
import { sampleState, makeTasks, makeNotes } from './fixtures.js';

/** Seed the legacy localStorage payload the way the original app wrote it. */
function seedLegacy(tasks) {
	localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify({ version: STORAGE_VERSION, tasks, filters: null, view: 'board' })
	);
}

async function freshIdb() {
	const adapter = new IndexedDBAdapter();
	await adapter.initialize();
	return adapter;
}

describe('migrateFromLocalStorage', () => {
	test('migrates legacy tasks into IndexedDB', async () => {
		seedLegacy(makeTasks(3));
		const idb = await freshIdb();

		const result = await migrateFromLocalStorage(idb, new LocalStorageAdapter());

		expect(result).toMatchObject({ ok: true, migrated: 3 });
		const state = await idb.loadState();
		expect(state?.tasks).toHaveLength(3);
	});

	test('preserves task count and every task id', async () => {
		const tasks = makeTasks(25);
		seedLegacy(tasks);
		const idb = await freshIdb();

		await migrateFromLocalStorage(idb, new LocalStorageAdapter());

		const state = await idb.loadState();
		expect(state?.tasks).toHaveLength(25);
		const migratedIds = new Set(state?.tasks.map((t) => t.id));
		for (const task of tasks) {
			expect(migratedIds.has(task.id)).toBe(true);
		}
	});

	test('is idempotent — a second run short-circuits and does not duplicate', async () => {
		seedLegacy(makeTasks(4));
		const idb = await freshIdb();

		const first = await migrateFromLocalStorage(idb, new LocalStorageAdapter());
		expect(first).toMatchObject({ ok: true, migrated: 4 });

		// Second run must read the metadata and return without re-importing.
		const second = await migrateFromLocalStorage(idb, new LocalStorageAdapter());
		expect(second).toMatchObject({ ok: true, migrated: 4 });

		const state = await idb.loadState();
		expect(state?.tasks).toHaveLength(4); // not 8
	});

	test('records completion even when there is no legacy data', async () => {
		const idb = await freshIdb();

		const result = await migrateFromLocalStorage(idb, new LocalStorageAdapter());

		expect(result).toMatchObject({ ok: true, migrated: 0 });
		const meta = await idb.getMigrationMetadata();
		expect(meta?.migratedAt).toBeGreaterThan(0);
		expect(meta?.taskCount).toBe(0);
	});

	test('does not delete the legacy localStorage payload', async () => {
		seedLegacy(makeTasks(2));
		const idb = await freshIdb();

		await migrateFromLocalStorage(idb, new LocalStorageAdapter());

		expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
	});

	test('is undisturbed by notes already persisted in IndexedDB', async () => {
		seedLegacy(makeTasks(2));
		const idb = await freshIdb();

		// Complete the migration once, then persist notes on top of it.
		await migrateFromLocalStorage(idb, new LocalStorageAdapter());
		await idb.saveState({ ...sampleState(2, 'notes', makeNotes(2)) });

		// A later run short-circuits on the recorded metadata and must leave the
		// notes untouched.
		const result = await migrateFromLocalStorage(idb, new LocalStorageAdapter());
		expect(result).toMatchObject({ ok: true });

		const state = await idb.loadState();
		expect(state?.notes.map((n) => n.id)).toEqual(['n0', 'n1']);
	});
});

describe('isIndexedDBAvailable', () => {
	test('returns true when indexedDB is present', async () => {
		expect(await isIndexedDBAvailable()).toBe(true);
	});

	test('returns false when indexedDB is absent', async () => {
		const original = globalThis.indexedDB;
		// @ts-expect-error — deliberately removing the global for this probe.
		globalThis.indexedDB = undefined;
		try {
			expect(await isIndexedDBAvailable()).toBe(false);
		} finally {
			globalThis.indexedDB = original;
		}
	});
});
