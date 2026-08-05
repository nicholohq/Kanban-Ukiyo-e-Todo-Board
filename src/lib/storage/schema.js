/**
 * Storage schema constants. Values only — no logic.
 *
 * These names are the single source of truth for both the IndexedDB database
 * and the legacy localStorage key so future schema migrations never scatter
 * magic strings across the codebase.
 */

/** IndexedDB database name. */
export const DB_NAME = 'ukiyo-kanban';

/** IndexedDB version — increment when the object store set changes. */
export const DB_VERSION = 1;

/** localStorage key (kept for backward compatibility). */
export const STORAGE_KEY = 'ukiyo-kanban';

/** PersistedState shape version — increment on breaking layout changes. */
export const STORAGE_VERSION = 1;

/** IndexedDB object store names. */
export const STORES = Object.freeze({
	TASKS: 'tasks',
	SETTINGS: 'settings',
	METADATA: 'metadata'
});
