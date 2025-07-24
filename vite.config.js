import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
	plugins: [
		wasm(),
		topLevelAwait(),
		sveltekit()
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['./src/lib/test-setup.ts']
	},
	// Handle tiktoken WASM loading
	optimizeDeps: {
		exclude: ['tiktoken']
	},
	// Prevent WASM issues in build
	define: {
		global: 'globalThis'
	}
}); 