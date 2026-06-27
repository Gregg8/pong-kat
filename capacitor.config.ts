import type { CapacitorConfig } from "@capacitor/cli";

// Wraps the built web game (dist/) as a native iOS app. The same Vite build
// that runs on the web is served inside the iOS WebView — no separate codebase.
const config: CapacitorConfig = {
  appId: "com.gregg.pongkat",
  appName: "Pong",
  webDir: "dist",
  // Pure black background behind the WebView so letterbox bars stay black and
  // there's no white flash on launch.
  backgroundColor: "#000000",
  ios: {
    backgroundColor: "#000000",
    // Let the canvas use the full screen incl. under the notch/home indicator.
    contentInset: "never",
  },
};

export default config;
