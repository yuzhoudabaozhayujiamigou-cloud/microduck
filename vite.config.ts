import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const siteHost = "huggingface.it.com";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: { port: 5173, host: true },
  preview: {
    host: true,
    allowedHosts: [siteHost],
  },
});
