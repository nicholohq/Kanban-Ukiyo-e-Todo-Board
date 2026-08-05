/**
 * Storage adapter contract — JSDoc typedefs only.
 *
 * This module contains no runtime code. Types reference their canonical
 * definitions (Task, Filters) via JSDoc `import()` so domain models are never
 * duplicated.
 */

/**
 * @typedef {'localStorage' | 'indexeddb'} StorageType
 */

/**
 * Outcome of a persistence write.
 *
 * @typedef {{ ok: true }} StorageSuccess
 *
 * @typedef {{
 *   ok: false,
 *   reason: 'quota' | 'unavailable' | 'error',
 *   error?: unknown
 * }} StorageFailure
 *
 * @typedef {StorageSuccess | StorageFailure} StorageResult
 */

/**
 * The complete serialised application state.
 *
 * @typedef {Object} PersistedState
 * @property {number} version
 * @property {import('$lib/stores/todoStore.svelte.js').Task[]} tasks
 * @property {import('$lib/utils/filters.js').Filters|null} filters
 * @property {'list'|'board'} view
 */

/**
 * Contract every storage backend implements. The application only ever talks
 * to one of these through the StorageFacade.
 *
 * @typedef {Object} StorageAdapter
 * @property {StorageType} type
 * @property {boolean} available
 * @property {number} version
 * @property {() => Promise<PersistedState|null>} loadState
 * @property {(state: PersistedState) => Promise<StorageResult>} saveState
 * @property {() => Promise<void>} clear
 */
