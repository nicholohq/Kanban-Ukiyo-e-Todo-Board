import { migrate } from '$lib/server/migrate.js';
import { verifyToken } from '$lib/server/auth.js';

if (process.env.TURSO_DB_URL) {
	await migrate();
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
