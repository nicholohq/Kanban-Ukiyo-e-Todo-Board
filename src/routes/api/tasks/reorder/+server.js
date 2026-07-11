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

	try {
		const transaction = await db.transaction('write');
		for (let i = 0; i < taskIds.length; i++) {
			await transaction.execute({
				sql: 'UPDATE tasks SET status = ?, position = ?, updated_at = ? WHERE id = ? AND user_id = ?',
				args: [column, i, now, taskIds[i], locals.user.userId]
			});
		}
		await transaction.commit();
	} catch (err) {
		return json({ error: 'Failed to reorder tasks.' }, { status: 500 });
	}

	return json({ ok: true });
}
