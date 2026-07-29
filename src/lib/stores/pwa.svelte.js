import { browser } from '$app/environment';

function createPwaStore() {
	let deferredPrompt = $state(null);
	let isInstalled = $state(false);
	let updatePending = $state(false);
	let isIdle = $state(true);
	let registration = $state(null);

	let idleTimer = null;

	function startIdleDetection() {
		if (!browser) return;
		const resetIdle = () => {
			isIdle = false;
			if (idleTimer) clearTimeout(idleTimer);
			idleTimer = setTimeout(() => {
				isIdle = true;
				checkUpdateActivation();
			}, 2000);
		};

		document.addEventListener('pointerdown', resetIdle);
		document.addEventListener('pointerup', resetIdle);
		document.addEventListener('focusin', resetIdle);
		document.addEventListener('dragstart', () => { isIdle = false; });
		document.addEventListener('dragend', () => { setTimeout(() => { isIdle = true; checkUpdateActivation(); }, 500); });
	}

	function checkUpdateActivation() {
		if (updatePending && isIdle) {
			window.location.reload();
		}
	}

	function init() {
		if (!browser) return;

		if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
			isInstalled = true;
		}

		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
		});

		window.addEventListener('appinstalled', () => {
			isInstalled = true;
			deferredPrompt = null;
		});

		startIdleDetection();
		startSwUpdateDetection();
	}

	async function startSwUpdateDetection() {
		if (!browser) return;
		try {
			const reg = await navigator.serviceWorker.getRegistration();
			if (reg) {
				registration = reg;
				reg.addEventListener('updatefound', () => {
					const newWorker = reg.installing;
					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
							updatePending = true;
							checkUpdateActivation();
						}
					});
				});
			}
		} catch {
			// SW unavailable
		}
	}

	async function install() {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		const result = await deferredPrompt.userChoice;
		deferredPrompt = null;
		return result.outcome;
	}

	return {
		get deferredPrompt() { return deferredPrompt; },
		get isInstallable() { return deferredPrompt !== null; },
		get isInstalled() { return isInstalled; },
		get updatePending() { return updatePending; },
		get isIdle() { return isIdle; },
		init,
		install
	};
}

export const pwa = createPwaStore();
