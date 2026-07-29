<script>
	import { pwa } from '$lib/stores/pwa.svelte.js';
	import { fly } from 'svelte/transition';

	let dismissed = $state(false);

	$effect(() => {
		if (pwa.updatePending && !dismissed) {
			dismissed = false;
		}
	});

	function handleReload() {
		window.location.reload();
	}

	function handleDismiss() {
		dismissed = true;
	}
</script>

{#if pwa.updatePending && !dismissed}
	<div class="pwa-update" role="alert" aria-live="polite" transition:fly={{ duration: 300, y: 20 }}>
		<div class="pwa-update__text">
			<div class="pwa-update__title">Update Available</div>
			<div class="pwa-update__desc">
				{#if pwa.isIdle}
					Updating...
				{:else}
					Will update when you finish editing
				{/if}
			</div>
		</div>
		<div class="pwa-update__actions">
			<button class="btn btn--sm" onclick={handleReload}>Reload</button>
			<button
				class="btn btn--ghost btn--sm"
				onclick={handleDismiss}
				aria-label="Dismiss update notification"
			>×</button>
		</div>
	</div>
{/if}

<style>
	.pwa-update {
		position: fixed;
		bottom: var(--s4);
		right: var(--s4);
		z-index: 5000;
		display: flex;
		align-items: center;
		gap: var(--s3);
		padding: var(--s2) var(--s3);
		background: var(--paper);
		color: var(--charcoal);
		font-family: var(--gothic);
		border: var(--border-thin);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}

	.pwa-update__title {
		font-size: 0.8rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.pwa-update__desc {
		font-size: 0.7rem;
		opacity: 0.7;
		line-height: 1.3;
	}

	.pwa-update__actions {
		display: flex;
		align-items: center;
		gap: var(--s1);
		flex-shrink: 0;
	}

	@media (max-width: 520px) {
		.pwa-update {
			left: var(--s2);
			right: var(--s2);
			bottom: var(--s2);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pwa-update {
			transition: none;
		}
	}
</style>
