# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Environment variables

The Vite build is configured to read env vars prefixed with `VITE_`.
The merged value at build/runtime is determined by Vite's load order
for the current `mode`. For full reference see
[Vite env modes docs](https://vite.dev/guide/env-and-mode).

### Files

| File | Committed? | Loaded in modes | Purpose |
|---|---|---|---|
| `.env` | NO (gitignored) | all | Repo-wide defaults (e.g. `VITE_API_URL=http://localhost:8000/api` for the dev server). Use `.env.example` as the template — copy to `.env` if you want a personal baseline. |
| `.env.example` | yes | (template only) | Documentation of every recognised key. Copy to `.env.local` to start hacking locally. |
| `.env.local` | NO (gitignored) | all | Personal dev overrides. Loaded for `dev`, `build`, `preview`. Keep dev-only values here. |
| `.env.production` | yes | `production` | Defaults for `vite build` / `vite preview --mode production`. Currently empty `VITE_API_URL=` for same-origin SPAs. Mode-specific files override generic `.env.local` per Vite's load priority. |
| `.env.production.local` | NO (gitignored) | `production` | Per-machine overrides for prod-mode builds. Rarely useful; CI secret injection is preferred. |

### Recognised keys

- `VITE_API_URL` — base URL for the backend API. Empty value = same-origin (SPA hits `/api/...`). Localhost values are blocked by `vite.config.ts` during `mode === 'production'` builds (see prod-localhost guard).
- `VITE_LANDING_COMPANY_SLUG` — public company slug for the landing's hardcoded routes.
- `VITE_SENTRY_DSN` — Sentry DSN for runtime error reporting (added in FE-BUILD-003 / Task 4). Empty = disabled gracefully.

### Common pitfalls

- `.env.local` is loaded EVEN during `npm run build`. Vite's load order puts mode-specific files (`.env.production`) above generic ones (`.env.local`), so the committed `.env.production` with empty `VITE_API_URL=` overrides any localhost value in `.env.local`. The prod-localhost guard in `vite.config.ts` is a safety net for the case where `.env.production` is missing or accidentally edited to localhost. To produce a clean prod bundle from your machine: keep `.env.production` with `VITE_API_URL=` empty (default) or set a real prod URL there.
