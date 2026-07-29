<script>
	/**
	 * @type {{
	 *   onclick?: () => void,
	 *   visible?: boolean
	 * }}
	 */
	let { onclick, visible = true } = $props();
</script>

{#if visible}
	<button
		class="fab"
		onclick={onclick}
		aria-label="Create new task"
	>
		<span aria-hidden="true">＋</span>
	</button>
{/if}

<style>
	.fab {
		position: fixed;
		bottom: max(var(--s5), env(safe-area-inset-bottom, 0px));
		right: max(var(--s4), env(safe-area-inset-right, 0px));
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--vermilion);
		color: var(--linen);
		border: var(--border-thin);
		box-shadow: var(--shadow);
		font-size: 1.5rem;
		font-weight: 700;
		cursor: pointer;
		display: grid;
		place-items: center;
		z-index: var(--z-fab);
		animation: fab-enter 0.2s ease-out;
		transition: transform var(--ease), box-shadow var(--ease);
	}
	.fab:hover {
		transform: scale(1.08);
		box-shadow: 6px 6px 0 var(--charcoal);
	}
	.fab:active {
		transform: scale(0.96);
		box-shadow: 2px 2px 0 var(--charcoal);
	}

	@keyframes fab-enter {
		from {
			transform: scale(0);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	@media (min-width: 1025px) {
		.fab {
			display: none;
		}
	}
</style>
