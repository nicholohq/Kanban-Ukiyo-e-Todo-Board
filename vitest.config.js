import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Storage-layer unit tests run in a plain Node environment with polyfilled
// browser globals (see tests/setup.js). We deliberately do NOT load the
// SvelteKit or PWA Vite plugins here — the storage layer is framework-agnostic
// and only needs the `$lib` alias resolved.
export default defineConfig({
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	},
	test: {
		environment: 'node',
		include: ['tests/**/*.test.js'],
		setupFiles: ['./tests/setup.js']
	}
});
