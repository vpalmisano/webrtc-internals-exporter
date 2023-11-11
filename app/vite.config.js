import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import loadVersion from "vite-plugin-package-version";

export default defineConfig({
  plugins: [loadVersion(), vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "../build",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        options: "options.html",
        popup: "popup.html",
      },
      output: {
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  define: {},
});
