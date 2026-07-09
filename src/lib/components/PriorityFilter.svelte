<script>
	import { todoStore, PRIORITIES, PRIORITY_META } from '$lib/stores/todoStore.svelte.js';
</script>

<fieldset class="filter">
	<legend>Priority</legend>
	{#each PRIORITIES as p (p)}
		<label class="opt">
			<input
				type="checkbox"
				checked={todoStore.filters.priorities.includes(p)}
				onchange={() => todoStore.toggleFilter('priorities', p)}
			/>
			<span class="dot" style="background:{PRIORITY_META[p].tone}"></span>
			<span class="opt-label">{PRIORITY_META[p].label}</span>
			<span class="opt-count">{todoStore.priorityCounts[p] ?? 0}</span>
		</label>
	{/each}
</fieldset>

<style>
	.filter {
		border: none;
		display: flex;
		flex-direction: column;
		gap: var(--s1);
	}
	legend {
		font-family: var(--serif);
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--indigo);
		margin-bottom: var(--s1);
	}
	.opt {
		display: flex;
		align-items: center;
		gap: var(--s2);
		font-size: 0.88rem;
		cursor: pointer;
		padding: 2px 0;
	}
	.opt input {
		width: 18px;
		height: 18px;
		accent-color: var(--vermilion);
		cursor: pointer;
	}
	.opt-label {
		flex: 1;
	}
	.opt-count {
		font-size: 0.75rem;
		font-weight: 700;
		color: #7a756c;
	}
</style>
