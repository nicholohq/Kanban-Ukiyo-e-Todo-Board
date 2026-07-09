/** Date helpers for due-date display and overdue detection. */

/**
 * Format a yyyy-mm-dd string as a short human label (e.g. "Jul 9").
 * @param {string|null} iso
 * @returns {string}
 */
export function formatDueDate(iso) {
	if (!iso) return '';
	const d = new Date(`${iso}T00:00:00`);
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Is a task past due? (dueDate before today and not done)
 * @param {string|null} iso
 * @param {string} status
 * @returns {boolean}
 */
export function isOverdue(iso, status) {
	if (!iso || status === 'done') return false;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const due = new Date(`${iso}T00:00:00`);
	return due.getTime() < today.getTime();
}

/**
 * Whole days from today to `iso` (negative = past). Null when no date.
 * @param {string|null} iso
 * @returns {number|null}
 */
export function daysUntil(iso) {
	if (!iso) return null;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const due = new Date(`${iso}T00:00:00`);
	if (Number.isNaN(due.getTime())) return null;
	return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Relative due label: "Today", "Tomorrow", "3d overdue", "in 5d".
 * @param {string|null} iso
 * @returns {string}
 */
export function dueRelative(iso) {
	const d = daysUntil(iso);
	if (d === null) return '';
	if (d === 0) return 'Today';
	if (d === 1) return 'Tomorrow';
	if (d === -1) return '1d overdue';
	if (d < 0) return `${-d}d overdue`;
	return `in ${d}d`;
}
