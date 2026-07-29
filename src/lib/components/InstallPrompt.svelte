<script>
	import { pwa } from '$lib/stores/pwa.svelte.js';
	import { browser } from '$app/environment';
	import { fly } from 'svelte/transition';

	let show = $state(false);
	let dismissed = $state(false);

	$effect(() => {
		if (!browser) return;
		if (pwa.isInstallable && !pwa.isInstalled && !dismissed) {
			const timer = setTimeout(() => { show = true; }, 5000);
			return () => clearTimeout(timer);
		}
	});

	$effect(() => {
		if (pwa.isInstalled) show = false;
	});

	function handleInstall() {
		pwa.install();
	}

	function handleDismiss() {
		show = false;
		dismissed = true;
	}

	$effect(() => {
		pwa.deferredPrompt;
	});
</script>

{#if show && !pwa.isInstalled}
	<div class="pwa-install" role="alert" aria-live="polite" transition:fly={{ duration: 300, y: 20 }}>
		<div class="pwa-install__text">
			<span class="pwa-install__kanji" aria-hidden="true">浮</span>
			<div>
				<div class="pwa-install__title">Install App</div>
				<div class="pwa-install__desc">Add to your home screen for offline access</div>
			</div>
		</div>
		<div class="pwa-install__actions">
			{#if pwa.deferredPrompt}
				<button class="btn btn--sm" onclick={handleInstall}>Install</button>
			{:else}
				<button class="btn btn--sm" onclick={handleInstall}>Instructions</button>
			{/if}
			<button
				class="btn btn--ghost btn--sm"
				onclick={handleDismiss}
				aria-label="Dismiss install prompt"
			>×</button>
		</div>
	</div>
{/if}

<style>
	.pwa-install {
		position: fixed;
		bottom: max(var(--s4), env(safe-area-inset-bottom, 0px));
		left: 50%;
		transform: translateX(-50%);
		z-index: var(--z-loader);
		display: flex;
		align-items: center;
		gap: var(--s3);
		padding: var(--s2) var(--s3);
		background: var(--indigo);
		color: var(--linen);
		font-family: var(--gothic);
		border: var(--border-thin);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		max-width: 90vw;
	}

	.pwa-install__text {
		display: flex;
		align-items: center;
		gap: var(--s2);
	}

	.pwa-install__kanji {
		font-family: var(--serif);
		font-size: 1.4rem;
		color: var(--gold);
		line-height: 1;
	}

	.pwa-install__title {
		font-size: 0.8rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.pwa-install__desc {
		font-size: 0.7rem;
		opacity: 0.8;
		line-height: 1.3;
	}

	.pwa-install__actions {
		display: flex;
		align-items: center;
		gap: var(--s1);
		flex-shrink: 0;
	}

	@media (max-width: 520px) {
		.pwa-install {
			flex-direction: column;
			align-items: stretch;
			text-align: center;
			bottom: max(var(--s2), env(safe-area-inset-bottom, 0px));
			padding: var(--s2);
		}

		.pwa-install__text {
			flex-direction: column;
		}

		.pwa-install__actions {
			justify-content: center;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pwa-install {
			transition: none;
		}
	}
</style>
