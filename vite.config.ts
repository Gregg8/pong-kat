import { defineConfig } from "vite";

// Relative base so the same build works on the web (GitHub Pages, served from
// a /pong-kat/ subpath) AND inside a Capacitor iOS WebView (file:///capacitor://).
export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    outDir: "dist",
  },
});
