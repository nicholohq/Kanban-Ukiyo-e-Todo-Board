<script>
	import { fly, fade } from 'svelte/transition';

	/**
	 * @type {{
	 *   open: boolean,
	 *   message?: string,
	 *   onundo?: () => void,
	 *   onclose?: () => void,
	 *   duration?: number
	 * }}
	 */
	let { open, message = '', onundo, onclose, duration = 5000 } = $props();

	let timer = null;

	// Start/stop the auto-dismiss timer whenever the toast opens, and restart
	// it when a new message arrives while the toast is already open.
	$effect(() => {
		if (open) {
			message;
			startTimer();
			return stopTimer;
		}
	});

	function startTimer() {
		stopTimer();
		if (duration > 0) {
			timer = setTimeout(() => onclose?.(), duration);
		}
	}

	function stopTimer() {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	}

	function handleUndo() {
		stopTimer();
		onundo?.();
	}

	function handleClose() {
		stopTimer();
		onclose?.();
	}
</script>

{#if open}
	<div
		class="undo-region"
		role="status"
		aria-live="polite"
		in:fly={{ y: 16, duration: 220 }}
		out:fade={{ duration: 160 }}
	>
		<div class="undo-toast">
			<span class="undo-msg">{message}</span>
			<button type="button" class="undo-btn" onclick={handleUndo}>Undo</button>
			<button
				type="button"
				class="undo-dismiss"
				onclick={handleClose}
				aria-label="Dismiss notification"
			>
				×
			</button>
		</div>
	</div>
{/if}

<style>
	.undo-region {
		position: fixed;
		left: var(--s4);
		bottom: max(var(--s4), env(safe-area-inset-bottom, 0px));
		z-index: var(--z-toast);
		pointer-events: none;
	}
	.undo-toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: var(--s2);
		padding: var(--s2) var(--s3);
		background: var(--paper);
		border: var(--border-thin);
		border-left: 8px solid var(--indigo);
		border-radius: var(--radius);
		box-shadow: var(--shadow-sm);
		font-size: 0.9rem;
		font-weight: 500;
		max-width: min(360px, calc(100vw - 32px));
	}
	.undo-msg {
		flex: 1;
	}
	.undo-btn {
		flex: none;
		font-family: var(--gothic);
		font-weight: 700;
		font-size: 0.85rem;
		letter-spacing: 0.5px;
		color: var(--linen);
		background: var(--indigo);
		border: var(--border-thin);
		border-radius: var(--radius);
		padding: var(--s1) var(--s2);
		cursor: pointer;
		min-height: 44px;
	}
	.undo-btn:hover {
		background: var(--charcoal);
	}
	.undo-dismiss {
		flex: none;
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		background: none;
		border: none;
		font-size: 1.3rem;
		line-height: 1;
		cursor: pointer;
		color: var(--charcoal);
		padding: 0;
	}
	.undo-dismiss:hover {
		color: var(--vermilion);
	}

	@media (max-width: 520px) {
		.undo-region {
			left: var(--s3);
			right: var(--s3);
			bottom: max(var(--s3), env(safe-area-inset-bottom, 0px));
		}
		.undo-toast {
			max-width: none;
		}
	}
</style>
