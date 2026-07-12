<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { todoStore } from '$lib/stores/todoStore.svelte.js';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import AddTaskForm from '$lib/components/AddTaskForm.svelte';
	import EditTaskModal from '$lib/components/EditTaskModal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import KanbanBoard from '$lib/components/KanbanBoard.svelte';

	let ready = $state(false);
	let showAdd = $state(false);
	let sidebarOpen = $state(false);
	/** @type {import('$lib/stores/todoStore.svelte.js').Task|null} */
	let editing = $state(null);
	/** @type {import('$lib/stores/todoStore.svelte.js').Task|null} */
	let pendingDelete = $state(null);

	/** @param {import('$lib/stores/todoStore.svelte.js').Task} task */
	function requestDelete(task) {
		pendingDelete = task;
	}

	function confirmDelete() {
		if (pendingDelete) {
			const id = pendingDelete.id;
			todoStore.deleteTask(id);
			if (editing && editing.id === id) editing = null;
		}
		pendingDelete = null;
	}

	onMount(async () => {
		if (!auth.user) {
			goto('/login');
			return;
		}
		await todoStore.init();
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const t = setTimeout(() => (ready = true), reduce ? 0 : 450);
		return () => clearTimeout(t);
	});

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		if (e.key === 'Escape' && sidebarOpen) sidebarOpen = false;
	}
</script>

<svelte:head>
	<title>Kanban — Ukiyo Kanban</title>
</svelte:head>

<svelte:window onkeydown={onKeydown} />

{#if auth.loading || !ready}
	<Loader />
{:else if auth.user}
	<div class="app">
		<Header onnew={() => (showAdd = true)} ontogglesidebar={() => (sidebarOpen = !sidebarOpen)} />

		<div class="body">
			<Sidebar open={sidebarOpen} onclose={() => (sidebarOpen = false)} />

			<main class="content">
				{#if todoStore.view === 'board'}
					<KanbanBoard onedit={(t) => (editing = t)} onnew={() => (showAdd = true)} />
				{:else}
					<TaskList
						onedit={(t) => (editing = t)}
						ondelete={requestDelete}
						onnew={() => (showAdd = true)}
					/>
				{/if}
			</main>
		</div>
	</div>

	<AddTaskForm bind:open={showAdd} />
	<EditTaskModal task={editing} onclose={() => (editing = null)} onrequestdelete={requestDelete} />
	<ConfirmDialog
		open={!!pendingDelete}
		title="Delete task?"
		message={pendingDelete ? `Delete “${pendingDelete.title}”? This can’t be undone.` : ''}
		confirmLabel="Delete"
		onconfirm={confirmDelete}
		oncancel={() => (pendingDelete = null)}
	/>
	<Toast />
{/if}

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	.body {
		flex: 1;
		width: 100%;
		max-width: 1240px;
		margin: 0 auto;
		padding: var(--s4);
		display: grid;
		grid-template-columns: 250px 1fr;
		gap: var(--s4);
		align-items: start;
	}
	.content {
		min-width: 0;
	}

	@media (max-width: 768px) {
		.body {
			grid-template-columns: 1fr;
			padding: var(--s3);
			gap: var(--s3);
		}
	}
	@media (max-width: 520px) {
		.body {
			padding: var(--s2);
		}
	}
</style>
