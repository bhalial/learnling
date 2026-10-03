import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Caches rebuild themselves, the lockfile belongs to a running copy of the old app, and the
// book itself is copied under its new name.
const SKIP = /^(Cache|Code Cache|GPUCache|DawnGraphiteCache|DawnWebGPUCache|ShaderCache|Crashpad|blob_storage|lockfile|spellbook\.json.*)$/

function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true })
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (SKIP.test(entry.name)) continue
    const source = join(from, entry.name)
    const target = join(to, entry.name)
    try {
      if (entry.isDirectory()) copyTree(source, target)
      else copyFileSync(source, target)
    } catch {
      // A file the old app still holds open. Only the Magister login lives in these
      // files, and at worst it means logging in once more; the book itself is copied below.
    }
  }
}

/**
 * Learnling was called Spellbook until 3 October 2026 and kept everything in a folder
 * of that name. On the first start under the new name the old folder is copied over:
 * the book, and with it the Magister login (its cookies only decrypt together with the
 * "Local State" file next to them). The old folder stays where it is, as a backup.
 *
 * Runs before the app is ready, so nothing has opened the new folder yet.
 */
export function adoptSpellbook(oldDir: string, newDir: string, dataFile: string): boolean {
  const oldBook = join(oldDir, 'spellbook.json')
  if (existsSync(join(newDir, dataFile)) || !existsSync(oldBook)) return false
  copyTree(oldDir, newDir)
  for (const suffix of ['', '.bak']) {
    const source = `${oldBook}${suffix}`
    if (existsSync(source)) copyFileSync(source, join(newDir, `${dataFile}${suffix}`))
  }
  return true
}
