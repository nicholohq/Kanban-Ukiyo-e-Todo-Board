<script>
	import Modal from './Modal.svelte';
	import TaskForm from './TaskForm.svelte';
	import { todoStore } from '$lib/stores/todoStore.svelte.js';

	let { open = $bindable(false) } = $props();

	/** @param {any} data */
	function handleSubmit(data) {
		todoStore.addTask(data);
		open = false;
	}
</script>

<Modal bind:open title="新しい仕事 · New Task">
	<TaskForm
		submitLabel="Add task"
		onsubmit={handleSubmit}
		oncancel={() => (open = false)}
		isDuplicate={(t) => todoStore.hasDuplicateTitle(t)}
	/>
</Modal>
