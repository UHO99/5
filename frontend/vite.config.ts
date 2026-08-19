import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this project at https://<user>.github.io/5/, so the
// build needs that sub-path as its base. Local dev keeps root ("/").
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? "/HighFive/" : "/",
});
