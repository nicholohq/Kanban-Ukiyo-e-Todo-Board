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
	// a brand-new note and resurrect it as a duplicate on the next load.
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
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
		args: [
			note.id, locals.user.userId, note.title, note.body,
			note.position, note.createdAt, note.updatedAt
		]
	});

	return json(note, { status: 201 });
}
