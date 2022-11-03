import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
      polyfills: true,
      renderLegacyChunks: true,
    }),
  ],
  preview: {
    open: true,
  },
  server: {
    open: true,
  },
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  assetsInclude: ["**/*.glb", "**/*.wasm"],
});
