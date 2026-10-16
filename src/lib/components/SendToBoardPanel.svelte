<script>
	import { STATUSES, STATUS_META } from '$lib/stores/todoStore.svelte.js';
	import { notesStore } from '$lib/stores/notesStore.svelte.js';
	import { cardTitleError } from '$lib/utils/notes.js';

	/**
	 * The docked "Send to board" panel. This is deliberately **not** a modal:
	 * the note's textarea stays mounted and selectable above it, and
	 * `getSelection` reads whatever the user has highlighted there — being able
	 * to make a second highlight while the panel is open is the point.
	 *
	 * The parent mounts this component only while the panel is open.
	 *
	 * @type {{
	 *   open: boolean,
	 *   seed: string,
	 *   getSelection: () => string,
	 *   isDuplicate: (title: string) => boolean,
	 *   onsubmit: (data: { title: string, description: string, status: import('$lib/stores/todoStore.svelte.js').Status }) => boolean,
	 *   onclose: () => void
	 * }}
	 */
	let { open, seed, getSelection, isDuplicate, onsubmit, onclose } = $props();

	let step = $state(1);
	let title = $state('');
	let description = $state('');
	let status = $state('todo');
	let error = $state('');

	/** @type {HTMLInputElement|null} */
	let titleEl = $state(null);

	/**
	 * The name of the note being sent. It rides along as the card's tag, shown
	 * here so the user knows what is attached. The panel reads it from the
	 * store rather than the parent passing it — `notesStore` is the source of
	 * truth and adding a prop would duplicate it.
	 */
	let noteTitle = $derived(notesStore.activeNote?.title ?? '');

	// Seed the fields once, when the panel opens: the highlight captured at the
	// Send press becomes the title, and everything else starts clean. Reading
	// the prop here (rather than in a `$state` initialiser) keeps the seed
	// reactive without capturing a stale value.
	$effect(() => {
		if (!open) return;
		title = String(seed ?? '');
		description = '';
		status = 'todo';
		error = '';
		step = 1;
	});

	// On open, and whenever step 1 is (re)shown (Back, or a rejected Send), put
	// focus on the title input. A failed *validation* does not change `step`, so
	// `next` focuses explicitly below.
	$effect(() => {
		if (open && step === 1) titleEl?.focus();
	});

	function useTitleSelection() {
		title = getSelection().trim();
	}

	function useDescriptionSelection() {
		description = getSelection().trim();
	}

	function next() {
		const err = cardTitleError(title, isDuplicate(title.trim()));
		if (err) {
			error = err;
			titleEl?.focus();
			return;
		}
		error = '';
		step = 2;
	}

	function back() {
		step = 1;
	}

	function send() {
		const ok = onsubmit({ title: title.trim(), description, status });
		if (ok) return; // the parent has closed the panel
		// The store could not create the card — a duplicate title is the only
		// way that happens once validation has passed.
		error = 'A task with this title already exists.';
		step = 1;
	}

	/**
	 * Scoped to the panel's own subtree, never the window: the note tab strip
	 * has its own Escape (abandon a rename), and a global listener would fire
	 * both from one keypress. Focus starts inside the panel, so the event
	 * bubbles here.
	 * @param {KeyboardEvent} e
	 */
	function onKeydown(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			onclose?.();
		}
	}
</script>

<!-- Escape is deliberately scoped to the panel subtree, never the window: the
     note tab strip has its own Escape (abandon a rename), and a global listener
     would fire both from one keypress. The brief fixes this root's role at
     `group`, which the rule reads as non-interactive. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="send-panel" role="group" aria-label="Send to board" onkeydown={onKeydown}>
	<p class="step" aria-live="polite">
		{step === 1 ? '1 of 2 · Title' : '2 of 2 · Description'}
	</p>
	<p class="question">
		{step === 1 ? 'What should this card be called?' : 'Anything to keep with it?'}
	</p>

	{#if step === 1}
		<div class="field">
			<label class="visually-hidden" for="sb-title">Card title</label>
			<input
				id="sb-title"
				class="input"
				bind:this={titleEl}
				bind:value={title}
				placeholder="Card title"
				maxlength="120"
			/>
			<button type="button" class="btn btn--sm use-selection" onclick={useTitleSelection}>
				<span aria-hidden="true">⌖</span> Use selection
			</button>
		</div>
	{:else}
		<div class="field">
			<label class="visually-hidden" for="sb-desc">Card description</label>
			<textarea
				id="sb-desc"
				class="textarea"
				bind:value={description}
				placeholder="Optional details…"
				maxlength="600"
			></textarea>
			<button type="button" class="btn btn--sm use-selection" onclick={useDescriptionSelection}>
				<span aria-hidden="true">⌖</span> Use selection
			</button>
		</div>

		<div class="row">
			<div class="field status-field">
				<label for="sb-status">Column</label>
				<select id="sb-status" class="select" bind:value={status}>
					{#each STATUSES as s}
						<option value={s}>{STATUS_META[s].kanji} {STATUS_META[s].label}</option>
					{/each}
				</select>
			</div>
			{#if noteTitle}
				<p class="tag-line">Tagged <span class="chip">{noteTitle}</span></p>
			{/if}
		</div>
	{/if}

	{#if error}<p class="error" role="alert">{error}</p>{/if}

	<div class="actions">
		{#if step === 2}
			<button type="button" class="btn btn--ghost" onclick={back}>Back</button>
		{/if}
		<div class="actions-right">
			<button type="button" class="btn btn--ghost" onclick={() => onclose?.()}>Cancel</button>
			{#if step === 1}
				<button type="button" class="btn btn--primary" onclick={next}>Next</button>
			{:else}
				<button type="button" class="btn btn--primary" onclick={send}>Send to board</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.send-panel {
		display: flex;
		flex-direction: column;
		gap: var(--s2);
		margin-top: var(--s3);
		padding: var(--s3);
		background: var(--linen);
		border: var(--border);
		border-radius: var(--radius);
	}
	.step {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: var(--indigo);
	}
	.question {
		font-family: var(--serif);
		font-size: 1rem;
	}
	.use-selection {
		align-self: flex-start;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--s3);
	}
	.status-field {
		min-width: 180px;
	}
	.tag-line {
		display: flex;
		align-items: center;
		gap: var(--s1);
		font-size: 0.8rem;
		min-height: 36px;
	}
	.error {
		color: var(--vermilion);
		font-size: 0.8rem;
		font-weight: 700;
		margin-top: 2px;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: var(--s2);
	}
	.actions-right {
		display: flex;
		gap: var(--s2);
		margin-left: auto;
	}

	@media (max-width: 520px) {
		/* Stack the actions full-width so nothing overflows a narrow dock. */
		.actions {
			flex-direction: column-reverse;
			align-items: stretch;
		}
		.actions-right {
			flex-direction: column-reverse;
			margin-left: 0;
			gap: var(--s2);
		}
		.actions .btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>
