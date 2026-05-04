import { defineConfig, loadEnv, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// FE-BUILD-004 + FE-BUILD-005 + FE-PF-004:
//   - target es2022 — modern browsers only (no IE / old Safari).
//   - sourcemap "hidden" — emit .map files for Sentry symbolication
//     without exposing them to the public CDN (FE-BUILD-005). Sentry
//     CLI uploads them as a release artifact during deploy; the
//     production-served JS files reference them via a sourceMappingURL
//     comment that points at a path Sentry resolves, not a real file.
//   - manualChunks groups large vendor libs (FE-PF-004): react-vendor,
//     motion, i18n. Leaflet is already split out via React.lazy in
//     Wave-2 PF-001 — listing it here keeps the chunk name stable
//     (`leaflet-*.js`) instead of a hash-only chunk.
//   - server.proxy maps `/api` and `/media` to the dev backend so
//     `VITE_API_URL=""` works in dev without CORS.
//   - envPrefix locked to VITE_ (default, but explicit for clarity).

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
    envPrefix: "VITE_",
    build: {
      target: "es2022",
      sourcemap: "hidden",
      rollupOptions: {
        output: {
          // The project's bundler (rolldown) only accepts a function
          // form for manualChunks, not the object form. Groups large
          // vendor libs into named chunks for cacheability.
          //
          // **Leaflet is NOT in manualChunks here — Wave-2 FE-PF-001 fix
          // (b6dd1a09…) explicitly dropped it.** Listing leaflet as a
          // manualChunk forces rolldown to emit it as a static dependency
          // of the lazy MapPicker chunk, which Vite's auto-preload
          // analysis then surfaces as a `<link rel="modulepreload">` on
          // the entry HTML — the exact regression we want to avoid for
          // routes that never mount the map. Leaflet stays in its own
          // hash-only chunk created by `React.lazy(() => …MapPicker)`.
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return undefined;
            if (
              /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id) ||
              /[\\/]node_modules[\\/]scheduler[\\/]/.test(id)
            ) {
              return "react-vendor";
            }
            if (/[\\/]node_modules[\\/]framer-motion[\\/]/.test(id)) {
              return "motion";
            }
            if (
              /[\\/]node_modules[\\/](i18next|react-i18next|react-helmet-async)[\\/]/.test(id)
            ) {
              return "i18n";
            }
            return undefined;
          },
        },
      },
    },
    server: {
      proxy: {
        "/api": {
          target: env.VITE_DEV_BACKEND_URL || "http://localhost:8000",
          changeOrigin: true,
        },
        "/media": {
          target: env.VITE_DEV_BACKEND_URL || "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
  };
});
