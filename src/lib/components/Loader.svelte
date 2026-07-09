<script>
	import { fade } from 'svelte/transition';
</script>

<div class="loader" out:fade={{ duration: 400 }} role="status" aria-label="Loading">
	<div class="mark">
		<div class="ring"></div>
		<span class="kanji" aria-hidden="true">世</span>
	</div>
	<p class="loading-text">読み込み中 · Loading</p>
</div>

<style>
	.loader {
		position: fixed;
		inset: 0;
		z-index: 5000;
		background: var(--indigo);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--s4);
	}
	.mark {
		position: relative;
		width: 90px;
		height: 90px;
		display: grid;
		place-items: center;
	}
	.kanji {
		font-family: var(--serif);
		font-size: 3rem;
		color: var(--linen);
		animation: pulse 1.4s ease-in-out infinite;
	}
	.ring {
		position: absolute;
		inset: 0;
		border: 4px solid var(--vermilion);
		border-radius: 50%;
		border-top-color: transparent;
		border-right-color: transparent;
		animation: spin 1s linear infinite;
	}
	.loading-text {
		font-family: var(--serif);
		color: var(--gold);
		letter-spacing: 3px;
		font-size: 0.9rem;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}
</style>
