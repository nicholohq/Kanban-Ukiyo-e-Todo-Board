/**
 * Central application state — a single runes-based store.
 *
 * Holds the task list, the active filters and the current view, exposes derived
 * projections (filtered list, board columns, counts, tags) and all CRUD /
 * mutation methods. State auto-persists to localStorage (debounced 300ms).
 *
 * @typedef {'low'|'medium'|'high'} Priority
 * @typedef {'work'|'personal'|'study'|'other'} Category
 * @typedef {'todo'|'in-progress'|'done'} Status
 *
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {Priority} priority
 * @property {Category} category
 * @property {string[]} tags
 * @property {string|null} dueDate   - yyyy-mm-dd or null
 * @property {Status} status
 * @property {number} createdAt      - epoch ms
 * @property {number} updatedAt      - epoch ms
 */

import { browser } from '$app/environment';
import { loadState, saveState } from '$lib/utils/storage.js';
import { createSeedTasks } from '$lib/utils/seedData.js';
import { emptyFilters, filterTasks, collectTags, countBy } from '$lib/utils/filters.js';
import { toasts } from '$lib/stores/toasts.svelte.js';

export const CATEGORIES = /** @type {Category[]} */ (['work', 'personal', 'study', 'other']);
export const PRIORITIES = /** @type {Priority[]} */ (['low', 'medium', 'high']);
export const STATUSES = /** @type {Status[]} */ (['todo', 'in-progress', 'done']);

/** Display metadata for each status/priority/category (labels + kanji). */
export const STATUS_META = {
	todo: { label: 'To Do', kanji: '未', tone: 'var(--status-todo)' },
	'in-progress': { label: 'In Progress', kanji: '進', tone: 'var(--status-progress)' },
	done: { label: 'Done', kanji: '済', tone: 'var(--status-done)' }
};

export const PRIORITY_META = {
	low: { label: 'Low', kanji: '低', tone: 'var(--pri-low)' },
	medium: { label: 'Medium', kanji: '中', tone: 'var(--pri-medium)' },
	high: { label: 'High', kanji: '高', tone: 'var(--pri-high)' }
};

export const CATEGORY_META = {
	work: { label: 'Work', kanji: '仕' },
	personal: { label: 'Personal', kanji: '私' },
	study: { label: 'Study', kanji: '学' },
	other: { label: 'Other', kanji: '他' }
};

