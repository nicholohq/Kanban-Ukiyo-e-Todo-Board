import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import { makeId } from '$lib/server/id.js';

function rowToNote(row) {
	return {
		id: row.id,
		title: String(row.title ?? ''),
		body: String(row.body ?? ''),
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
		sql: 'SELECT * FROM notes WHERE user_id = ? ORDER BY position ASC, created_at ASC',
		args: [locals.user.userId]
	});

	return json(result.rows.map(rowToNote));
}

export async function POST({ locals, request }) {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const db = getDb();
	const input = await request.json();
	const now = Date.now();

	// Keep the id the client sends, if any. Unlike tasks — where the server always
	// mints its own id — notes are reconciled by id when the local and server copies
	// merge on load. A server-assigned id here would make the client's copy look like
	// a brand-new note and resurrect it as a duplicate on the next load. The upsert
	// below also makes a retried create safe: when the first write landed but its
	// response was lost, re-sending the same id updates that row instead of raising a
	// primary-key conflict. created_at is deliberately absent from the DO UPDATE set,
	// so the original creation time survives a retry.
	const id = input.id ?? makeId();
	const note = {
		id,
		title: (input.title ?? '').trim() || 'Untitled',
		body: input.body ?? '',
		position: input.position ?? 0,
		createdAt: now,
		updatedAt: now
	};

	await db.execute({
		sql: `INSERT INTO notes (id, user_id, title, body, position, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				title = excluded.title,
				body = excluded.body,
				position = excluded.position,
				updated_at = excluded.updated_at
			WHERE notes.user_id = excluded.user_id`,
		args: [
			note.id, locals.user.userId, note.title, note.body,
			note.position, note.createdAt, note.updatedAt
		]
	});

	const saved = await db.execute({
		sql: 'SELECT * FROM notes WHERE id = ? AND user_id = ?',
		args: [note.id, locals.user.userId]
	});

	if (saved.rows.length === 0) {
		// The id already belongs to a different user, so the upsert's WHERE no-opped
		// and no row is visible to this caller. Report as a plain miss.
		return json({ error: 'Note not found.' }, { status: 404 });
	}

	return json(rowToNote(saved.rows[0]), { status: 201 });
}
