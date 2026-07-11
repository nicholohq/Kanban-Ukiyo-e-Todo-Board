import { createClient } from '@libsql/client';

let _db;

export function getDb() {
	if (!_db) {
		const url = process.env.TURSO_DB_URL;
		const authToken = process.env.TURSO_AUTH_TOKEN;
		if (!url) {
			throw new Error('TURSO_DB_URL environment variable is required');
		}
		_db = createClient({ url, authToken });
	}
	return _db;
}
