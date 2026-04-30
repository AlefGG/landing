import { defineConfig, loadEnv, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }): UserConfig => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  if (mode === "production") {
    const apiUrl = env.VITE_API_URL ?? "";
    if (/^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(?:[:/?#]|$)/i.test(apiUrl)) {
      throw new Error(
        `vite.config.ts: VITE_API_URL points to localhost ("${apiUrl}") ` +
          `during a production build. This usually means .env.local is ` +
          `leaking into 'vite build'. Empty the value (= same-origin) or ` +
          `set a real prod URL in .env.production / CI secrets.`,
      );
    }
  }

  return {
    plugins: [react(), tailwindcss()],
  };
});
