<script>
	import { auth } from '$lib/stores/auth.svelte.js';
	import { todoStore } from '$lib/stores/todoStore.svelte.js';
	import { notesStore } from '$lib/stores/notesStore.svelte.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let mode = $state('login');
	let username = $state('');
	let password = $state('');
	let error = $state('');
	let submitting = $state(false);

	onMount(() => {
		if (auth.user) {
			goto('/');
		}
	});

	async function submit(e) {
		e.preventDefault();
		error = '';
		submitting = true;
		try {
			if (mode === 'login') {
				await auth.login(username, password);
			} else {
				await auth.signup(username, password);
			}
			// Notes first: the writer arms at the end of todoStore.init() and its
			// guarded effect snapshots notesStore.notes at that moment, so the notes
			// must already be in memory. Nothing in notesStore.init() needs todoStore.
			await notesStore.init();
			await todoStore.init();
			goto('/');
		} catch (err) {
			error = err.message;
		} finally {
			submitting = false;
		}
	}

	function toggleMode() {
		mode = mode === 'login' ? 'signup' : 'login';
		error = '';
	}
</script>

<svelte:head>
	<title>{mode === 'login' ? 'Login' : 'Sign Up'} — Ukiyo Kanban</title>
</svelte:head>

<div class="page">
	<div class="card panel">
		<div class="header">
			<h1 class="title">浮世 Kanban</h1>
			<p class="subtitle">{mode === 'login' ? 'Welcome back' : 'Create your board'}</p>
		</div>

		<form onsubmit={submit}>
			<div class="field">
				<label for="username">Username</label>
				<input
					id="username"
					type="text"
					class="input"
					bind:value={username}
					required
					autocomplete="username"
					autofocus
				/>
			</div>

			<div class="field">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					class="input"
					bind:value={password}
					required
					minlength={6}
					autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
				/>
			</div>

			{#if error}
				<p class="error" role="alert">{error}</p>
			{/if}

			<button type="submit" class="btn btn--primary" disabled={submitting}>
				{mode === 'login' ? 'Enter' : 'Create Account'}
			</button>
		</form>

		<p class="toggle">
			{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
			<button class="btn--ghost link" onclick={toggleMode}>
				{mode === 'login' ? 'Sign up' : 'Log in'}
			</button>
		</p>
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: var(--s4);
	}

	.card {
		width: 100%;
		max-width: 380px;
		padding: var(--s6) var(--s5);
		display: flex;
		flex-direction: column;
		gap: var(--s4);
	}

	.header {
		text-align: center;
	}

	.title {
		font-size: 1.6rem;
		margin-bottom: var(--s1);
	}

	.subtitle {
		font-size: 0.9rem;
		color: var(--indigo);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--s3);
	}

	.error {
		font-size: 0.85rem;
		color: var(--vermilion);
		font-weight: 700;
	}

	.toggle {
		text-align: center;
		font-size: 0.85rem;
		color: var(--indigo);
	}

	.link {
		font-size: 0.85rem;
		color: var(--vermilion);
		font-weight: 700;
		text-decoration: underline;
		cursor: pointer;
		padding: 0;
		border: none;
		background: none;
	}

	.link:hover {
		color: var(--vermilion-2);
	}
</style>
