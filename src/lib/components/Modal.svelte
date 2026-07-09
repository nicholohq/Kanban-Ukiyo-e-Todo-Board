<script>
	import { fade, scale } from 'svelte/transition';

	/**
	 * @type {{
	 *   open?: boolean,
	 *   title?: string,
	 *   onclose?: () => void,
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let { open = $bindable(false), title = '', onclose, children } = $props();

	/** @type {HTMLElement|null} */
	let dialogEl = $state(null);
	/** @type {Element|null} */
	let previouslyFocused = null;

	function close() {
		open = false;
		onclose?.();
	}

	/** @returns {HTMLElement[]} visible, focusable descendants of the dialog. */
	function focusable() {
		if (!dialogEl) return [];
		const sel =
			'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
		return /** @type {HTMLElement[]} */ ([...dialogEl.querySelectorAll(sel)]).filter(
			(el) => el.offsetParent !== null
		);
	}

	/** @param {KeyboardEvent} e */
	function onkeydown(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
			return;
		}
		if (e.key !== 'Tab') return;
		const items = focusable();
		if (items.length === 0) return;
		const first = items[0];
		const last = items[items.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	// Focus management + scroll lock while open; restore focus on close.
	$effect(() => {
		if (!open) return;
		previouslyFocused = document.activeElement;
		document.body.style.overflow = 'hidden';
		queueMicrotask(() => (focusable()[0] ?? dialogEl)?.focus());
		return () => {
			document.body.style.overflow = '';
			if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
		};
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="backdrop" transition:fade={{ duration: 150 }} onclick={close}>
		<div
			class="modal"
			bind:this={dialogEl}
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
			{onkeydown}
			onclick={(e) => e.stopPropagation()}
			transition:scale={{ start: 0.96, duration: 180 }}
		>
			<header class="modal-head">
				<h2>{title}</h2>
				<button class="icon-btn" onclick={close} aria-label="Close dialog">×</button>
			</header>
			<div class="modal-body">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 900;
		background: rgba(26, 42, 58, 0.55);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: var(--s5) var(--s3);
		overflow-y: auto;
	}
	.modal {
		width: 100%;
		max-width: 520px;
		background: var(--linen);
		border: var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		margin: auto;
	}
	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--s3);
		padding: var(--s3) var(--s4);
		background: var(--indigo);
		border-bottom: var(--border);
		border-radius: 2px 2px 0 0;
	}
	.modal-head h2 {
		color: var(--linen);
		font-size: 1.15rem;
		margin: 0;
	}
	.modal-head .icon-btn {
		font-size: 1.3rem;
		line-height: 1;
	}
	.modal-body {
		padding: var(--s4);
	}

	@media (max-width: 520px) {
		.backdrop {
			padding: var(--s3) var(--s2);
		}
		.modal-body {
			padding: var(--s3);
		}
	}
</style>
