import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Detect `vite dev` so we don't apply the production base path locally.
const dev = process.argv.includes('dev');

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Static output for GitHub Pages. `fallback` makes it a single-page
			// app so client-side routing + localStorage work without a server.
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',
				precompress: false,
				strict: true
			}),
			// When deploying under a repo subpath (e.g. /japanese-kanban-todo),
			// set BASE_PATH at build time. Empty locally and for root sites.
			paths: {
				base: dev ? '' : process.env.BASE_PATH || ''
			}
		})
	]
});
