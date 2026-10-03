import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'

/**
 * Reads the book from disk. A file that fails to parse (power cut mid-write on
 * an older version, a hand edit gone wrong) falls back to the previous save,
 * so she never opens an empty book because of one bad write.
 */
export function readData(file: string): unknown {
  for (const candidate of [file, `${file}.bak`]) {
    if (!existsSync(candidate)) continue
    try {
      return JSON.parse(readFileSync(candidate, 'utf8'))
    } catch {
      // try the backup next
    }
  }
  return null
}

/** Writes via a temp file and a rename, keeping the previous save as `.bak`. */
export function writeData(file: string, data: unknown): void {
  const tmp = `${file}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2))
  if (existsSync(file)) copyFileSync(file, `${file}.bak`)
  renameSync(tmp, file)
}
