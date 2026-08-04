<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { pwa } from '$lib/stores/pwa.svelte.js';
	import Toast from '$lib/components/Toast.svelte';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';
	import UpdateToast from '$lib/components/UpdateToast.svelte';

	let { children } = $props();

	onMount(async () => {
		auth.check();
		if ('serviceWorker' in navigator) {
			try {
				await navigator.serviceWorker.register('./sw.js');
			} catch {}
		}
		pwa.init();
	});
</script>

<svelte:head>
	{@html pwaInfo?.webManifest?.linkTag ?? ''}
</svelte:head>

{@render children()}

<Toast />
<InstallPrompt />
<UpdateToast />
