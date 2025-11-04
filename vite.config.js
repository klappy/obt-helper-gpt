import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [sveltekit(), wasm()],
  server: {
    port: 9173,
    host: true,
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      }
    }
  },
  preview: {
    port: 9174,
  },
  optimizeDeps: {
    exclude: ["tiktoken"], // Exclude tiktoken from optimization to handle WASM properly
  },
  build: {
    target: "esnext", // Required for WASM support
  },
});
