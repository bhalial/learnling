/**
 * Builds the Chrome extension into extension/out: the book's page (the same renderer as the
 * Windows app, with Chrome's window.spellbook from bridge.ts), the service worker, the
 * content script for Magister pages, the icons and the manifest. Load extension/out as an
 * unpacked extension to try it; the release zips it for the Chrome Web Store.
 *
 *   npm run extension
 */
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { build as bundle } from 'esbuild'
import { build } from 'vite'

const root = __dirname
const out = join(root, 'out')
const { version } = JSON.parse(readFileSync(join(root, '..', 'package.json'), 'utf8')) as { version: string }

// The page, with its fonts and styles, exactly as the Windows app's renderer builds it.
await build({
  configFile: false,
  root,
  base: './',
  logLevel: 'warn',
  plugins: [react(), tailwindcss()],
  // One page loaded from disk: a large bundle costs nothing here.
  build: { outDir: out, emptyOutDir: true, chunkSizeWarningLimit: 2000, rollupOptions: { input: join(root, 'app.html') } }
})

const scripts = { bundle: true, minify: true, target: 'chrome120', logLevel: 'warning' } as const
await bundle({ ...scripts, entryPoints: [join(root, 'background.ts')], format: 'esm', outfile: join(out, 'background.js') })
await bundle({ ...scripts, entryPoints: [join(root, 'content.ts')], format: 'iife', outfile: join(out, 'content.js') })

const ICONS = [16, 32, 48, 128]
for (const size of ICONS) copyFileSync(join(root, '..', 'resources', 'extension', `icon-${size}.png`), join(out, `icon-${size}.png`))
const icons = Object.fromEntries(ICONS.map((size) => [size, `icon-${size}.png`]))

const manifest = {
  manifest_version: 3,
  name: 'Learnling',
  version,
  description: 'A two-week homework planner with a study buddy. Works with Magister.',
  // runtime.getContexts (116) and minute alarms that keep their period (120).
  minimum_chrome_version: '120',
  icons,
  action: { default_title: 'Open Learnling', default_icon: { 16: icons[16], 32: icons[32] } },
  background: { service_worker: 'background.js', type: 'module' },
  permissions: ['storage', 'alarms', 'notifications', 'scripting'],
  // Asked for only when someone connects Magister (extension/magister.ts).
  optional_host_permissions: ['https://*.magister.net/*']
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

console.log('built', out)
