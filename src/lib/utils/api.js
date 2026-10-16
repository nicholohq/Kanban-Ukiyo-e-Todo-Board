export async function fetchTasks() {
	const res = await fetch('/api/tasks');
	if (!res.ok) throw new Error('Failed to fetch tasks');
	return res.json();
}

export async function createTask(task) {
	const res = await fetch('/api/tasks', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(task)
	});
	if (!res.ok) throw new Error('Failed to create task');
	return res.json();
}

export async function updateTask(id, patch) {
	const res = await fetch(`/api/tasks/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(patch)
	});
	if (!res.ok) throw new Error('Failed to update task');
	return res.json();
}

export async function deleteTask(id) {
	const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
	if (!res.ok) throw new Error('Failed to delete task');
}

export async function reorderTasks(column, taskIds) {
	const res = await fetch('/api/tasks/reorder', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ column, taskIds })
	});
	if (!res.ok) throw new Error('Failed to reorder tasks');
}

export async function fetchNotes() {
	const res = await fetch('/api/notes');
	if (!res.ok) throw new Error('Failed to fetch notes');
	return res.json();
}

export async function createNote(note) {
	const res = await fetch('/api/notes', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(note)
	});
	if (!res.ok) throw new Error('Failed to create note');
	return res.json();
}

export async function updateNote(id, patch) {
	const res = await fetch(`/api/notes/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(patch)
	});
	if (!res.ok) throw new Error('Failed to update note');
	return res.json();
}

export async function deleteNote(id) {
	const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
	if (!res.ok) throw new Error('Failed to delete note');
}

export async function reorderNotes(noteIds) {
	const res = await fetch('/api/notes/reorder', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ noteIds })
	});
	if (!res.ok) throw new Error('Failed to reorder notes');
}
