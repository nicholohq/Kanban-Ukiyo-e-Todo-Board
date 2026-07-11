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
