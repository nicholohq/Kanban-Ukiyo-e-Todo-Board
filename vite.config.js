import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	define: {
		'process.env.NODE_ENV':
			process.env.NODE_ENV === 'production' ? '"production"' : '"development"'
	},
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			strategies: 'generateSW',
			kit: {
				includeVersionFile: true
			},
			workbox: {
				clientsClaim: true,
				skipWaiting: true,
				cleanupOutdatedCaches: true,
				navigateFallback: '/',
				runtimeCaching: [
					{
						urlPattern: ({ url }) =>
							url.pathname.startsWith('/api/') && url.pathname !== '/api/auth/login',
						handler: 'NetworkFirst',
						options: {
							networkTimeoutSeconds: 3,
							cacheName: 'ukiyo-api-v1',
							cacheableResponse: { statuses: [0, 200] },
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 24 * 60 * 60,
								purgeOnQuotaError: true
							}
						}
					},
					{
						urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'ukiyo-google-fonts-css-v1',
							cacheableResponse: { statuses: [0, 200] }
						}
					},
					{
						urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
						handler: 'CacheFirst',
						options: {
							cacheName: 'ukiyo-google-fonts-files-v1',
							cacheableResponse: { statuses: [0, 200] },
							expiration: {
								maxEntries: 30,
								maxAgeSeconds: 365 * 24 * 60 * 60,
								purgeOnQuotaError: true
							}
						}
					}
				]
			},
			devOptions: {
				enabled: true,
				type: 'module'
			},
			manifest: {
				name: 'Ukiyo Kanban',
				short_name: 'Ukiyo',
				description:
					'A Japanese woodblock-print styled kanban board with drag-and-drop and offline persistence.',
				theme_color: '#1a2a3a',
				background_color: '#1a2a3a',
				display: 'standalone',
				start_url: '/',
				scope: '/',
				orientation: 'portrait-primary',
				categories: ['productivity', 'utilities'],
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
					{
						src: '/icons/icon-maskable.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			}
		})
	]
});
