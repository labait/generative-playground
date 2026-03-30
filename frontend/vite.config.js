import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const api = process.env.VITE_DEV_PROXY || "http://127.0.0.1:3001";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    proxy: {
      "/api": api,
      "/auth": api,
      "/media": api,
    },
  },
});
