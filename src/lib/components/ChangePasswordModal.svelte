<script>
	import Modal from './Modal.svelte';
	import { auth } from '$lib/stores/auth.svelte.js';

	/** @type {{ open?: boolean, onclose?: () => void }} */
	let { open = $bindable(false), onclose } = $props();

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let success = $state(false);
	let submitting = $state(false);

	async function submit(e) {
		e.preventDefault();
		error = '';
		success = false;

		if (newPassword.length < 6) {
			error = 'New password must be at least 6 characters.';
			return;
		}
		if (newPassword !== confirmPassword) {
			error = 'New passwords do not match.';
			return;
		}

		submitting = true;
		try {
			await auth.changePassword(currentPassword, newPassword);
			success = true;
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} catch (err) {
			error = err.message;
		} finally {
			submitting = false;
		}
	}

	function close() {
		open = false;
		onclose?.();
	}
</script>

<Modal bind:open={open} title="Change Password" onclose={onclose}>
	{#if success}
		<p class="message success">Password updated successfully.</p>
		<div class="footer">
			<button class="btn btn--primary" onclick={close}>Done</button>
		</div>
	{:else}
		<form onsubmit={submit}>
			<div class="field">
				<label for="currentPassword">Current password</label>
				<input
					id="currentPassword"
					type="password"
					class="input"
					bind:value={currentPassword}
					required
					autocomplete="current-password"
				/>
			</div>

			<div class="field">
				<label for="newPassword">New password</label>
				<input
					id="newPassword"
					type="password"
					class="input"
					bind:value={newPassword}
					required
					minlength={6}
					autocomplete="new-password"
				/>
			</div>

			<div class="field">
				<label for="confirmPassword">Confirm new password</label>
				<input
					id="confirmPassword"
					type="password"
					class="input"
					bind:value={confirmPassword}
					required
					minlength={6}
					autocomplete="new-password"
				/>
			</div>

			{#if error}
				<p class="error" role="alert">{error}</p>
			{/if}

			<div class="footer">
				<button type="button" class="btn btn--ghost" onclick={close} disabled={submitting}>Cancel</button>
				<button type="submit" class="btn btn--primary" disabled={submitting}>
					{submitting ? 'Updating…' : 'Update Password'}
				</button>
			</div>
		</form>
	{/if}
</Modal>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: var(--s3);
	}
	.error {
		font-size: 0.85rem;
		color: var(--vermilion);
		font-weight: 700;
	}
	.success {
		font-size: 0.9rem;
		color: var(--matcha);
		font-weight: 700;
	}
	.footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--s2);
		margin-top: var(--s2);
	}
</style>