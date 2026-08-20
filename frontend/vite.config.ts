import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this project at https://<user>.github.io/5/, so the
// build needs that sub-path as its base. Local dev keeps root ("/").
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? "/HighFive/" : "/",
  server: {
    // 로컬 백엔드(기본 8080)로 /api 요청을 그대로 넘긴다 - 브라우저 입장에서는 같은 오리진이라
    // 백엔드에 별도 CORS 설정을 추가할 필요가 없다.
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
