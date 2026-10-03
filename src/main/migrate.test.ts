import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { adoptSpellbook } from './migrate'

let root: string
let oldDir: string
let newDir: string

const put = (file: string, text = 'x'): void => {
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, text)
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'learnling-migrate-'))
  oldDir = join(root, 'spellbook')
  newDir = join(root, 'learnling')
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

describe('adoptSpellbook', () => {
  it('copies the book and the Magister login, but not the caches', () => {
    put(join(oldDir, 'spellbook.json'), '{"version":1}')
    put(join(oldDir, 'spellbook.json.bak'), '{"version":1,"old":true}')
    put(join(oldDir, 'Local State'))
    put(join(oldDir, 'Partitions', 'magister', 'Network', 'Cookies'))
    put(join(oldDir, 'Partitions', 'magister', 'Cache', 'Cache_Data', 'data_0'))
    put(join(oldDir, 'GPUCache', 'index'))
    put(join(oldDir, 'lockfile'))

    expect(adoptSpellbook(oldDir, newDir, 'learnling.json')).toBe(true)

    expect(readFileSync(join(newDir, 'learnling.json'), 'utf8')).toBe('{"version":1}')
    expect(readFileSync(join(newDir, 'learnling.json.bak'), 'utf8')).toBe('{"version":1,"old":true}')
    expect(existsSync(join(newDir, 'Local State'))).toBe(true)
    expect(existsSync(join(newDir, 'Partitions', 'magister', 'Network', 'Cookies'))).toBe(true)
    expect(existsSync(join(newDir, 'Partitions', 'magister', 'Cache'))).toBe(false)
    expect(existsSync(join(newDir, 'GPUCache'))).toBe(false)
    expect(existsSync(join(newDir, 'lockfile'))).toBe(false)
    expect(existsSync(join(newDir, 'spellbook.json'))).toBe(false)
    // The old folder stays as a backup.
    expect(existsSync(join(oldDir, 'spellbook.json'))).toBe(true)
  })

  it('never overwrites a book that already exists under the new name', () => {
    put(join(oldDir, 'spellbook.json'), 'old')
    put(join(newDir, 'learnling.json'), 'new')
    expect(adoptSpellbook(oldDir, newDir, 'learnling.json')).toBe(false)
    expect(readFileSync(join(newDir, 'learnling.json'), 'utf8')).toBe('new')
  })

  it('does nothing on a computer that never had Spellbook', () => {
    expect(adoptSpellbook(oldDir, newDir, 'learnling.json')).toBe(false)
    expect(existsSync(newDir)).toBe(false)
  })
})
