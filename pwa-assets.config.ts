import {
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

// Generates the full set of PWA icons + Apple touch icons / splash screens
// from a single source image. Edit public/icon.svg, then run:
//   pnpm generate-icons
// (the production `pnpm build` also runs this automatically).
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/icon.svg'],
})
