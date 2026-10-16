<script>
	import { notesStore } from '$lib/stores/notesStore.svelte.js';

	/** Task 7 reads the selection from this element (selectionStart/End). */
	/** @type {HTMLTextAreaElement|null} */
	let textareaEl = $state(null);

	let syncText = $derived(
		notesStore.syncStatus === 'saving' || notesStore.syncStatus === 'loading'
			? 'Saving…'
			: notesStore.syncStatus === 'saved'
				? 'Saved'
				: ''
	);

	/** @param {Event & { currentTarget: HTMLTextAreaElement }} e */
	function onInput(e) {
		const note = notesStore.activeNote;
		if (!note) return;
		// No local mirror: the value lives in the store, so a tab switch inside
		// the debounce window can never lag behind the textarea.
		notesStore.updateBody(note.id, e.currentTarget.value);
	}
</script>

<section class="notepad">
	{#if notesStore.count === 0}
		<div class="empty">
			<p class="empty-line">Start a note for a subject you're studying</p>
			<button class="btn btn--primary" onclick={() => notesStore.createNote()}>New note</button>
		</div>
	{:else}
		<label class="visually-hidden" for="note-body">Note text</label>
		<textarea
			id="note-body"
			bind:this={textareaEl}
			class="textarea"
			placeholder="Start writing…"
			value={notesStore.activeNote?.body ?? ''}
			oninput={onInput}
		></textarea>
		<div class="tools">
			<!-- Tasks 6 and 7 add the tab menu and the Send-to-board button here. -->
			<p class="sync" aria-live="polite">{syncText}</p>
		</div>
	{/if}
</section>

<style>
	.notepad {
		background: var(--paper);
		border: var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: var(--s3);
		min-height: 60vh;
		display: flex;
		flex-direction: column;
	}
	.textarea {
		flex: 1;
		min-height: 320px;
		line-height: 1.8;
		font-size: 1rem;
		resize: vertical;
	}
	.tools {
		display: flex;
		align-items: center;
		gap: var(--s3);
		margin-top: var(--s3);
		min-height: 36px;
	}
	.sync {
		margin-left: auto;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.4px;
		color: var(--indigo);
		opacity: 0.8;
		min-height: 1em;
	}
	.empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--s3);
		text-align: center;
		padding: var(--s6) var(--s4);
	}
	.empty-line {
		font-family: var(--serif);
		font-size: 1.05rem;
		opacity: 0.8;
	}
</style>
