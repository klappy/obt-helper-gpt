import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 9173,
    host: true,
  },
  preview: {
    port: 9174,
  },
});
