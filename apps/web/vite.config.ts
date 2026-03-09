import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  // Use relative asset paths in production so Electron file:// loads JS/CSS correctly.
  base: command === "build" ? "./" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@photobooth/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
      "@photobooth/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
      "@photobooth/ui/*": path.resolve(__dirname, "../../packages/ui/src/*")
    }
  }
}));
