<script>
	import {
		PRIORITIES,
		CATEGORIES,
		PRIORITY_META,
		CATEGORY_META
	} from '$lib/stores/todoStore.svelte.js';

	/**
	 * @type {{
	 *   initial?: Partial<import('$lib/stores/todoStore.svelte.js').Task>|null,
	 *   submitLabel?: string,
	 *   onsubmit?: (data: any) => void,
	 *   oncancel?: () => void,
	 *   ondelete?: () => void,
	 *   isDuplicate?: (title: string) => boolean
	 * }}
	 */
	let {
		initial = null,
		submitLabel = 'Save task',
		onsubmit,
		oncancel,
		ondelete,
		isDuplicate
	} = $props();

	let title = $state(initial?.title ?? '');
	let description = $state(initial?.description ?? '');
	let priority = $state(initial?.priority ?? 'medium');
	let category = $state(initial?.category ?? 'work');
	let dueDate = $state(initial?.dueDate ?? '');
	let status = $state(initial?.status ?? 'todo');
	/** @type {string[]} */
	let tags = $state([...(initial?.tags ?? [])]);
	let tagDraft = $state('');
	let error = $state('');
	/** @type {HTMLInputElement|null} */
	let titleEl = $state(null);

	function commitDraft() {
		const parts = tagDraft
			.split(',')
			.map((s) => s.trim().toLowerCase())
			.filter(Boolean);
		for (const p of parts) if (!tags.includes(p)) tags = [...tags, p];
		tagDraft = '';
	}

	/** @param {KeyboardEvent} e */
	function tagKeydown(e) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			commitDraft();
		} else if (e.key === 'Backspace' && tagDraft === '' && tags.length) {
			tags = tags.slice(0, -1);
		}
	}

	/** @param {string} t */
	function removeTag(t) {
		tags = tags.filter((x) => x !== t);
	}

	/** @param {SubmitEvent} e */
	function submit(e) {
		e.preventDefault();
		if (tagDraft.trim()) commitDraft();
		if (!title.trim()) {
			error = 'Please enter a title.';
			titleEl?.focus();
			return;
		}
		if (isDuplicate?.(title)) {
			error = 'A task with this title already exists.';
			titleEl?.focus();
			return;
		}
		error = '';
		onsubmit?.({
			title,
			description,
			priority,
			category,
			status,
			dueDate: dueDate || null,
			tags
		});
	}
</script>

<form class="task-form" onsubmit={submit} novalidate>
	<div class="field">
		<label for="tf-title">Title <span class="req" aria-hidden="true">*</span></label>
		<input
			id="tf-title"
			class="input"
			bind:this={titleEl}
			bind:value={title}
			placeholder="e.g. Sketch the wave pattern"
			aria-required="true"
			aria-invalid={error ? 'true' : undefined}
			maxlength="120"
		/>
		{#if error}<p class="error" role="alert">{error}</p>{/if}
	</div>

	<div class="field">
		<label for="tf-desc">Description</label>
		<textarea
			id="tf-desc"
			class="textarea"
			bind:value={description}
			placeholder="Optional details…"
			maxlength="600"
		></textarea>
	</div>

	<div class="grid-3">
		<div class="field">
			<label for="tf-priority">Priority</label>
			<select id="tf-priority" class="select" bind:value={priority}>
				{#each PRIORITIES as p}
					<option value={p}>{PRIORITY_META[p].label}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="tf-category">Category</label>
			<select id="tf-category" class="select" bind:value={category}>
				{#each CATEGORIES as c}
					<option value={c}>{CATEGORY_META[c].label}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="tf-due">Due date</label>
			<input id="tf-due" class="input" type="date" bind:value={dueDate} />
		</div>
	</div>

	<div class="field">
		<label for="tf-tags">Tags</label>
		<div class="tag-input">
			{#each tags as t (t)}
				<span class="chip">
					{t}
					<button type="button" class="chip-x" onclick={() => removeTag(t)} aria-label="Remove tag {t}"
						>×</button
					>
				</span>
			{/each}
			<input
				id="tf-tags"
				class="tag-entry"
				bind:value={tagDraft}
				onkeydown={tagKeydown}
				onblur={commitDraft}
				placeholder={tags.length ? '' : 'Type a tag, press Enter'}
			/>
		</div>
	</div>

	<div class="form-actions">
		{#if ondelete}
			<button type="button" class="btn btn--ghost danger" onclick={ondelete}>
				<span aria-hidden="true">🗑</span> Delete
			</button>
		{/if}
		<div class="fa-right">
			{#if oncancel}
				<button type="button" class="btn btn--ghost" onclick={oncancel}>Cancel</button>
			{/if}
			<button type="submit" class="btn btn--primary">{submitLabel}</button>
		</div>
	</div>
</form>

<style>
	.task-form {
		display: flex;
		flex-direction: column;
		gap: var(--s3);
	}
	.req {
		color: var(--vermilion);
	}
	.error {
		color: var(--vermilion);
		font-size: 0.8rem;
		font-weight: 700;
		margin-top: 2px;
	}
	.grid-3 {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--s3);
	}
	.tag-input {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s1);
		padding: var(--s1) var(--s2);
		background: var(--paper);
		border: var(--border-thin);
		border-radius: var(--radius);
		min-height: 44px;
	}
	.chip-x {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		color: var(--indigo);
		padding: 0;
	}
	.chip-x:hover {
		color: var(--vermilion);
	}
	.tag-entry {
		flex: 1;
		min-width: 120px;
		border: none;
		outline: none;
		background: transparent;
		font-family: var(--gothic);
		font-size: 0.9rem;
		padding: var(--s1);
	}
	.form-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--s2);
		margin-top: var(--s2);
	}
	.fa-right {
		display: flex;
		gap: var(--s2);
		margin-left: auto;
	}
	.danger {
		color: var(--vermilion);
	}
	.danger:hover {
		background: var(--vermilion);
		color: var(--linen);
	}

	@media (max-width: 520px) {
		.grid-3 {
			grid-template-columns: 1fr;
		}
		/* Stack the action buttons full-width so nothing overflows the modal. */
		.form-actions {
			flex-direction: column-reverse;
			align-items: stretch;
		}
		.fa-right {
			flex-direction: column-reverse;
			margin-left: 0;
			gap: var(--s2);
		}
		.form-actions .btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>
