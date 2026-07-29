<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { pwa } from '$lib/stores/pwa.svelte.js';
	import Toast from '$lib/components/Toast.svelte';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';
	import UpdateToast from '$lib/components/UpdateToast.svelte';

	let { children } = $props();

	onMount(() => {
		auth.check();
		pwa.init();
	});
</script>

{@render children()}

<Toast />
<InstallPrompt />
<UpdateToast />
