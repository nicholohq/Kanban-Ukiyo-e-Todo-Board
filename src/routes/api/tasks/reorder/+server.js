import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';

export async function PUT({ locals, request }) {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const db = getDb();
	const { column, taskIds } = await request.json();

	if (!column || !Array.isArray(taskIds)) {
		return json({ error: 'column and taskIds are required.' }, { status: 400 });
	}

	const now = Date.now();
	const stmt = db.transaction('WRITE');

	try {
		for (let i = 0; i < taskIds.length; i++) {
			await stmt.execute({
				sql: 'UPDATE tasks SET status = ?, position = ?, updated_at = ? WHERE id = ? AND user_id = ?',
				args: [column, i, now, taskIds[i], locals.user.userId]
			});
		}
		stmt.commit();
	} catch (err) {
		stmt.rollback();
		return json({ error: 'Failed to reorder tasks.' }, { status: 500 });
	}

	return json({ ok: true });
}
