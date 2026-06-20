import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Single source of truth for the app's identity. The `pnpm new` generator
// rewrites this file, so everything below stays generic.
const app = JSON.parse(
  readFileSync(new URL('./app.config.json', import.meta.url), 'utf-8'),
)

export default defineConfig({
  plugins: [
    VitePWA({
      // Ship updates silently: a new version is fetched in the background and
      // applied on the next launch. No "click to refresh" prompts needed.
      registerType: 'autoUpdate',

      // Generate every icon + Apple splash screen from public/icon.svg and
      // inject the matching <link> tags. See pwa-assets.config.ts.
      pwaAssets: { config: true },

      manifest: {
        name: app.name,
        short_name: app.shortName,
        description: app.description,
        theme_color: app.themeColor,
        background_color: app.backgroundColor,
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
      },

      // Let the service worker run during `pnpm dev` so you can test offline
      // behaviour and installability on localhost before deploying.
      devOptions: { enabled: true },
    }),

    // Fill the %PLACEHOLDERS% in index.html from app.config.json.
    {
      name: 'inject-app-config',
      transformIndexHtml(html) {
        return html
          .replaceAll('%APP_NAME%', app.name)
          .replaceAll('%SHORT_NAME%', app.shortName)
          .replaceAll('%THEME_COLOR%', app.themeColor)
          .replaceAll('%DESCRIPTION%', app.description)
      },
    },
  ],
})