/** @returns {string} a reasonably unique id. */
function makeId() {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
	return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

class TodoStore {
	/** @type {Task[]} */
	tasks = $state([]);
	filters = $state(emptyFilters());
	/** @type {'list'|'board'} */
	view = $state('board');
	/** @type {'idle'|'saving'|'saved'|'error'} */
	saveStatus = $state('idle');

	/** @type {ReturnType<typeof setTimeout>|null} */
	#saveTimer = null;
	/** @type {ReturnType<typeof setTimeout>|null} */
	#savedFlagTimer = null;

	// ---- Derived projections ------------------------------------------------

	/** Tasks passing the active filters. */
	filteredTasks = $derived(filterTasks(this.tasks, this.filters));

	/** All tags present across tasks (sorted, unique). */
	availableTags = $derived(collectTags(this.tasks));

	categoryCounts = $derived(countBy(this.tasks, 'category'));
	priorityCounts = $derived(countBy(this.tasks, 'priority'));
	tagCounts = $derived(countBy(this.tasks, 'tags'));

	/** Filtered tasks grouped into the three kanban columns. */
	board = $derived.by(() => {
		/** @type {Record<Status, Task[]>} */
		const groups = { todo: [], 'in-progress': [], done: [] };
		for (const t of this.filteredTasks) (groups[t.status] ?? groups.todo).push(t);
		return groups;
	});

	/** Headline counts for the header + column badges. */
	counts = $derived.by(() => ({
		total: this.tasks.length,
		filtered: this.filteredTasks.length,
		todo: this.tasks.filter((t) => t.status === 'todo').length,
		'in-progress': this.tasks.filter((t) => t.status === 'in-progress').length,
		done: this.tasks.filter((t) => t.status === 'done').length
	}));

	constructor() {
		// Load persisted state or fall back to seed data (client only).
		const persisted = browser ? loadState() : null;
		if (persisted && Array.isArray(persisted.tasks)) {
			this.tasks = persisted.tasks;
			if (persisted.filters) this.filters = { ...emptyFilters(), ...persisted.filters };
			this.view = persisted.view === 'list' ? 'list' : 'board';
		} else if (browser) {
			this.tasks = createSeedTasks(makeId);
		}

		// Auto-persist on any state change (deep), debounced.
		if (browser) {
			$effect.root(() => {
				$effect(() => {
					const snapshot = {
						tasks: $state.snapshot(this.tasks),
						filters: $state.snapshot(this.filters),
						view: this.view
					};
					this.#scheduleSave(snapshot);
				});
			});
		}
	}

	// ---- Persistence --------------------------------------------------------

	/** @param {{tasks:any[],filters:any,view:string}} snapshot */
	#scheduleSave(snapshot) {
		if (this.#saveTimer) clearTimeout(this.#saveTimer);
		this.saveStatus = 'saving';
		this.#saveTimer = setTimeout(() => {
			const result = saveState(snapshot);
			if (result.ok) {
				this.saveStatus = 'saved';
				if (this.#savedFlagTimer) clearTimeout(this.#savedFlagTimer);
				this.#savedFlagTimer = setTimeout(() => (this.saveStatus = 'idle'), 1500);
			} else {
				this.saveStatus = 'error';
				if (result.reason === 'quota') {
					toasts.error('Storage is full — delete some tasks to keep saving.');
				} else if (result.reason !== 'unavailable') {
					toasts.error('Could not save changes to this browser.');
				}
			}
		}, 300);
	}

	// ---- CRUD ---------------------------------------------------------------

	/**
	 * Create a task from partial input. Title is required (trimmed).
	 * @param {Partial<Task>} input
	 * @returns {Task|null} the created task, or null if invalid
	 */
	addTask(input) {
		const title = (input.title ?? '').trim();
		if (!title) return null;
		const now = Date.now();
		/** @type {Task} */
		const task = {
			id: makeId(),
			title,
			description: (input.description ?? '').trim(),
			priority: PRIORITIES.includes(/** @type {Priority} */ (input.priority))
				? /** @type {Priority} */ (input.priority)
				: 'medium',
			category: CATEGORIES.includes(/** @type {Category} */ (input.category))
				? /** @type {Category} */ (input.category)
				: 'other',
			tags: normalizeTags(input.tags),
			dueDate: input.dueDate || null,
			status: STATUSES.includes(/** @type {Status} */ (input.status))
				? /** @type {Status} */ (input.status)
				: 'todo',
			createdAt: now,
			updatedAt: now
		};
		// Newest first.
		this.tasks = [task, ...this.tasks];
		toasts.success('Task added.');
		return task;
	}

	/**
	 * Patch an existing task.
	 * @param {string} id
	 * @param {Partial<Task>} patch
	 */
	updateTask(id, patch) {
		let changed = false;
		this.tasks = this.tasks.map((t) => {
			if (t.id !== id) return t;
			changed = true;
			const next = { ...t, ...patch, id: t.id, updatedAt: Date.now() };
			if (patch.tags !== undefined) next.tags = normalizeTags(patch.tags);
			if (patch.title !== undefined) next.title = String(patch.title).trim() || t.title;
			return next;
		});
		if (changed) toasts.success('Task updated.');
	}

	/** @param {string} id */
	deleteTask(id) {
		const existed = this.tasks.some((t) => t.id === id);
		this.tasks = this.tasks.filter((t) => t.id !== id);
		if (existed) toasts.info('Task deleted.');
	}

	/**
	 * Move a task to a status, optionally to a specific index within that
	 * column (used by drag-and-drop). Rebuilds the array to keep column order.
	 * @param {string} id
	 * @param {Status} status
	 * @param {number} [index] target position among that column's tasks
	 */
	moveTask(id, status, index) {
		const moving = this.tasks.find((t) => t.id === id);
		if (!moving) return;
		const updated = { ...moving, status, updatedAt: Date.now() };

		// Everything except the moved task, preserving relative order.
		const rest = this.tasks.filter((t) => t.id !== id);

		if (index === undefined) {
			this.tasks = [updated, ...rest];
			return;
		}

		// Insert at `index` counting only tasks already in the target column.
		/** @type {Task[]} */
		const result = [];
		let placedInColumn = 0;
		let inserted = false;
		for (const t of rest) {
			if (t.status === status && placedInColumn === index && !inserted) {
				result.push(updated);
				inserted = true;
			}
			result.push(t);
			if (t.status === status) placedInColumn++;
		}
		if (!inserted) result.push(updated);
		this.tasks = result;
	}

	/**
	 * Replace the ordered contents of one kanban column (drag-and-drop commit).
	 * Any task in `orderedIds` is forced to `status`; column order follows the
	 * given id order; tasks not in this column keep their positions.
	 * @param {Status} status
	 * @param {string[]} orderedIds
	 */
	setColumn(status, orderedIds) {
		const idSet = new Set(orderedIds);
		const byId = new Map(this.tasks.map((t) => [t.id, t]));

		// The dragged column's tasks, forced to this status, in the given order.
		const columnTasks = orderedIds
			.map((id) => byId.get(id))
			.filter(Boolean)
			.map((t) => (t.status === status ? t : { ...t, status, updatedAt: Date.now() }));

		// Rebuild the array: keep every task NOT in the dragged list exactly where
		// it was (so a sibling column committing on the same drop can't clobber a
		// same-status task), and inject the reordered column at the first slot it
		// previously occupied. Tasks whose id IS in the list are only re-added via
		// columnTasks — never dropped.
		/** @type {Task[]} */
		const result = [];
		let injected = false;
		for (const t of this.tasks) {
			if (idSet.has(t.id)) {
				if (!injected) {
					result.push(...columnTasks);
					injected = true;
				}
			} else {
				result.push(t);
			}
		}
		if (!injected) result.push(...columnTasks);
		this.tasks = result;
	}

	/** Toggle a task between done and todo (list-view checkbox). @param {string} id */
	toggleDone(id) {
		this.tasks = this.tasks.map((t) =>
			t.id === id
				? { ...t, status: t.status === 'done' ? 'todo' : 'done', updatedAt: Date.now() }
				: t
		);
	}

	// ---- Filters & view -----------------------------------------------------

	/** @param {string} value */
	setSearch(value) {
		this.filters = { ...this.filters, search: value };
	}

	/** @param {'categories'|'priorities'|'tags'} dim @param {string} value */
	toggleFilter(dim, value) {
		const current = this.filters[dim];
		const next = current.includes(value)
			? current.filter((v) => v !== value)
			: [...current, value];
		this.filters = { ...this.filters, [dim]: next };
	}

	clearFilters() {
		this.filters = emptyFilters();
	}

	/** @param {'list'|'board'} view */
	setView(view) {
		this.view = view;
	}
}

/**
 * Normalise tags input (array or comma string) → clean unique array.
 * @param {unknown} tags
 * @returns {string[]}
 */
function normalizeTags(tags) {
	/** @type {string[]} */
	let arr = [];
	if (Array.isArray(tags)) arr = tags.map(String);
	else if (typeof tags === 'string') arr = tags.split(',');
	return [...new Set(arr.map((t) => t.trim().toLowerCase()).filter(Boolean))];
}

/** The app-wide singleton store. */
export const todoStore = new TodoStore();
