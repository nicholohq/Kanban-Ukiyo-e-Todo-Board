import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import { makeId } from '$lib/server/id.js';

function rowToTask(row) {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		priority: row.priority,
		category: row.category,
		tags: JSON.parse(row.tags || '[]'),
		dueDate: row.due_date || null,
		status: row.status,
		position: row.position,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const db = getDb();
	const result = await db.execute({
		sql: 'SELECT * FROM tasks WHERE user_id = ? ORDER BY position ASC, created_at DESC',
		args: [locals.user.userId]
	});

	return json(result.rows.map(rowToTask));
}

export async function POST({ locals, request }) {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const db = getDb();
	const input = await request.json();
	const now = Date.now();

	const id = makeId();
	const task = {
		id,
		title: (input.title ?? '').trim(),
		description: (input.description ?? '').trim(),
		priority: input.priority ?? 'medium',
		category: input.category ?? 'other',
		tags: input.tags ?? [],
		dueDate: input.dueDate || null,
		status: input.status ?? 'todo',
		createdAt: now,
		updatedAt: now
	};

	if (!task.title) {
		return json({ error: 'Title is required.' }, { status: 400 });
	}

	await db.execute({
		sql: `INSERT INTO tasks (id, user_id, title, description, priority, category, tags, due_date, status, position, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
		args: [
			task.id, locals.user.userId, task.title, task.description,
			task.priority, task.category, JSON.stringify(task.tags),
			task.dueDate, task.status, task.createdAt, task.updatedAt
		]
	});

	return json(task, { status: 201 });
}
