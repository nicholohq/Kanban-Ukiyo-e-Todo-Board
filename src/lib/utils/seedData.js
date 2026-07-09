/**
 * Sample tasks shown on first launch (before the user has any saved state).
 * Content is lightly Japanese/portfolio themed so the empty app still feels
 * alive in a demo. Dates are computed relative to load time.
 */

/** @returns {number} epoch ms offset from now by `days`. */
function daysFromNow(days) {
	return Date.now() + days * 86_400_000;
}

/** @returns {string} yyyy-mm-dd for a day offset from now. */
function dueIn(days) {
	return new Date(daysFromNow(days)).toISOString().slice(0, 10);
}

/**
 * Build the seed task list. Called once when no persisted state exists.
 * @param {() => string} makeId - id generator from the store
 * @returns {import('$lib/stores/todoStore.svelte.js').Task[]}
 */
export function createSeedTasks(makeId) {
	const now = Date.now();
	/** @type {Array<Partial<import('$lib/stores/todoStore.svelte.js').Task>>} */
	const seeds = [
		{
			title: 'Sketch the seigaiha wave pattern',
			description: 'Vector wave motif for the hero section background.',
			priority: 'high',
			category: 'work',
			tags: ['design', 'illustration'],
			dueDate: dueIn(2),
			status: 'in-progress'
		},
		{
			title: 'Study 20 new kanji',
			description: 'JLPT N4 set — focus on stroke order and readings.',
			priority: 'medium',
			category: 'study',
			tags: ['japanese', 'daily'],
			dueDate: dueIn(1),
			status: 'todo'
		},
		{
			title: 'Refactor the TodoStore to runes',
			description: 'Move all reactive state onto $state / $derived.',
			priority: 'high',
			category: 'work',
			tags: ['svelte', 'refactor'],
			dueDate: dueIn(0),
			status: 'todo'
		},
		{
			title: 'Brew a pot of sencha',
			description: 'Second flush. 70°C, 90 seconds.',
			priority: 'low',
			category: 'personal',
			tags: ['tea', 'break'],
			dueDate: null,
			status: 'done'
		},
		{
			title: 'Write kanban drag-and-drop tests',
			description: 'Cover moving cards between all three columns.',
			priority: 'medium',
			category: 'work',
			tags: ['testing', 'svelte'],
			dueDate: dueIn(4),
			status: 'todo'
		},
		{
			title: 'Plan a trip to Kanazawa',
			description: 'Kenroku-en garden and the gold-leaf workshops.',
			priority: 'low',
			category: 'personal',
			tags: ['travel'],
			dueDate: dueIn(30),
			status: 'in-progress'
		},
		{
			title: 'Read a chapter of "The Tale of Genji"',
			description: 'Chapter 5. Take notes on the Heian aesthetic.',
			priority: 'low',
			category: 'study',
			tags: ['reading', 'daily'],
			dueDate: null,
			status: 'done'
		}
	];

	return seeds.map((s, i) => ({
		id: makeId(),
		title: s.title ?? 'Untitled',
		description: s.description ?? '',
		priority: s.priority ?? 'medium',
		category: s.category ?? 'other',
		tags: s.tags ?? [],
		dueDate: s.dueDate ?? null,
		status: s.status ?? 'todo',
		createdAt: now - (seeds.length - i) * 60_000,
		updatedAt: now - (seeds.length - i) * 60_000
	}));
}
