/**
 * Automatic localStorage → IndexedDB migration.
 *
 * Flow:
 *  1. Check migration metadata.
 *  2. Skip if already migrated.
 *  3. Load legacy localStorage state.
 *  4. Save into IndexedDB.
 *  5. Verify integrity (task count + every task ID present).
 *  6. Write migration metadata.
 *  7. Leave localStorage untouched.
 *
 * Idempotent: running twice is harmless (metadata short-circuits, and if no
 * metadata exists yet the write is simply re-attempted).
 */

/**
 * @param {import('./indexeddb.js').IndexedDBAdapter} indexeddb
 * @param {import('./local-storage.js').LocalStorageAdapter} legacy
 * @returns {Promise<{ok: true, migrated: number} | {ok: false, reason: string, error?: unknown}>}
 */
export async function migrateFromLocalStorage(indexeddb, legacy) {
	const existing = await indexeddb.getMigrationMetadata();
	if (existing?.migratedAt) {
		return { ok: true, migrated: existing.taskCount ?? 0 };
	}

	/** @type {import('./adapter.js').PersistedState|null} */
	let data = null;
	try {
		data = await legacy.loadState();
	} catch (err) {
		return { ok: false, reason: 'read-legacy-failed', error: err };
	}

	// No legacy data (or empty) — nothing to move; still record completion so
	// the migration is idempotent for users who start with zero tasks.
	if (!data || !Array.isArray(data.tasks) || data.tasks.length === 0) {
		await indexeddb.markMigrationComplete({
			version: 1,
			migratedAt: Date.now(),
			source: 'localStorage',
			taskCount: 0
		});
		return { ok: true, migrated: 0 };
	}

	const result = await indexeddb.saveState(data);
	if (!result.ok) {
		return { ok: false, reason: `save-failed:${result.reason}`, error: result.error };
	}

	const saved = await indexeddb.loadState();
	if (!saved || !Array.isArray(saved.tasks)) {
		return { ok: false, reason: 'integrity-check-failed', error: new Error('IndexedDB returned no state after save') };
	}

	// Verification 1 — task count matches.
	if (saved.tasks.length !== data.tasks.length) {
		return {
			ok: false,
			reason: 'integrity-check-failed',
			error: new Error(`Expected ${data.tasks.length} tasks, got ${saved.tasks.length}`)
		};
	}

	// Verification 2 — every original task ID exists after migration.
	const savedIds = new Set(saved.tasks.map((t) => t.id));
	for (const task of data.tasks) {
		if (!savedIds.has(task.id)) {
			return {
				ok: false,
				reason: 'integrity-check-failed',
				error: new Error(`Task ${task.id} missing after migration`)
			};
		}
	}

	await indexeddb.markMigrationComplete({
		version: 1,
		migratedAt: Date.now(),
		source: 'localStorage',
		taskCount: saved.tasks.length
	});

	return { ok: true, migrated: saved.tasks.length };
}

/**
 * Probe whether IndexedDB is available in this environment.
 * @returns {Promise<boolean>}
 */
export async function isIndexedDBAvailable() {
	try {
		if (typeof indexedDB === 'undefined') return false;
		const db = await new Promise((resolve, reject) => {
			const req = indexedDB.open('__storage_probe__');
			req.onsuccess = () => {
				const opened = req.result;
				opened.close();
				resolve(true);
			};
			req.onerror = () => reject(req.error);
			req.onblocked = () => reject(new Error('blocked'));
		});
		return db === true;
	} catch {
		return false;
	}
}
