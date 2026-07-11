import { migrate } from '$lib/server/migrate.js';
import { verifyToken } from '$lib/server/auth.js';

try {
	await migrate();
} catch (err) {
	console.warn('[hooks] migration skipped —', err.message);
}

export function handle({ event, resolve }) {
	const token = event.cookies.get('session');
	if (token) {
		const payload = verifyToken(token);
		if (payload) {
			event.locals.user = { userId: payload.userId, username: payload.username };
		} else {
			event.cookies.delete('session', { path: '/' });
		}
	}
	return resolve(event);
}
