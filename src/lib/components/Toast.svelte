<script>
	import { toasts } from '$lib/stores/toasts.svelte.js';
	import { fly, fade } from 'svelte/transition';

	const KANJI = { success: '✓', error: '!', info: '｢' };
</script>

<!-- aria-live region: task operations are announced to screen readers here. -->
<div class="toast-region" role="status" aria-live="polite" aria-atomic="false">
	{#each toasts.items as t (t.id)}
		<div
			class="toast toast--{t.type}"
			in:fly={{ y: 16, duration: 220 }}
			out:fade={{ duration: 160 }}
		>
			<span class="toast-mark" aria-hidden="true">{KANJI[t.type] ?? '｢'}</span>
			<span class="toast-msg">{t.message}</span>
			<button
				class="toast-close"
				onclick={() => toasts.dismiss(t.id)}
				aria-label="Dismiss notification"
			>
				×
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-region {
		position: fixed;
		bottom: var(--s4);
		right: var(--s4);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: var(--s2);
		max-width: min(340px, calc(100vw - 32px));
		pointer-events: none;
	}
	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: var(--s2);
		padding: var(--s2) var(--s3);
		background: var(--paper);
		border: var(--border-thin);
		border-left-width: 8px;
		border-radius: var(--radius);
		box-shadow: var(--shadow-sm);
		font-size: 0.9rem;
		font-weight: 500;
	}
	.toast--success {
		border-left-color: var(--matcha);
	}
	.toast--error {
		border-left-color: var(--vermilion);
	}
	.toast--info {
		border-left-color: var(--indigo);
	}
	.toast-mark {
		font-family: var(--serif);
		font-weight: 700;
		font-size: 1rem;
		flex: none;
	}
	.toast--success .toast-mark {
		color: var(--matcha);
	}
	.toast--error .toast-mark {
		color: var(--vermilion);
	}
	.toast-msg {
		flex: 1;
	}
	.toast-close {
		flex: none;
		background: none;
		border: none;
		font-size: 1.3rem;
		line-height: 1;
		cursor: pointer;
		color: var(--charcoal);
		padding: 0 2px;
	}
	.toast-close:hover {
		color: var(--vermilion);
	}

	@media (max-width: 520px) {
		.toast-region {
			left: var(--s3);
			right: var(--s3);
			bottom: var(--s3);
			max-width: none;
		}
	}
</style>
