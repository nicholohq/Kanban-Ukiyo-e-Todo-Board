import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';

export async function PUT({ locals, request }) {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const db = getDb();
	const { noteIds } = await request.json();

	if (!Array.isArray(noteIds)) {
		return json({ error: 'noteIds is required.' }, { status: 400 });
	}

	const now = Date.now();

	try {
		const transaction = await db.transaction('write');
		for (let i = 0; i < noteIds.length; i++) {
			await transaction.execute({
				sql: 'UPDATE notes SET position = ?, updated_at = ? WHERE id = ? AND user_id = ?',
				args: [i, now, noteIds[i], locals.user.userId]
			});
		}
		await transaction.commit();
	} catch (err) {
		return json({ error: 'Failed to reorder notes.' }, { status: 500 });
	}

	return json({ ok: true });
}
