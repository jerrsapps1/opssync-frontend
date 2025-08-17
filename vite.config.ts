import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ mode }) => {
  const plugins = [react(), runtimeErrorOverlay()];

  // Enable Replit cartographer only in dev on Replit
  if (mode !== "production" && process.env.REPL_ID) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  }

  return {
    // Your app source lives in /client
    root: path.resolve(import.meta.dirname, "client"),

    plugins,

    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },

    build: {
      // ✅ Put final build at repo-root /dist so Vercel can serve it
      outDir: path.resolve(import.meta.dirname, "dist"),
      emptyOutDir: true,
      assetsDir: "assets",
    },

    server: {
      fs: { strict: true, deny: ["**/.*"] },
    },
  };
});
