import { getDb } from '$lib/server/db.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	username TEXT UNIQUE NOT NULL,
	password_hash TEXT NOT NULL,
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL,
	description TEXT DEFAULT '' NOT NULL,
	priority TEXT NOT NULL DEFAULT 'medium',
	category TEXT NOT NULL DEFAULT 'work',
	tags TEXT DEFAULT '[]' NOT NULL,
	due_date TEXT,
	status TEXT NOT NULL DEFAULT 'todo',
	position INTEGER NOT NULL DEFAULT 0,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);

-- There is no schema version table, so migrate() runs this whole script on every
-- boot. IF NOT EXISTS on every statement is what makes that safe to re-run
-- against an existing database: already-applied objects are skipped, not recreated.
CREATE TABLE IF NOT EXISTS notes (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL DEFAULT 'Untitled',
	body TEXT NOT NULL DEFAULT '',
	position INTEGER NOT NULL DEFAULT 0,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_position ON notes(user_id, position);
`;

export async function migrate() {
	const db = getDb();
	await db.executeMultiple(SCHEMA);
}
