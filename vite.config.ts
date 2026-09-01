import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const siteHost = "huggingface.it.com";

function googleSiteVerification(token: string): Plugin {
  return {
    name: "google-site-verification",
    transformIndexHtml(html) {
      if (!token || !/^[A-Za-z0-9_=-]+$/.test(token)) return html;
      return html.replace(
        "</head>",
        `    <meta name="google-site-verification" content="${token}" />\n  </head>`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const verification = (env.VITE_GOOGLE_SITE_VERIFICATION ?? "").trim();

  return {
    plugins: [react(), googleSiteVerification(verification)],
    base: "/",
    server: { port: 5173, host: true },
    preview: {
      host: true,
      allowedHosts: [siteHost],
    },
  };
});
