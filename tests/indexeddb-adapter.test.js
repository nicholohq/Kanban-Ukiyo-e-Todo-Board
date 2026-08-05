import { describe, test, expect } from 'vitest';
import { IndexedDBAdapter } from '../src/lib/storage/indexeddb.js';
import { DB_VERSION } from '../src/lib/storage/schema.js';
import { sampleState, makeTasks } from './fixtures.js';

/** @returns {Promise<IndexedDBAdapter>} an initialised adapter over a fresh DB. */
async function initAdapter() {
	const adapter = new IndexedDBAdapter();
	await adapter.initialize();
	return adapter;
}

describe('IndexedDBAdapter', () => {
	test('initialises and reports contract metadata', async () => {
		const adapter = await initAdapter();
		expect(adapter.available).toBe(true);
		expect(adapter.type).toBe('indexeddb');
		expect(adapter.version).toBe(DB_VERSION);
	});

	test('save/load round-trip preserves tasks, order and view', async () => {
		const adapter = await initAdapter();
		await adapter.saveState(sampleState(3, 'list'));

		const loaded = await adapter.loadState();
		expect(loaded?.tasks.map((t) => t.id)).toEqual(['t0', 't1', 't2']);
		expect(loaded?.view).toBe('list');
		expect(loaded?.version).toBe(DB_VERSION);
	});

	test('saveState replaces the previous task set (no duplication)', async () => {
		const adapter = await initAdapter();
		await adapter.saveState(sampleState(3));
		await adapter.saveState(sampleState(1));

		const loaded = await adapter.loadState();
		expect(loaded?.tasks.map((t) => t.id)).toEqual(['t0']);
	});

	test('isEmpty reflects whether tasks exist', async () => {
		const adapter = await initAdapter();
		expect(await adapter.isEmpty()).toBe(true);
		await adapter.saveState(sampleState(1));
		expect(await adapter.isEmpty()).toBe(false);
	});

	test('clear() empties all stores', async () => {
		const adapter = await initAdapter();
		await adapter.saveState(sampleState(2));
		await adapter.markMigrationComplete({
			version: 1,
			migratedAt: 1,
			source: 'localStorage',
			taskCount: 2
		});

		await adapter.clear();

		expect(await adapter.isEmpty()).toBe(true);
		expect(await adapter.getMigrationMetadata()).toBeNull();
		const loaded = await adapter.loadState();
		expect(loaded?.tasks).toEqual([]);
	});

	test('migration metadata round-trips, including taskCount', async () => {
		const adapter = await initAdapter();
		expect(await adapter.getMigrationMetadata()).toBeNull();

		await adapter.markMigrationComplete({
			version: 1,
			migratedAt: 123456,
			source: 'localStorage',
			taskCount: 5
		});

		const meta = await adapter.getMigrationMetadata();
		expect(meta).toMatchObject({ migratedAt: 123456, source: 'localStorage', taskCount: 5 });
	});

	test('saveState is atomic — a failing write rolls back the whole transaction', async () => {
		const adapter = await initAdapter();
		await adapter.saveState(sampleState(2)); // seed known-good state (t0, t1)

		// A function property is not structured-cloneable; the put() will fail and
		// must abort the transaction — including the clear() queued before it.
		const poisoned = {
			version: DB_VERSION,
			tasks: [...makeTasks(1), { id: 'bad', notCloneable: () => {} }],
			filters: null,
			view: 'board'
		};
		const result = await adapter.saveState(/** @type {any} */ (poisoned));
		expect(result.ok).toBe(false);

		// The prior, valid state must be intact — the clear() did not commit.
		const loaded = await adapter.loadState();
		expect(loaded?.tasks.map((t) => t.id)).toEqual(['t0', 't1']);
	});

	test('an uninitialised adapter fails writes gracefully', async () => {
		const adapter = new IndexedDBAdapter(); // no initialize()
		const result = await adapter.saveState(sampleState(1));
		expect(result).toEqual({ ok: false, reason: 'unavailable' });
		expect(await adapter.loadState()).toBeNull();
	});
});
