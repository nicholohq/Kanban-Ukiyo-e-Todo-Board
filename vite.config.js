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
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'service-worker.js',
			kit: {
				includeVersionFile: true
			},
			injectManifest: {
				globPatterns: [
					'client/**/*.{js,css,ico,png,svg,webp,webmanifest,woff,woff2}'
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
