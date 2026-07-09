/**
 * Pure filtering & searching helpers. Kept side-effect free so the store can
 * feed them into a `$derived` and Svelte can memoise the result.
 */

/**
 * @typedef {Object} Filters
 * @property {string} search        - free text over title + description
 * @property {string[]} categories  - selected categories (empty = all)
 * @property {string[]} priorities  - selected priorities (empty = all)
 * @property {string[]} tags        - selected tags (empty = all, matches ANY)
 */

/** @returns {Filters} the default (nothing filtered) filter state. */
export function emptyFilters() {
	return { search: '', categories: [], priorities: [], tags: [] };
}

/** @returns {boolean} true when no filter is narrowing the list. */
export function isFilterActive(/** @type {Filters} */ f) {
	return Boolean(
		f.search.trim() || f.categories.length || f.priorities.length || f.tags.length
	);
}

/**
 * Apply all filters with AND logic across dimensions, OR within a dimension.
 * @param {import('$lib/stores/todoStore.svelte.js').Task[]} tasks
 * @param {Filters} filters
 * @returns {import('$lib/stores/todoStore.svelte.js').Task[]}
 */
export function filterTasks(tasks, filters) {
	const q = filters.search.trim().toLowerCase();
	const cats = filters.categories;
	const pris = filters.priorities;
	const tags = filters.tags;

	return tasks.filter((t) => {
		if (q) {
			const haystack = `${t.title} ${t.description}`.toLowerCase();
			if (!haystack.includes(q)) return false;
		}
		if (cats.length && !cats.includes(t.category)) return false;
		if (pris.length && !pris.includes(t.priority)) return false;
		if (tags.length && !tags.some((tag) => t.tags.includes(tag))) return false;
		return true;
	});
}

/**
 * Count occurrences of a field value across tasks, for filter badges.
 * @param {import('$lib/stores/todoStore.svelte.js').Task[]} tasks
 * @param {keyof import('$lib/stores/todoStore.svelte.js').Task} field
 * @returns {Record<string, number>}
 */
export function countBy(tasks, field) {
	/** @type {Record<string, number>} */
	const counts = {};
	for (const t of tasks) {
		const v = t[field];
		if (Array.isArray(v)) {
			for (const item of v) counts[item] = (counts[item] ?? 0) + 1;
		} else if (v != null) {
			counts[String(v)] = (counts[String(v)] ?? 0) + 1;
		}
	}
	return counts;
}

/**
 * Unique, sorted tag list derived from tasks.
 * @param {import('$lib/stores/todoStore.svelte.js').Task[]} tasks
 * @returns {string[]}
 */
export function collectTags(tasks) {
	const set = new Set();
	for (const t of tasks) for (const tag of t.tags) set.add(tag);
	return [...set].sort((a, b) => a.localeCompare(b));
}
