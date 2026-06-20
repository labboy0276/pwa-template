#!/usr/bin/env node
// Scaffold a new PWA from this template into a sibling folder.
//   pnpm new
// Prompts for a name etc., copies the template, rewrites app.config.json +
// package.json, installs deps and inits git.

import { cp, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'

const here = dirname(fileURLToPath(import.meta.url))
const templateRoot = resolve(here, '..')
const appsRoot = resolve(templateRoot, '..') // sibling of the template

const SKIP = new Set(['node_modules', 'dist', 'dev-dist', '.git', 'scripts'])

const rl = createInterface({ input: process.stdin, output: process.stdout })
const ask = async (q, def) => {
  const a = (await rl.question(`${q}${def ? ` (${def})` : ''}: `)).trim()
  return a || def
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

try {
  const name = await ask('App name', 'My App')
  const slug = slugify(await ask('Folder name', slugify(name)))
  const shortName = await ask('Short name (home screen, keep it short)', name)
  const description = await ask('Description', `${name} — a PWA`)
  const themeColor = await ask('Theme color (hex)', '#4f46e5')
  const backgroundColor = await ask('Splash background (hex)', '#ffffff')

  const dest = resolve(appsRoot, slug)
  if (existsSync(dest)) {
    console.error(`\n✗ ${dest} already exists. Pick another folder name.`)
    process.exit(1)
  }

  console.log(`\nCreating ${dest} …`)
  await cp(templateRoot, dest, {
    recursive: true,
    filter: (src) => {
      const rel = src.slice(templateRoot.length + 1)
      if (!rel) return true
      return !SKIP.has(rel.split(/[\\/]/)[0])
    },
  })

  // app.config.json — the single source of truth for app identity.
  await writeFile(
    resolve(dest, 'app.config.json'),
    JSON.stringify(
      { name, shortName, description, themeColor, backgroundColor },
      null,
      2,
    ) + '\n',
  )

  // package.json — rename, drop the generator script (apps don't scaffold).
  const pkgPath = resolve(dest, 'package.json')
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
  pkg.name = slug
  pkg.version = '0.1.0'
  delete pkg.scripts.new
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  rl.close()

  console.log('Installing dependencies …')
  spawnSync('pnpm', ['install'], { cwd: dest, stdio: 'inherit' })
  spawnSync('git', ['init', '-q'], { cwd: dest, stdio: 'inherit' })

  console.log(`\n✓ Done!\n\n  cd ${resolve(appsRoot, slug)}\n  pnpm dev\n`)
} catch (err) {
  rl.close()
  if (err?.code === 'ERR_USE_AFTER_CLOSE') process.exit(0) // ctrl-c at a prompt
  throw err
}
