/**
 * Tiny toast notification store (runes-based). Toasts double as the app's
 * screen-reader announcement channel (the container is an aria-live region).
 */

let nextId = 0;

class ToastStore {
	/** @type {{ id: number, message: string, type: 'success'|'error'|'info' }[]} */
	items = $state([]);

	/**
	 * @param {string} message
	 * @param {'success'|'error'|'info'} [type]
	 * @param {number} [timeout] ms before auto-dismiss (0 = sticky)
	 * @returns {number} toast id
	 */
	push(message, type = 'info', timeout = 3000) {
		const id = ++nextId;
		this.items = [...this.items, { id, message, type }];
		if (timeout && typeof window !== 'undefined') {
			setTimeout(() => this.dismiss(id), timeout);
		}
		return id;
	}

	/** @param {string} m @param {number} [t] */
	success(m, t) {
		return this.push(m, 'success', t);
	}
	/** @param {string} m @param {number} [t] */
	error(m, t = 5000) {
		return this.push(m, 'error', t);
	}
	/** @param {string} m @param {number} [t] */
	info(m, t) {
		return this.push(m, 'info', t);
	}

	/** @param {number} id */
	dismiss(id) {
		this.items = this.items.filter((x) => x.id !== id);
	}
}

export const toasts = new ToastStore();
