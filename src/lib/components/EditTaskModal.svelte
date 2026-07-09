<script>
	import Modal from './Modal.svelte';
	import TaskForm from './TaskForm.svelte';
	import { todoStore } from '$lib/stores/todoStore.svelte.js';

	/**
	 * @type {{
	 *   task?: import('$lib/stores/todoStore.svelte.js').Task|null,
	 *   onclose?: () => void,
	 *   onrequestdelete?: (task: import('$lib/stores/todoStore.svelte.js').Task) => void
	 * }}
	 */
	let { task = null, onclose, onrequestdelete } = $props();

	/** @param {any} data */
	function handleSubmit(data) {
		if (task) todoStore.updateTask(task.id, data);
		onclose?.();
	}
</script>

<Modal open={!!task} {onclose} title="仕事を編集 · Edit Task">
	{#if task}
		<TaskForm
			initial={task}
			submitLabel="Save changes"
			onsubmit={handleSubmit}
			oncancel={onclose}
			ondelete={() => onrequestdelete?.(task)}
			isDuplicate={(t) => todoStore.hasDuplicateTitle(t, task.id)}
		/>
	{/if}
</Modal>
