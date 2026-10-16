import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';

export async function PATCH({ locals, params, request }) {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const db = getDb();
	const input = await request.json();
	const now = Date.now();

	const allowed = ['title', 'body', 'position'];
	const sets = [];
	const args = [];

	for (const key of allowed) {
		if (input[key] !== undefined) {
			sets.push(`${key} = ?`);
			args.push(input[key]);
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
		sql: `UPDATE notes SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
		args
	});

	if (result.rowsAffected === 0) {
		return json({ error: 'Note not found.' }, { status: 404 });
	}

	const updated = await db.execute({
		sql: 'SELECT * FROM notes WHERE id = ?',
		args: [params.id]
	});

	const row = updated.rows[0];
	return json({
		id: row.id,
		title: String(row.title ?? ''),
		body: String(row.body ?? ''),
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
		sql: 'DELETE FROM notes WHERE id = ? AND user_id = ?',
		args: [params.id, locals.user.userId]
	});

	if (result.rowsAffected === 0) {
		return json({ error: 'Note not found.' }, { status: 404 });
	}

	return json({ ok: true });
}
