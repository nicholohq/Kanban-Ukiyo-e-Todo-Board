/**
 * localStorage persistence with versioning and defensive error handling.
 *
 * The whole app state (tasks + filters + view) is serialised under a single
 * key. A version number is stored alongside so future shape changes can be
 * migrated instead of silently corrupting data.
 */

const STORAGE_KEY = 'ukiyo-kanban';
export const STORAGE_VERSION = 1;

/**
 * @typedef {Object} PersistedState
 * @property {number} version
 * @property {import('$lib/stores/todoStore.svelte.js').Task[]} tasks
 * @property {Object} filters
 * @property {'list' | 'board'} view
 */

/** @returns {boolean} whether localStorage is usable in this environment. */
function hasStorage() {
	try {
		return typeof localStorage !== 'undefined';
	} catch {
		return false;
	}
}

/**
 * Migrate a persisted payload from an older version to the current one.
 * Currently a no-op passthrough; add cases here as the schema evolves.
 * @param {any} data
 * @returns {any}
 */
function migrate(data) {
	// Example for the future:
	// if (data.version === 1) { data = {...}; data.version = 2; }
	return data;
}

/**
 * Load persisted state.
 * @returns {{ tasks: any[], filters: any, view: string } | null}
 */
export function loadState() {
	if (!hasStorage()) return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		let data = JSON.parse(raw);
		if (!data || typeof data !== 'object') return null;

		if (data.version !== STORAGE_VERSION) {
			data = migrate(data);
			if (data.version !== STORAGE_VERSION) return null; // unmigratable
		}

		return {
			tasks: Array.isArray(data.tasks) ? data.tasks : [],
			filters: data.filters ?? null,
			view: data.view ?? 'board'
		};
	} catch (err) {
		console.warn('[storage] failed to load state:', err);
		return null;
	}
}

/**
 * Persist state. Returns an outcome so callers can surface quota errors.
 * @param {{ tasks: any[], filters: any, view: string }} state
 * @returns {{ ok: true } | { ok: false, reason: 'quota' | 'unavailable' | 'error', error?: unknown }}
 */
export function saveState(state) {
	if (!hasStorage()) return { ok: false, reason: 'unavailable' };
	try {
		const payload = JSON.stringify({
			version: STORAGE_VERSION,
			tasks: state.tasks,
			filters: state.filters,
			view: state.view
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
export function clearState() {
	if (!hasStorage()) return;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (err) {
		console.warn('[storage] failed to clear state:', err);
	}
}
