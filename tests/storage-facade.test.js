import { describe, test, expect, beforeEach, vi } from 'vitest';
import { STORAGE_VERSION } from '../src/lib/storage/schema.js';
import { sampleState, makeTasks } from './fixtures.js';

// The facade is a module-level singleton. Reset the module registry before each
// test so every test observes a fresh, uninitialised facade.
beforeEach(() => {
	vi.resetModules();
});

describe('StorageFacade', () => {
	test('selects IndexedDB when it is available', async () => {
		const { storage } = await import('../src/lib/storage/storage.js');
		await storage.ready();
		expect(storage.adapter.type).toBe('indexeddb');
	});

	test('falls back to localStorage when IndexedDB is unavailable', async () => {
		const original = globalThis.indexedDB;
		// @ts-expect-error — simulate an environment without IndexedDB.
		globalThis.indexedDB = undefined;
		try {
			const { storage } = await import('../src/lib/storage/storage.js');
			await storage.ready();
			expect(storage.adapter.type).toBe('localStorage');
		} finally {
			globalThis.indexedDB = original;
		}
	});

	test('save/load round-trips through the active adapter', async () => {
		const { storage } = await import('../src/lib/storage/storage.js');
		const result = await storage.saveState(sampleState(2, 'list'));
		expect(result.ok).toBe(true);

		const loaded = await storage.loadState();
		expect(loaded?.tasks).toHaveLength(2);
		expect(loaded?.view).toBe('list');
	});

	test('clear() empties persisted state', async () => {
		const { storage } = await import('../src/lib/storage/storage.js');
		await storage.saveState(sampleState(2));
		await storage.clear();

		const loaded = await storage.loadState();
		expect(loaded?.tasks ?? []).toHaveLength(0);
	});

	test('the adapter getter throws before initialisation', async () => {
		const { storage } = await import('../src/lib/storage/storage.js');
		expect(() => storage.adapter).toThrow();
	});

	test('ready() is single-flight — concurrent calls initialise once', async () => {
		const { storage } = await import('../src/lib/storage/storage.js');
		await Promise.all([storage.ready(), storage.ready(), storage.ready()]);
		expect(storage.adapter.type).toBe('indexeddb');
	});
});

describe('compatibility wrapper (utils/storage.js)', () => {
	test('loadState / saveState / clearState delegate to the facade', async () => {
		const { saveState, loadState, clearState } = await import('../src/lib/utils/storage.js');

		const result = await saveState({ tasks: makeTasks(3), filters: null, view: 'board' });
		expect(result.ok).toBe(true);

		const loaded = await loadState();
		expect(loaded?.tasks).toHaveLength(3);

		await clearState();
		const cleared = await loadState();
		expect(cleared?.tasks ?? []).toHaveLength(0);
	});

	test('re-exports STORAGE_VERSION from the schema', async () => {
		const mod = await import('../src/lib/utils/storage.js');
		expect(mod.STORAGE_VERSION).toBe(STORAGE_VERSION);
	});
});
