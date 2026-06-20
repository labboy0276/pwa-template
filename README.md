# PWA Template

A reusable starting point for small installable web apps that run full-screen
on iPhone and Android — no app store, no native code. Vite + TypeScript, with
the service worker, manifest and all icons generated for you.

## Spin up a new app

From inside this template folder:

```bash
pnpm new
```

It asks for a name, colors, etc., then creates a **sibling folder** (next to
`template/`), installs deps and inits git. Then:

```bash
cd ../your-app
pnpm dev
```

> First time only: run `pnpm install` here in `template/` so `pnpm new` works.

## Develop

```bash
pnpm dev              # local dev server (http://localhost:5173)
pnpm dev --host       # also expose on your LAN to open on your phone
pnpm build            # type-check + production build into dist/
pnpm preview          # serve the production build locally
```

## Make it yours

- **Identity** (name, colors, description): edit `app.config.json` — it feeds
  the manifest, the `<title>`, and the home-screen name in one place.
- **Icon**: replace `public/icon.svg`, then `pnpm generate-icons` (build does
  this automatically). Every icon + Apple splash screen is derived from it.
- **The app itself**: `src/app.ts` is a demo checklist — replace it. State
  lives in `src/lib/store.ts`, a tiny persisted reactive store.

## Installing on a phone

PWAs only install over **HTTPS** (localhost counts; a raw LAN IP does not), so
deploy first, then open the URL on the phone.

- **iPhone (Safari):** Share → *Add to Home Screen*.
- **Android (Chrome):** menu → *Install app* / *Add to Home Screen*.

It then launches full-screen with its own icon, and works offline.

## Deploy

Push to GitHub and connect the repo to **Netlify** or **Vercel** — both are
pre-configured (`netlify.toml` / `vercel.json`) with build command `pnpm build`,
output `dist/`, SPA routing and correct service-worker caching. Free HTTPS
included.

## Adding cross-device sync later

Apps are **local-first**: data is saved per device in `localStorage`. When an
app needs to share data between phones, swap the `load()` / `save()` functions
at the bottom of `src/lib/store.ts` for `fetch()` calls to a backend
(a Netlify/Vercel serverless function, Supabase, etc.). Nothing else changes.
