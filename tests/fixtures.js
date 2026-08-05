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
 * A complete PersistedState with `n` tasks.
 * @param {number} [n]
 * @param {'list'|'board'} [view]
 * @returns {import('../src/lib/storage/adapter.js').PersistedState}
 */
export function sampleState(n = 2, view = 'board') {
	return {
		version: STORAGE_VERSION,
		tasks: makeTasks(n),
		filters: null,
		view
	};
}
