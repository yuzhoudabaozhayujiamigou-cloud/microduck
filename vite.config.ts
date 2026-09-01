import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const siteHost = "huggingface.it.com";

function googleSiteVerification(): Plugin {
  let token = "";
  return {
    name: "google-site-verification",
    configResolved(config) {
      token = String(config.env.VITE_GOOGLE_SITE_VERIFICATION ?? "").trim();
    },
    transformIndexHtml(html) {
      if (!token || !/^[A-Za-z0-9_=-]+$/.test(token)) return html;
      return html.replace(
        "</head>",
        `    <meta name="google-site-verification" content="${token}" />\n  </head>`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), googleSiteVerification()],
  base: "/",
  server: { port: 5173, host: true },
  preview: {
    host: true,
    allowedHosts: [siteHost],
  },
});
