<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte.js';

	let { children } = $props();

	onMount(() => {
		auth.check();
	});
</script>

{@render children()}
