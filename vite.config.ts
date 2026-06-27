import { defineConfig } from "vite";

// Relative base so the same build works on the web AND inside a Capacitor
// iOS WebView (which loads from a file:// or capacitor:// origin).
export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    outDir: "dist",
  },
});
