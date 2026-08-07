class AuthStore {
	user = $state(null);
	loading = $state(true);

	async check() {
		try {
			const res = await fetch('/api/auth/me');
			if (res.ok) {
				this.user = await res.json();
			}
		} catch {
			this.user = null;
		} finally {
			this.loading = false;
		}
	}

	async login(username, password) {
		const res = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});
		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.error || 'Login failed');
		}
		this.user = await res.json();
	}

	async signup(username, password) {
		const res = await fetch('/api/auth/signup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});
		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.error || 'Signup failed');
		}
		this.user = await res.json();
	}

	async changePassword(currentPassword, newPassword) {
		const res = await fetch('/api/auth/change-password', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ currentPassword, newPassword })
		});
		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.error || 'Failed to change password');
		}
	}

	async logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		this.user = null;
	}
}

export const auth = new AuthStore();
