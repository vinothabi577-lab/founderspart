import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    // Only load the dev component tagger in development
    mode === "development" &&
      (() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { default: tagger } = require("@dyad-sh/react-vite-component-tagger");
          return tagger();
        } catch {
          return null;
        }
      })(),
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {},
  },
}));
