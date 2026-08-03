<script>
	/**
	 * Swipe-to-reveal-actions row (mobile only).
	 *
	 * Horizontal swipe reveals a Delete button behind the content; the gesture
	 * itself never deletes. Vertical scrolling wins over the swipe (touch-action
	 * is pan-y so the browser owns vertical panning).
	 *
	 * @type {{
	 *   disabled?: boolean,
	 *   threshold?: number,
	 *   onswipeleft?: () => void,
	 *   ondelete?: () => void,
	 *   children: import('svelte').Snippet
	 * }}
	 */
	let {
		disabled = false,
		threshold = 96,
		onswipeleft,
		ondelete,
		children
	} = $props();

	const REVEAL = 128;
	const HORIZONTAL_LOCK_PX = 10;
	const ELASTIC = 0.3;

	let startX = 0;
	let startY = 0;
	let tracking = false;
	let locked = false;
	let offset = $state(0);
	let revealed = $state(false);
	let hasVibrated = $state(false);
	let suppressTap = $state(false);

	let swiping = $derived((tracking && locked) || revealed);

	function reset() {
		tracking = false;
		locked = false;
	}

	/** @param {TouchEvent} e */
	function onTouchStart(e) {
		if (disabled || revealed) return;
		const t = e.touches[0];
		startX = t.clientX;
		startY = t.clientY;
		tracking = true;
		locked = false;
		hasVibrated = false;
		suppressTap = false;
	}

	/** @param {TouchEvent} e */
	function onTouchMove(e) {
		if (!tracking) return;
		const t = e.touches[0];
		const dx = t.clientX - startX;
		const dy = t.clientY - startY;

		// Vertical intent wins: cancel the swipe so the page can scroll.
		if (!locked && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > HORIZONTAL_LOCK_PX) {
			reset();
			offset = 0;
			return;
		}
		if (!locked && Math.abs(dx) > HORIZONTAL_LOCK_PX) {
			locked = true;
			suppressTap = true;
		}
		if (!locked) return;

		// Only leftward swipes (negative offset) reveal the delete action.
		let next = dx < 0 ? dx : 0;
		if (next < -REVEAL) next = -REVEAL + (next + REVEAL) * ELASTIC;
		offset = next;

		if (Math.abs(offset) >= threshold && !hasVibrated) {
			hasVibrated = true;
			navigator.vibrate?.(10);
			onswipeleft?.();
		}
	}

	function onTouchEnd() {
		if (!tracking) return;
		const pastThreshold = Math.abs(offset) >= threshold;
		if (pastThreshold) {
			offset = -REVEAL;
			revealed = true;
		} else {
			offset = 0;
		}
		reset();
	}

	function onTouchCancel() {
		reset();
		if (!revealed) offset = 0;
	}

	function handleDelete() {
		suppressTap = true;
		ondelete?.();
	}

	// Capture-phase click guard: swallow the synthetic click that follows a
	// swipe so child controls (checkbox, title, action buttons) don't fire.
	/** @param {MouseEvent} e */
	function onContentClickCapture(e) {
		if (suppressTap) {
			e.preventDefault();
			e.stopPropagation();
			suppressTap = false;
			return;
		}
	}

	// Bubble-phase click: collapse the revealed state on a plain tap.
	function onContentClick() {
		if (revealed) {
			offset = 0;
			revealed = false;
		}
	}
</script>

<div class="swipe-row" class:swiping class:no-select={swiping} style="touch-action: pan-y">
	<div class="swipe-bg" aria-hidden="true">
		<!-- aria-hidden parent, pointer-only affordance (row-actions is the AT path) -->
		<button type="button" class="swipe-delete" tabindex="-1" onclick={handleDelete}>🗑 Delete</button>
	</div>
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="swipe-content"
		style="transform: translateX({offset}px)"
		onclickcapture={onContentClickCapture}
		onclick={onContentClick}
		ontouchstart={onTouchStart}
		ontouchmove={onTouchMove}
		ontouchend={onTouchEnd}
		ontouchcancel={onTouchCancel}
	>
		{@render children()}
	</div>
</div>

<style>
	.swipe-row {
		position: relative;
		border-radius: var(--radius);
	}
	.swipe-row.swiping {
		overflow: hidden;
	}
	.swipe-bg {
		position: absolute;
		inset: 0;
		display: flex;
		justify-content: flex-end;
		align-items: stretch;
		background: var(--vermilion);
		border: var(--border-thin);
		border-radius: var(--radius);
	}
	.swipe-delete {
		width: var(--s6);
		border: none;
		background: var(--vermilion);
		color: var(--linen);
		font-family: var(--gothic);
		font-weight: 700;
		font-size: 0.82rem;
		letter-spacing: 0.5px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--s1);
		flex-direction: column;
	}
	.swipe-delete:hover,
	.swipe-delete:active {
		background: var(--vermilion-2);
	}
	.swipe-content {
		position: relative;
		transition: transform 0.18s ease;
		touch-action: pan-y;
	}
	/* No transition while the finger is tracking — keeps the drag 1:1. */
	.swipe-row.swiping .swipe-content {
		transition: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.swipe-content {
			transition: none;
		}
	}
</style>
