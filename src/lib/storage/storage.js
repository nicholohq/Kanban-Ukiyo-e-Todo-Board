/**
 * Storage facade — the only entry point application code should use.
 *
 * Responsible for:
 *  - lazy initialisation
 *  - backend selection (IndexedDB primary, localStorage fallback)
 *  - one-time automatic migration from localStorage
 *  - exposing the unified loadState/saveState/clear API
 *
 * No application code should ever import adapters or idb directly.
 */

import { IndexedDBAdapter } from './indexeddb.js';
import { LocalStorageAdapter } from './local-storage.js';
import { isIndexedDBAvailable, migrateFromLocalStorage } from './migration.js';

class StorageFacade {
	/** @type {import('./adapter.js').StorageAdapter | null} */
	#adapter = null;

	/** @type {Promise<void> | null} */
	#ready = null;

	/**
	 * Initialise storage. Safe to call multiple times; subsequent calls wait
	 * on the same initialisation promise.
	 * @returns {Promise<void>}
	 */
	async ready() {
		if (this.#adapter) return;
		if (!this.#ready) this.#ready = this.#initialize();
		await this.#ready;
	}

	async #initialize() {
		const idbAvailable = await isIndexedDBAvailable();

		if (idbAvailable) {
			const idb = new IndexedDBAdapter();
			await idb.initialize();

			if (idb.available) {
				const legacy = new LocalStorageAdapter();
				const migrated = await migrateFromLocalStorage(idb, legacy);
				if (migrated.ok) {
					console.info(`[storage] using IndexedDB (migrated ${migrated.migrated} tasks)`);
				} else {
					console.warn('[storage] migration failed:', migrated.reason);
				}
				this.#adapter = idb;
				return;
			}
		}

		console.info('[storage] IndexedDB unavailable, falling back to localStorage');
		this.#adapter = new LocalStorageAdapter();
	}

	/**
	 * The active adapter — for diagnostics only.
	 * @returns {import('./adapter.js').StorageAdapter}
	 */
	get adapter() {
		if (!this.#adapter) {
			throw new Error('[storage] not initialised — call await storage.ready() first');
		}
		return this.#adapter;
	}

	/**
	 * Load the complete persisted state.
	 * @returns {Promise<import('./adapter.js').PersistedState | null>}
	 */
	async loadState() {
		await this.ready();
		return this.#adapter.loadState();
	}

	/**
	 * Persist the complete state atomically.
	 * @param {import('./adapter.js').PersistedState} state
	 * @returns {Promise<import('./adapter.js').StorageResult>}
	 */
	async saveState(state) {
		await this.ready();
		return this.#adapter.saveState(state);
	}

	/** Remove all persisted data. */
	async clear() {
		await this.ready();
		return this.#adapter.clear();
	}
}

/** The app-wide storage facade singleton. */
export const storage = new StorageFacade();