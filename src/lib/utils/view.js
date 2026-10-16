/** @type {readonly ['board','list','notes']} */
export const VIEWS = Object.freeze(['board', 'list', 'notes']);

/**
 * Coerce a persisted/unknown view value to a valid one.
 * @param {unknown} value
 * @returns {'board'|'list'|'notes'}
 */
export function normalizeView(value) {
	return VIEWS.includes(/** @type {any} */ (value)) ? /** @type {any} */ (value) : 'board';
}
