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
pnpm test             # run the Vitest suite once
pnpm test:watch       # Vitest in watch mode
pnpm new              # scaffold a new app into a sibling folder
```

No linter is configured. Verify changes with `pnpm test` and `pnpm build`.

## Testing

Vitest + jsdom. Config is `vitest.config.ts` (separate from `vite.config.ts` so
the PWA plugin doesn't run in tests; jsdom provides the DOM + `localStorage`).
Tests are `src/**/*.{test,spec}.ts`; `src/lib/store.test.ts` is the worked
example and the store's regression suite. Test files live under `src`, so `tsc`
(via `pnpm build`) typechecks them too — but `vite build` never bundles them
(nothing imports them from the entry).

## Architecture

- **`app.config.json` is the single source of truth** for app identity (name,
  shortName, description, themeColor, backgroundColor). It feeds: the web
  manifest and the `%PLACEHOLDERS%` in `index.html` (both via `vite.config.ts`),
  `src/app.ts` (imported directly), and `src/lib/supabase.ts` (the `name`
  becomes `APP_ID`, the synced-data namespace). Change identity here, not in
  scattered files.
- **`vite.config.ts`** reads `app.config.json`, configures `vite-plugin-pwa`
  (manifest + `autoUpdate` service worker + icon generation), and has a small
  inline plugin that replaces `%APP_NAME%` / `%SHORT_NAME%` / `%DESCRIPTION%`
  in `index.html`. (`%THEME_COLOR%` is no longer used there — the plugin
  injects `theme-color` itself.)
- **Icons** are generated from `public/icon.svg` by `@vite-pwa/assets-generator`
  (config in `pwa-assets.config.ts`) at build time, emitted into `dist/`. The
  matching `<link>` tags (manifest, favicon, apple-touch-icon) are injected
  automatically — don't hand-write them in `index.html`.
- **State**: `src/lib/store.ts` is a small reactive store (no framework).
  `createStore(key, initial)` returns get/set/update/subscribe/destroy. Three
  persistence layers: `localStorage` (instant/offline cache) → Supabase (synced
  source of truth) → realtime (live cross-device updates). Don't replace it with
  a framework for small apps.
- **Supabase sync is built in but optional.** `src/lib/supabase.ts` builds a
  client from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (in `.env`); when
  those are unset, `supabase` is `null` and the store degrades to
  localStorage-only with no sign-in. When set, `src/lib/auth.ts` gates the app
  behind a magic-link sign-in (`main.ts` calls `ensureAuth` then dynamically
  imports `./app`, so the store only spins up once authenticated). All apps
  share one Supabase project; data is namespaced by `APP_ID` (derived from
  `app.config.json` name) in a generic `kv` table. `supabase/schema.sql` makes
  data personal (per-user RLS); flip the policy there for shared data.
- **`src/app.ts`** is a demo checklist proving the store/offline/install flow.
  It's meant to be replaced per app, not extended into a framework.
- **iOS specifics** live in `index.html`: `viewport-fit=cover` and the
  `apple-mobile-web-app-*` / `mobile-web-app-capable` meta tags. `style.css`
  uses `env(safe-area-inset-*)` for the notch/home indicator.

## The generator (`scripts/create-app.mjs`)

`pnpm new` copies the template to a sibling folder, skipping `node_modules`,
`dist`, `dev-dist`, `.git`, `scripts/`, `themes.html`, and `.env` (secrets). It
rewrites `app.config.json` and `package.json` (sets `name`, drops the `new` and
`themes` scripts), then runs `pnpm install` and `git init`. New apps inherit the
Supabase wiring (`src/lib/*`, `supabase/schema.sql`, `.env.example`) and the
shared deps. If you add a top-level file or folder that should NOT be copied
into new apps, add it to the `SKIP` set there.

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
- **Supabase magic links need the origin allow-listed.** Sign-in fails silently
  if the dev/prod URL isn't under Supabase Auth → URL Configuration → Redirect
  URLs. The anon key is publishable (safe in the client); security is RLS.
- **Renaming an app changes its synced-data namespace.** `APP_ID` is derived
  from `app.config.json` `name`; changing the name after data exists points the
  app at a new, empty `kv` bucket. Rename before first sync, or migrate rows.
- Deploy is host-agnostic static `dist/`; `netlify.toml` and `vercel.json` both
  set SPA routing and no-cache headers for `sw.js`. Keep those in sync if you
  change build output.
