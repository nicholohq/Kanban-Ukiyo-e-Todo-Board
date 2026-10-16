/**
 * LEGACY — Backward compatibility wrapper.
 *
 * New code should import from `$lib/storage/storage.js`.
 *
 * This module preserves the original public API — loadState(), saveState(),
 * clearState() — by forwarding every call to the storage facade. It exists so
 * existing imports keep working while the storage migration stabilises.
 * Remove this layer only after every caller has migrated to the facade.
 */

import { storage } from '$lib/storage/storage.js';
import { STORAGE_VERSION } from '$lib/storage/schema.js';

export { STORAGE_VERSION };

/**
 * Load persisted state.
 * @returns {Promise<import('$lib/storage/adapter.js').PersistedState | null>}
 */
export async function loadState() {
	return storage.loadState();
}

/**
 * Persist state. Returns an outcome so callers can surface quota errors.
 * @param {import('$lib/storage/adapter.js').PersistedState} state
 * @returns {Promise<import('$lib/storage/adapter.js').StorageResult>}
 */
export async function saveState(state) {
	return storage.saveState({
		version: STORAGE_VERSION,
		tasks: state.tasks,
		filters: state.filters,
		view: state.view,
		notes: state.notes ?? [],
		activeNoteId: state.activeNoteId ?? null
	});
}

/** Remove all persisted state (used by "reset" / debugging). */
export function clearState() {
	return storage.clear();
}