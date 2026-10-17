/**
 * localStorage adapter — preserves the exact behaviour of the original
 * `utils/storage.js` implementation, wrapped in a StorageAdapter class.
 *
 * The whole app state (tasks + notes + filters + view) is serialised under a
 * single key. A version number is stored alongside so future shape changes can
 * be migrated instead of silently corrupting data.
 */

import { STORAGE_KEY, STORAGE_VERSION } from './schema.js';
import { normalizeView } from '../utils/view.js';

/**
 * @implements {import('./adapter.js').StorageAdapter}
 */
export class LocalStorageAdapter {
	get type() {
		return 'localStorage';
	}

	get version() {
		return STORAGE_VERSION;
	}

	/** @returns {boolean} whether localStorage is usable in this environment. */
	get available() {
		return this.#hasStorage();
	}

	/** @returns {boolean} whether localStorage is usable in this environment. */
	#hasStorage() {
		try {
			return typeof localStorage !== 'undefined';
		} catch {
			return false;
		}
	}

	/**
	 * Migrate a persisted payload from an older version to the current one.
	 *
	 * A case must exist for every older version still in the wild: `loadState`
	 * discards (returns null for) anything it cannot migrate, so bumping
	 * `STORAGE_VERSION` without a case here throws away the whole local payload.
	 * @param {any} data
	 * @returns {any}
	 */
	#migrate(data) {
		// v1 → v2: notes gained `pending` (see schema.js). A v1 note carries no
		// flag, and `normalizeNote` reads a missing flag as confirmed, so a note
		// another device deleted is still dropped. Nothing else in the payload
		// changed.
		if (data.version === 1) return { ...data, version: 2 };
		return data;
	}

	/**
	 * Load persisted state.
	 * @returns {Promise<import('./adapter.js').PersistedState|null>}
	 */
	async loadState() {
		if (!this.#hasStorage()) return null;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return null;

			/** @type {any} */
			let data = JSON.parse(raw);
			if (!data || typeof data !== 'object') return null;

			if (data.version !== STORAGE_VERSION) {
				data = this.#migrate(data);
				if (data.version !== STORAGE_VERSION) return null; // unmigratable
			}

			return {
				version: STORAGE_VERSION,
				tasks: Array.isArray(data.tasks) ? data.tasks : [],
				filters: data.filters ?? null,
				view: normalizeView(data.view),
				notes: Array.isArray(data.notes) ? data.notes : [],
				activeNoteId: data.activeNoteId ?? null
			};
		} catch (err) {
			console.warn('[storage] failed to load state:', err);
			return null;
		}
	}

	/**
	 * Persist state. Returns an outcome so callers can surface quota errors.
	 * @param {import('./adapter.js').PersistedState} state
	 * @returns {Promise<import('./adapter.js').StorageResult>}
	 */
	async saveState(state) {
		if (!this.#hasStorage()) return { ok: false, reason: 'unavailable' };
		try {
			const payload = JSON.stringify({
				version: STORAGE_VERSION,
				tasks: state.tasks,
				filters: state.filters,
				view: state.view,
				notes: state.notes ?? [],
				activeNoteId: state.activeNoteId ?? null
			});
			localStorage.setItem(STORAGE_KEY, payload);
			return { ok: true };
		} catch (err) {
			const quota =
				err instanceof DOMException &&
				(err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
			console.warn('[storage] failed to save state:', err);
			return { ok: false, reason: quota ? 'quota' : 'error', error: err };
		}
	}

	/** Remove all persisted state (used by "reset" / debugging). */
	async clear() {
		if (!this.#hasStorage()) return;
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch (err) {
			console.warn('[storage] failed to clear state:', err);
		}
	}
}
