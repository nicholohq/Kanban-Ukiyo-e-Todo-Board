/**
 * Test environment setup for the storage layer.
 *
 * The storage code targets the browser (IndexedDB + localStorage). In the Node
 * test environment neither exists, so we polyfill both and reset them before
 * every test for full isolation:
 *
 *  - IndexedDB  → `fake-indexeddb`, a spec-compliant in-memory implementation.
 *                 A fresh `IDBFactory` per test means no shared database state.
 *  - localStorage → a minimal in-memory Storage shim, cleared per test.
 */

import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach } from 'vitest';

/** Minimal in-memory Storage implementation sufficient for the adapter. */
class MemoryStorage {
	/** @type {Map<string, string>} */
	#map = new Map();

	get length() {
		return this.#map.size;
	}

	clear() {
		this.#map.clear();
	}

	/** @param {string} key */
	getItem(key) {
		const k = String(key);
		return this.#map.has(k) ? this.#map.get(k) : null;
	}

	/** @param {string} key @param {string} value */
	setItem(key, value) {
		this.#map.set(String(key), String(value));
	}

	/** @param {string} key */
	removeItem(key) {
		this.#map.delete(String(key));
	}

	/** @param {number} index */
	key(index) {
		return [...this.#map.keys()][index] ?? null;
	}
}

globalThis.localStorage = new MemoryStorage();

beforeEach(() => {
	// Fresh, empty IndexedDB and localStorage before every test.
	globalThis.indexedDB = new IDBFactory();
	globalThis.localStorage.clear();
});
