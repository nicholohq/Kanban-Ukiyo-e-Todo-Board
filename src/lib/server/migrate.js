import { getDb } from '$lib/server/db.js';
import fs from 'fs';
import path from 'path';

export async function migrate() {
	const db = getDb();
	const sql = fs.readFileSync(path.resolve('src/lib/server/schema.sql'), 'utf-8');
	await db.executeMultiple(sql);
}
