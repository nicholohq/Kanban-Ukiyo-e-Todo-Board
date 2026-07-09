<script>
	/**
	 * @type {{
	 *   kanji?: string,
	 *   title?: string,
	 *   message?: string,
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let { kanji = '空', title = 'Nothing here yet', message = '', children } = $props();
</script>

<div class="empty">
	<div class="empty-mark" aria-hidden="true">{kanji}</div>
	<p class="empty-title">{title}</p>
	{#if message}<p class="empty-msg">{message}</p>{/if}
	{#if children}<div class="empty-action">{@render children()}</div>{/if}
</div>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: var(--s2);
		padding: var(--s6) var(--s4);
		color: var(--charcoal);
	}
	.empty-mark {
		font-family: var(--serif);
		font-size: 3rem;
		color: var(--gold);
		border: var(--border-thin);
		border-radius: 50%;
		width: 88px;
		height: 88px;
		display: grid;
		place-items: center;
		background: var(--paper);
		box-shadow: var(--shadow-sm);
	}
	.empty-title {
		font-family: var(--serif);
		font-weight: 700;
		font-size: 1.1rem;
	}
	.empty-msg {
		font-size: 0.9rem;
		opacity: 0.75;
		max-width: 36ch;
	}
	.empty-action {
		margin-top: var(--s2);
	}
</style>
