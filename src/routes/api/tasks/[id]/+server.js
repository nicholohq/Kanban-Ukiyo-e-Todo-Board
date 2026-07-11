import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';

export async function PATCH({ locals, params, request }) {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const db = getDb();
	const input = await request.json();
	const now = Date.now();

	const allowed = ['title', 'description', 'priority', 'category', 'tags', 'dueDate', 'status'];
	const sets = [];
	const args = [];

	for (const key of allowed) {
		if (input[key] !== undefined) {
			if (key === 'dueDate') {
				sets.push('due_date = ?');
				args.push(input[key] || null);
			} else if (key === 'tags') {
				sets.push('tags = ?');
				args.push(JSON.stringify(input[key] ?? []));
			} else {
				sets.push(`${key} = ?`);
				args.push(input[key]);
			}
		}
	}

	if (sets.length === 0) {
		return json({ error: 'No fields to update.' }, { status: 400 });
	}

	sets.push('updated_at = ?');
	args.push(now);
	args.push(params.id);
	args.push(locals.user.userId);

	const result = await db.execute({
		sql: `UPDATE tasks SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
		args
	});

	if (result.rowsAffected === 0) {
		return json({ error: 'Task not found.' }, { status: 404 });
	}

	const updated = await db.execute({
		sql: 'SELECT * FROM tasks WHERE id = ?',
		args: [params.id]
	});

	const row = updated.rows[0];
	return json({
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
	});
}

export async function DELETE({ locals, params }) {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const db = getDb();
	const result = await db.execute({
		sql: 'DELETE FROM tasks WHERE id = ? AND user_id = ?',
		args: [params.id, locals.user.userId]
	});

	if (result.rowsAffected === 0) {
		return json({ error: 'Task not found.' }, { status: 404 });
	}

	return json({ ok: true });
}
