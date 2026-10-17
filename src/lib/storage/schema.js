/**
 * Storage schema constants. Values only — no logic.
 *
 * These names are the single source of truth for both the IndexedDB database
 * and the legacy localStorage key so future schema migrations never scatter
 * magic strings across the codebase.
 */

/** IndexedDB database name. */
export const DB_NAME = 'ukiyo-kanban';

/** IndexedDB version — increment when the object store set changes (v2 added notes). */
export const DB_VERSION = 2;

/** localStorage key (kept for backward compatibility). */
export const STORAGE_KEY = 'ukiyo-kanban';

/**
 * PersistedState shape version — increment on breaking layout changes.
 *
 * v2: notes carry `pending`, the flag the merge reads to tell a never-synced
 * note (kept) from one another device deleted (dropped). A record written before
 * the flag exists has none, and reads as unconfirmed.
 */
export const STORAGE_VERSION = 2;

/** IndexedDB object store names. */
export const STORES = Object.freeze({
	TASKS: 'tasks',
	SETTINGS: 'settings',
	METADATA: 'metadata',
	NOTES: 'notes'
});
