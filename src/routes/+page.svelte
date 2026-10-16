<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { todoStore } from '$lib/stores/todoStore.svelte.js';
	import { notesStore } from '$lib/stores/notesStore.svelte.js';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import AddTaskForm from '$lib/components/AddTaskForm.svelte';
	import EditTaskModal from '$lib/components/EditTaskModal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import KanbanBoard from '$lib/components/KanbanBoard.svelte';
	import NotepadView from '$lib/components/NotepadView.svelte';
	import FAB from '$lib/components/FAB.svelte';
	import ContextMenu from '$lib/components/ContextMenu.svelte';
	import UndoToast from '$lib/components/UndoToast.svelte';
	import ChangePasswordModal from '$lib/components/ChangePasswordModal.svelte';

	let ready = $state(false);
	let showAdd = $state(false);
	let sidebarOpen = $state(false);
	let changePasswordOpen = $state(false);
	/** @type {import('$lib/stores/todoStore.svelte.js').Task|null} */
	let editing = $state(null);
	/** @type {import('$lib/stores/todoStore.svelte.js').Task|null} */
	let pendingDelete = $state(null);
	/** @type {{ task: import('$lib/stores/todoStore.svelte.js').Task, x: number, y: number }|null} */
	let contextMenu = $state(null);
	/** @type {{ message: string }|null} */
	let undoToast = $state(null);

	/** @param {import('$lib/stores/todoStore.svelte.js').Task} task */
	function requestDelete(task) {
		pendingDelete = task;
	}

	function confirmDelete() {
		if (pendingDelete) {
			const id = pendingDelete.id;
			todoStore.pushUndo('Delete task');
			todoStore.deleteTask(id);
			if (editing && editing.id === id) editing = null;
			undoToast = { message: `Deleted "${pendingDelete.title}"` };
		}
		pendingDelete = null;
	}

	/** @param {import('$lib/stores/todoStore.svelte.js').Task} task
	 *  @param {number} x
	 *  @param {number} y */
	function openContextMenu(task, x, y) {
		if (editing || pendingDelete) return;
		contextMenu = { task, x, y };
	}

	function closeContextMenu() {
		contextMenu = null;
	}

	/** @param {string} action @param {import('$lib/stores/todoStore.svelte.js').Task} task */
	function handleContextAction(action, task) {
		switch (action) {
			case 'edit':
				editing = task;
				break;
			case 'delete':
				pendingDelete = task;
				break;
			case 'duplicate':
				todoStore.addTask({
					title: `${task.title} (copy)`,
					description: task.description,
					priority: task.priority,
					category: task.category,
					dueDate: task.dueDate,
					tags: [...task.tags]
				});
				break;
			case 'toggle-done':
				todoStore.toggleDone(task.id);
				break;
		}
	}

	function handleUndo() {
		undoToast = null;
		todoStore.undo();
	}

	onMount(async () => {
		if (!auth.user) {
			goto('/login');
			return;
		}
		// Notes first: the writer arms at the end of todoStore.init() and its
		// guarded effect snapshots notesStore.notes at that moment, so the notes
		// must already be in memory. Nothing in notesStore.init() needs todoStore.
		await notesStore.init();
		await todoStore.init();
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const t = setTimeout(() => (ready = true), reduce ? 0 : 450);
		return () => clearTimeout(t);
	});

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		if (e.key === 'Escape' && sidebarOpen) sidebarOpen = false;
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
			// Don't hijack undo inside text fields.
			const t = /** @type {HTMLElement|null} */ (e.target);
			const inField = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
			if (inField) return;
			e.preventDefault();
			todoStore.undo();
		}
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
		<Header
				onnew={() => (showAdd = true)}
				ontogglesidebar={() => (sidebarOpen = !sidebarOpen)}
				onchangepassword={() => (changePasswordOpen = true)}
			/>

		<div class="body">
			<Sidebar open={sidebarOpen} onclose={() => (sidebarOpen = false)} />

			<main class="content">
				{#if todoStore.view === 'board'}
					<KanbanBoard
						onedit={(t) => (editing = t)}
						onnew={() => (showAdd = true)}
						oncontextmenu={openContextMenu}
					/>
				{:else if todoStore.view === 'list'}
					<TaskList
						onedit={(t) => (editing = t)}
						ondelete={requestDelete}
						onnew={() => (showAdd = true)}
						oncontextmenu={openContextMenu}
					/>
				{:else}
					<NotepadView />
				{/if}
			</main>
		</div>
	</div>

	<AddTaskForm bind:open={showAdd} />
	<EditTaskModal task={editing} onclose={() => (editing = null)} onrequestdelete={requestDelete} />
	<ChangePasswordModal
		bind:open={changePasswordOpen}
		onclose={() => (changePasswordOpen = false)}
	/>
	<ConfirmDialog
		open={!!pendingDelete}
		title="Delete task?"
		message={pendingDelete ? `Delete "${pendingDelete.title}"?` : ''}
		confirmLabel="Delete"
		onconfirm={confirmDelete}
		oncancel={() => (pendingDelete = null)}
	/>
	<ContextMenu
		open={!!contextMenu}
		x={contextMenu?.x ?? 0}
		y={contextMenu?.y ?? 0}
		task={contextMenu?.task ?? null}
		onaction={handleContextAction}
		onclose={closeContextMenu}
	/>
	<UndoToast
		open={!!undoToast}
		message={undoToast?.message ?? ''}
		onundo={handleUndo}
		onclose={() => (undoToast = null)}
	/>
	<FAB onclick={() => (showAdd = true)} />
{/if}

<style>
	.app {
		min-height: 100vh;
		min-height: 100dvh;
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

	@media (max-width: 1024px) {
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
