import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { securityHeadersPlugin } from "./scripts/generate-security-headers.mjs";

export default defineConfig({
  plugins: [react(), securityHeadersPlugin()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "^/api(?:/|\\?|$)": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => {
          const stripped = path.replace(/^\/api(?=\/|\?|$)/, "");
          return stripped.startsWith("?") ? `/${stripped}` : stripped || "/";
        },
      },
      "^/health(?:/|\\?|$)": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "^/auth(?:/|\\?|$)": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "^/webhooks(?:/|\\?|$)": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
  build: {
    manifest: true,
    target: ["chrome111", "edge111", "firefox114", "safari16.4", "ios16.4"],
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
      },
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, "/");
          if (!normalized.includes("/node_modules/")) return undefined;
          if (
            normalized.includes("/react/") ||
            normalized.includes("/react-dom/") ||
            normalized.includes("/scheduler/")
          ) {
            return "vendor-react";
          }
          return "vendor";
        },
      },
    },
  },
});
