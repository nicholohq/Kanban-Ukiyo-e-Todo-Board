import { json } from '@sveltejs/kit';

export function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}
	return json({ id: locals.user.userId, username: locals.user.username });
}
