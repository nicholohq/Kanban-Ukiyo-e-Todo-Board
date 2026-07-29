<script>
	import { todoStore } from '$lib/stores/todoStore.svelte.js';
</script>

<fieldset class="filter">
	<legend>Tags</legend>
	{#if todoStore.availableTags.length === 0}
		<p class="empty-hint">No tags yet.</p>
	{:else}
		<div class="tag-cloud">
			{#each todoStore.availableTags as tag (tag)}
				{@const active = todoStore.filters.tags.includes(tag)}
				<button
					type="button"
					class="tag"
					class:active
					aria-pressed={active}
					onclick={() => todoStore.toggleFilter('tags', tag)}
				>
					#{tag}
					<span class="tag-count">{todoStore.tagCounts[tag] ?? 0}</span>
				</button>
			{/each}
		</div>
	{/if}
</fieldset>

<style>
	.filter {
		border: none;
	}
	legend {
		font-family: var(--serif);
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--indigo);
		margin-bottom: var(--s2);
	}
	.tag-cloud {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s1);
	}
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-family: var(--gothic);
		font-size: 0.76rem;
		font-weight: 500;
		padding: 10px 12px;
		border-radius: 999px;
		border: 2px solid var(--indigo);
		background: var(--paper);
		color: var(--indigo);
		cursor: pointer;
		transition: background var(--ease), color var(--ease);
	}
	.tag:hover {
		background: var(--linen-2);
	}
	.tag.active {
		background: var(--vermilion);
		border-color: var(--vermilion);
		color: var(--linen);
	}
	.tag-count {
		font-size: 0.68rem;
		font-weight: 700;
		opacity: 0.8;
	}
	.empty-hint {
		font-size: 0.82rem;
		color: #8a857c;
	}
</style>
