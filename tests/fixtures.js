/**
 * Shared test fixtures for the storage-layer suites.
 */

import { STORAGE_VERSION } from '../src/lib/storage/schema.js';

/**
 * Build `n` deterministic tasks matching the Task shape used across the app.
 * @param {number} n
 * @returns {import('../src/lib/storage/adapter.js').PersistedState['tasks']}
 */
export function makeTasks(n) {
	return Array.from({ length: n }, (_, i) => ({
		id: `t${i}`,
		title: `Task ${i}`,
		description: '',
		priority: 'medium',
		category: 'work',
		tags: [],
		dueDate: null,
		status: i % 3 === 0 ? 'todo' : i % 3 === 1 ? 'in-progress' : 'done',
		createdAt: i,
		updatedAt: i
	}));
}

/**
 * Build `n` deterministic notes matching the Note shape.
 * @param {number} n
 * @returns {import('../src/lib/utils/notes.js').Note[]}
 */
export function makeNotes(n) {
	return Array.from({ length: n }, (_, i) => ({
		id: `n${i}`,
		title: `Note ${i}`,
		body: `Body ${i}`,
		position: i,
		createdAt: i,
		updatedAt: i
	}));
}

/**
 * A complete PersistedState with `n` tasks.
 * @param {number} [n]
 * @param {'list'|'board'|'notes'} [view]
 * @param {import('../src/lib/utils/notes.js').Note[]} [notes]
 * @returns {import('../src/lib/storage/adapter.js').PersistedState}
 */
export function sampleState(n = 2, view = 'board', notes = []) {
	return {
		version: STORAGE_VERSION,
		tasks: makeTasks(n),
		filters: null,
		view,
		notes,
		activeNoteId: null
	};
}
