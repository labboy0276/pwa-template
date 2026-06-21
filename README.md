# PWA Template

A reusable starting point for small installable web apps that run full-screen
on iPhone and Android — no app store, no native code. Vite + TypeScript, with
the service worker, manifest and all icons generated for you. Apps work offline
out of the box, come with optional cross-device sync (Supabase) built in, and
ship with a Vitest test setup.

## Project structure

```
template/
├── app.config.json        Name, colors, description — single source of truth
├── public/icon.svg        Source icon; every PNG + Apple splash derives from it
├── index.html             iOS full-screen meta tags (manifest/icons auto-injected)
├── src/
│   ├── main.ts            Entry point; SW + (optional) sign-in gate
│   ├── app.ts             Demo checklist app — replace with your own
│   ├── lib/store.ts       Reactive store: localStorage cache + Supabase sync
│   ├── lib/supabase.ts    Supabase client (reads .env; null when unset)
│   ├── lib/auth.ts        Magic-link sign-in screen + sign-out
│   ├── lib/store.test.ts  Example Vitest suite (store regression tests)
│   └── style.css          Mobile-first, dark mode, notch-safe
├── vitest.config.ts       Vitest + jsdom config
├── supabase/schema.sql    Run once in your Supabase project (the kv table + RLS)
├── .env.example           Copy to .env and add your Supabase keys
├── scripts/create-app.mjs The `pnpm new` generator
├── vite.config.ts         Wires up vite-plugin-pwa from app.config.json
├── pwa-assets.config.ts   Icon/splash generation settings
└── netlify.toml / vercel.json   Deploy configs (pick one)
```

## Spin up a new app

From inside this template folder:

```bash
pnpm new
```

It asks for a name and a **theme** (pick a number from the color palette), then
creates a **sibling folder** (next to `template/`), installs deps and inits git.
Then:

```bash
cd ../your-app
pnpm dev
```

> First time only: run `pnpm install` here in `template/` so `pnpm new` works.

**Previewing themes:** open `themes.html` in a browser to see the palette as
swatches, then enter the number you want when prompted. The list lives in
`scripts/themes.json`; run `pnpm themes` to regenerate the preview after editing
it. You can also type a custom `#hex` instead of a number. The chosen color is
applied to the manifest/status bar, the CSS accent, **and** the icon in one go.

## Develop

```bash
pnpm dev              # local dev server (http://localhost:5173)
pnpm dev --host       # also expose on your LAN to open on your phone
pnpm build            # type-check + production build into dist/
pnpm preview          # serve the production build locally
pnpm test             # run the test suite once (pnpm test:watch to watch)
```

## Testing

[Vitest](https://vitest.dev) + jsdom, configured in `vitest.config.ts`. Put
tests next to the code as `*.test.ts`; `src/lib/store.test.ts` is a working
example. Run `pnpm test` (once) or `pnpm test:watch` (during development). Every
scaffolded app inherits this setup.

## Make it yours

- **Identity** (name, colors, description): edit `app.config.json` — it feeds
  the manifest, the `<title>`, and the home-screen name in one place.
- **Icon**: replace `public/icon.svg`, then `pnpm generate-icons` (build does
  this automatically). Every icon + Apple splash screen is derived from it.
- **The app itself**: `src/app.ts` is a demo checklist — replace it. State
  lives in `src/lib/store.ts` via `createStore(key, initial)` — it persists to
  `localStorage` and, when Supabase is configured, syncs across devices.

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

## Cross-device sync (Supabase)

Sync is **built in but optional**. With no `.env`, an app runs local-only
(`localStorage`, no sign-in) — fine for offline, single-device apps. Add
Supabase keys and the same app gains a magic-link sign-in and live sync across
devices, with `localStorage` staying as an instant offline cache.

**One Supabase project ("PWAs") backs all your apps.** Each app's data is kept
separate by its name (the `app` column in the shared `kv` table), so you set up
Supabase once and reuse the same keys everywhere.

First-time setup:

1. Create a Supabase project (name it e.g. `PWAs`).
2. **SQL Editor →** paste `supabase/schema.sql` → **Run**. (One per-user `kv`
   table with row-level security + realtime. Run once for the whole project.)
3. **Project Settings → API:** copy the **Project URL** and **anon public key**.
4. `cp .env.example .env` and paste those two values in.
5. **Authentication → URL Configuration:** set your site URL and add the
   redirect URLs you'll sign in from (e.g. `http://localhost:5173` and your
   deployed URL). The magic link only works for origins on this list.
6. On Netlify/Vercel, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as
   environment variables, then redeploy.

Data is **personal** by default (each signed-in user sees only their own rows).
To make an app's data *shared* between people, see the note in
`supabase/schema.sql`. Sync is last-write-wins per store key.

> An app's **name** (`app.config.json`) sets its data namespace, so renaming an
> app after it has synced data points it at a new, empty bucket. Pick the name
> before first sync.
