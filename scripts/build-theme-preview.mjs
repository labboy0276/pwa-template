#!/usr/bin/env node
// Regenerate themes.html (a visual swatch board) from themes.json.
//   pnpm themes
// Open the resulting themes.html in a browser to pick a theme number for
// `pnpm new`.

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const themes = JSON.parse(await readFile(resolve(here, 'themes.json'), 'utf-8'))

// Escape values from themes.json before injecting them into markup/attributes.
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )

const cards = themes
  .map((t, i) => {
    const dark = t.backgroundColor.toLowerCase() !== '#ffffff'
    return `      <figure class="card">
        <div class="swatch" style="background:${esc(t.themeColor)}">
          <span class="num">${i + 1}</span>
          <span class="sample">Aa</span>
        </div>
        <figcaption>
          <strong>${esc(t.name)}</strong>
          <code>${esc(t.themeColor)}</code>
          <span class="bg" style="background:${esc(t.backgroundColor)}"></span>
          <small>splash ${esc(t.backgroundColor)}${dark ? ' · dark' : ''}</small>
        </figcaption>
      </figure>`
  })
  .join('\n')

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Theme palette — pick a number for \`pnpm new\`</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        margin: 0; padding: 2rem; background: #f4f4f7; color: #1a1a1f;
      }
      @media (prefers-color-scheme: dark) {
        body { background: #0f0f14; color: #f2f2f5; }
        figcaption small { color: #9a9aa4; }
      }
      h1 { font-size: 1.3rem; margin: 0 0 0.25rem; }
      p.lead { margin: 0 0 1.75rem; color: #6b6b76; }
      .grid {
        display: grid; gap: 1rem;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }
      .card {
        margin: 0; border-radius: 16px; overflow: hidden;
        background: Canvas; box-shadow: 0 1px 3px rgba(0,0,0,.12);
      }
      .swatch {
        height: 96px; display: flex; align-items: center; justify-content: space-between;
        padding: 0 1rem; color: #fff;
      }
      .swatch .num { font-size: 1.4rem; font-weight: 700; opacity: .9; }
      .swatch .sample { font-size: 1.6rem; font-weight: 650; }
      figcaption { padding: 0.75rem 1rem 1rem; display: grid; gap: 0.2rem; }
      figcaption strong { font-size: 1rem; }
      figcaption code { font-size: 0.8rem; color: #6b6b76; }
      figcaption .bg {
        width: 28px; height: 14px; border-radius: 4px;
        border: 1px solid rgba(128,128,128,.4); margin-top: 0.15rem;
      }
      figcaption small { font-size: 0.72rem; color: #8a8a94; }
    </style>
  </head>
  <body>
    <h1>Theme palette</h1>
    <p class="lead">Open this file, find a swatch you like, and enter its number when <code>pnpm new</code> asks for a theme. White text on each swatch previews the app header/buttons.</p>
    <div class="grid">
${cards}
    </div>
  </body>
</html>
`

await writeFile(resolve(here, '..', 'themes.html'), html)
console.log(`Wrote themes.html (${themes.length} themes)`)
