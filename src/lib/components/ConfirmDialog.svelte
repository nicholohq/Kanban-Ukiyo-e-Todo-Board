<script>
	import Modal from './Modal.svelte';

	/**
	 * @type {{
	 *   open?: boolean,
	 *   title?: string,
	 *   message?: string,
	 *   confirmLabel?: string,
	 *   onconfirm?: () => void,
	 *   oncancel?: () => void
	 * }}
	 */
	let {
		open = false,
		title = 'Are you sure?',
		message = '',
		confirmLabel = 'Confirm',
		onconfirm,
		oncancel
	} = $props();
</script>

<Modal {open} onclose={oncancel} {title}>
	<div class="confirm">
		<p class="confirm-msg">{message}</p>
		<div class="confirm-actions">
			<button type="button" class="btn btn--ghost" onclick={oncancel}>Cancel</button>
			<button type="button" class="btn btn--primary danger" onclick={onconfirm}>
				{confirmLabel}
			</button>
		</div>
	</div>
</Modal>

<style>
	.confirm-msg {
		font-size: 0.95rem;
		line-height: 1.5;
		margin-bottom: var(--s4);
	}
	.confirm-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--s2);
	}
	.danger {
		background: var(--vermilion);
	}
</style>
