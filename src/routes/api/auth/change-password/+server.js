import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import { verifyPassword, hashPassword } from '$lib/server/auth.js';

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const { currentPassword, newPassword } = await request.json();

	if (!currentPassword || !newPassword) {
		return json({ error: 'Current and new password are required.' }, { status: 400 });
	}

	if (newPassword.length < 6) {
		return json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
	}

	const db = getDb();
	const result = await db.execute({
		sql: 'SELECT id, password_hash FROM users WHERE id = ?',
		args: [locals.user.userId]
	});

	if (result.rows.length === 0) {
		return json({ error: 'User not found.' }, { status: 404 });
	}

	const user = result.rows[0];
	if (!verifyPassword(currentPassword, user.password_hash)) {
		return json({ error: 'Current password is incorrect.' }, { status: 401 });
	}

	const passwordHash = hashPassword(newPassword);
	await db.execute({
		sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
		args: [passwordHash, user.id]
	});

	return json({ success: true });
}