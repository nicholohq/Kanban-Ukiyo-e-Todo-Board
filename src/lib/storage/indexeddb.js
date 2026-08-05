/**
 * IndexedDB adapter backed by the `idb` wrapper.
 *
 * Stores:
 *  - tasks     (primary key: id, indexed by status/category/priority)
 *  - settings  (key: key  — filters, view)
 *  - metadata  (key: key  — migration status)
 *
 * `saveState()` commits tasks + settings in a single atomic readwrite
 * transaction: if any write fails, nothing is committed.
 */

import { openDB } from 'idb';
import { DB_NAME, DB_VERSION, STORES } from './schema.js';

/**
 * @implements {import('./adapter.js').StorageAdapter}
 */
export class IndexedDBAdapter {
	/** @type {import('idb').IDBPDatabase | null} */
	#db = null;
	#available = false;

	get type() {
		return 'indexeddb';
	}

	get available() {
		return this.#available;
	}

	get version() {
		return DB_VERSION;
	}

	/**
	 * Open (and if needed populate) the database. Safe to call once per
	 * facade — the facade guards against re-initialisation.
	 */
	async initialize() {
		if (this.#db) return;
		try {
			this.#db = await openDB(DB_NAME, DB_VERSION, {
				upgrade(db) {
					const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
					taskStore.createIndex('status', 'status');
					taskStore.createIndex('category', 'category');
					taskStore.createIndex('priority', 'priority');

					db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
					db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
				}
			});
			this.#available = true;
		} catch (err) {
			console.warn('[indexeddb] failed to initialize:', err);
			this.#available = false;
		}
	}

	/**
	 * Load the complete persisted state.
	 * @returns {Promise<import('./adapter.js').PersistedState|null>}
	 */
	async loadState() {
		if (!this.#db) return null;
		try {
			const tasks = await this.#db.getAll(STORES.TASKS);
			const filtersRec = await this.#db.get(STORES.SETTINGS, 'filters');
			const viewRec = await this.#db.get(STORES.SETTINGS, 'view');
			return {
				version: DB_VERSION,
				tasks,
				filters: filtersRec?.value ?? null,
				view: viewRec?.value === 'list' ? 'list' : 'board'
			};
		} catch (err) {
			console.warn('[indexeddb] failed to load state:', err);
			return null;
		}
	}

	/**
	 * Persist the complete state atomically — tasks + settings in one
	 * readwrite transaction.
	 * @param {import('./adapter.js').PersistedState} state
	 * @returns {Promise<import('./adapter.js').StorageResult>}
	 */
	async saveState(state) {
		if (!this.#db) return { ok: false, reason: 'unavailable' };
		const tx = this.#db.transaction([STORES.TASKS, STORES.SETTINGS], 'readwrite');
		try {
			const tasksStore = tx.objectStore(STORES.TASKS);
			const settingsStore = tx.objectStore(STORES.SETTINGS);

			// Queue every write synchronously so the browser keeps the
			// transaction alive until tx.done—guaranteeing all-or-nothing.
			tasksStore.clear();
			for (const task of state.tasks) tasksStore.put(task);
			settingsStore.put({ key: 'filters', value: state.filters });
			settingsStore.put({ key: 'view', value: state.view });

			await tx.done;
			return { ok: true };
		} catch (err) {
			// A synchronous request error (e.g. an uncloneable value) throws before
			// we await tx.done, which would otherwise leave the already-queued
			// clear()/put()s to auto-commit. Abort so a failed write never partially
			// applies, and await the aborted transaction to swallow the resulting
			// AbortError instead of leaking an unhandled rejection.
			try {
				tx.abort();
				await tx.done;
			} catch {
				// Expected: the transaction was aborted or had already finished.
			}
			console.warn('[indexeddb] failed to save state:', err);
			return { ok: false, reason: 'error', error: err };
		}
	}

	/** Remove all persisted data across tasks, settings and metadata. */
	async clear() {
		if (!this.#db) return;
		try {
			const tx = this.#db.transaction(
				[STORES.TASKS, STORES.SETTINGS, STORES.METADATA],
				'readwrite'
			);
			tx.objectStore(STORES.TASKS).clear();
			tx.objectStore(STORES.SETTINGS).clear();
			tx.objectStore(STORES.METADATA).clear();
			await tx.done;
		} catch (err) {
			console.warn('[indexeddb] failed to clear:', err);
		}
	}

	/** @returns {Promise<boolean>} true when there are no tasks stored. */
	async isEmpty() {
		if (!this.#db) return true;
		try {
			return (await this.#db.count(STORES.TASKS)) === 0;
		} catch {
			return true;
		}
	}

	/**
	 * Read migration metadata.
	 * @returns {Promise<{version: number, migratedAt: number, source: string, taskCount: number} | null>}
	 */
	async getMigrationMetadata() {
		if (!this.#db) return null;
		try {
			const rec = await this.#db.get(STORES.METADATA, 'migration');
			return rec?.value ?? null;
		} catch {
			return null;
		}
	}

	/**
	 * Record migration metadata in the metadata store.
	 * @param {{version: number, migratedAt: number, source: string, taskCount: number}} meta
	 */
	async markMigrationComplete(meta) {
		if (!this.#db) return;
		try {
			await this.#db.put(STORES.METADATA, { key: 'migration', value: meta });
		} catch (err) {
			console.warn('[indexeddb] failed to write migration metadata:', err);
		}
	}
}