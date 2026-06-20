# CLAUDE.md

Guidance for working in this repo. It's a **template** for small installable
PWAs that run full-screen on iPhone and Android. New apps are scaffolded as
sibling folders via `pnpm new`.

## Commands

```bash
pnpm dev              # dev server at http://localhost:5173 (SW enabled in dev)
pnpm dev --host       # also serve on the LAN
pnpm build            # tsc typecheck + vite build → dist/ (also generates icons)
pnpm preview          # serve the production build
pnpm generate-icons   # regenerate icons from public/icon.svg
pnpm new              # scaffold a new app into a sibling folder
```

There are no tests or linters configured. Verify changes with `pnpm build`.

## Architecture

- **`app.config.json` is the single source of truth** for app identity (name,
  shortName, description, themeColor, backgroundColor). It feeds three places:
  the web manifest and the `%PLACEHOLDERS%` in `index.html` (both via
  `vite.config.ts`), and `src/app.ts` (imported directly). Change identity
  here, not in scattered files.
- **`vite.config.ts`** reads `app.config.json`, configures `vite-plugin-pwa`
  (manifest + `autoUpdate` service worker + icon generation), and has a small
  inline plugin that replaces `%APP_NAME%` / `%SHORT_NAME%` / `%DESCRIPTION%`
  in `index.html`. (`%THEME_COLOR%` is no longer used there — the plugin
  injects `theme-color` itself.)
- **Icons** are generated from `public/icon.svg` by `@vite-pwa/assets-generator`
  (config in `pwa-assets.config.ts`) at build time, emitted into `dist/`. The
  matching `<link>` tags (manifest, favicon, apple-touch-icon) are injected
  automatically — don't hand-write them in `index.html`.
- **State**: `src/lib/store.ts` is a ~60-line persisted reactive store
  (no framework). `createStore(key, initial)` returns get/set/update/subscribe
  and saves to `localStorage`. The `load()`/`save()` functions at the bottom
  are the **sync seam**: swap them for `fetch()` to a backend when an app needs
  cross-device sync. Don't replace the store with a framework for small apps.
- **`src/app.ts`** is a demo checklist proving the store/offline/install flow.
  It's meant to be replaced per app, not extended into a framework.
- **iOS specifics** live in `index.html`: `viewport-fit=cover` and the
  `apple-mobile-web-app-*` / `mobile-web-app-capable` meta tags. `style.css`
  uses `env(safe-area-inset-*)` for the notch/home indicator.

## The generator (`scripts/create-app.mjs`)

`pnpm new` copies the template to a sibling folder, skipping
`node_modules`, `dist`, `dev-dist`, `.git`, `scripts/`, and `themes.html`. It
rewrites `app.config.json` and `package.json` (sets `name`, drops the `new` and
`themes` scripts), then runs `pnpm install` and `git init`. If you add a
top-level file or folder that should NOT be copied into new apps, add it to the
`SKIP` set there.

**Theme picker:** the color step reads `scripts/themes.json` (the single source
of truth) and lets the user pick by number or type a custom `#hex`. The chosen
`themeColor` is written to `app.config.json` **and** patched into
`src/style.css` (`--accent`) and `public/icon.svg` (the `<rect>` fill) — this is
where the "three places hold the accent color" duplication gets reconciled at
scaffold time. `themes.html` is a generated visual preview
(`pnpm themes` → `scripts/build-theme-preview.mjs`); edit `themes.json`, then
regenerate. Keep the swatch accents dark enough for white text (header/buttons
use `#fff`).

## Gotchas

- **`workbox-window` must stay a direct devDependency.** Under pnpm's strict
  node_modules layout, `vite build` fails to resolve it from the
  `virtual:pwa-register` module otherwise. Don't remove it.
- **Installing a PWA requires HTTPS.** `localhost` counts; a raw LAN IP from
  `pnpm dev --host` does not — the service worker won't register on iOS there.
  Test real install behavior on a deployed (Netlify/Vercel) URL.
- **`crypto.randomUUID()`** (used in `app.ts`) requires a secure context —
  fine on localhost and HTTPS.
- Deploy is host-agnostic static `dist/`; `netlify.toml` and `vercel.json` both
  set SPA routing and no-cache headers for `sw.js`. Keep those in sync if you
  change build output.
