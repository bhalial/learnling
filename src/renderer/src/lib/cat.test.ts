import { describe, expect, it } from 'vitest'
import { ALL_SPECIES } from '../companions'
import { VOICES } from '../companions/voices'
import type { Species } from '../companions/types'
import { wordsFor } from '../i18n'
import type { ReactionKind } from '../store'
import type { SpellbookData } from '../types'
import { catLine } from './cat'
import { demoBook } from './seed'

const TODAY = '2026-09-30'

function book(species: Species, lang: 'en' | 'nl' = 'en'): SpellbookData {
  const data = demoBook(TODAY)
  return { ...data, lang, companion: { ...data.companion, species } }
}

/** Everything an animal says for one kind of reaction, over many moments. */
function said(species: Species, kind: ReactionKind, lang: 'en' | 'nl' = 'en'): Set<string> {
  const data = book(species, lang)
  const t = wordsFor(lang, 'magic')
  return new Set(Array.from({ length: 40 }, (_, at) => catLine(data, TODAY, { kind, at }, { state: 'idle' }, t).text))
}

describe('voices', () => {
  it.each(ALL_SPECIES)('%s: says every kind of thing, in English and Dutch', (species) => {
    const { en, nl } = VOICES[species]
    expect(Object.keys(nl).sort()).toEqual(Object.keys(en).sort())
    for (const voice of [en, nl]) for (const lines of Object.values(voice)) expect(lines.length).toBeGreaterThan(0)
  })

  it('lets only the cat purr', () => {
    for (const species of ALL_SPECIES.filter((s) => s !== 'cat')) {
      for (const line of said(species, 'yay')) expect(line).not.toMatch(/purr/i)
      for (const line of said(species, 'yay', 'nl')) expect(line).not.toMatch(/spinn/i)
    }
    expect([...said('cat', 'yay')].some((line) => line.startsWith('Purr-fect!'))).toBe(true)
  })

  it('takes turns between the theme’s words and the animal’s own', () => {
    const lines = said('dog', 'yay')
    expect([...lines].some((line) => line.startsWith('Spell cast!'))).toBe(true)
    expect([...lines].some((line) => line.startsWith('Woof!'))).toBe(true)
    // The cheer is followed by how many are left, like the theme's own line.
    expect([...lines].every((line) => /for today\.$/.test(line))).toBe(true)
    expect(said('robot', 'dress')).toContain('New look installed. Status: excellent.')
  })

  it('keeps a reaction’s line while the note is up', () => {
    const data = book('parrot')
    const t = wordsFor('en', 'garden')
    const once = catLine(data, TODAY, { kind: 'added', at: 17 }, { state: 'idle' }, t).text
    expect(catLine(data, TODAY, { kind: 'added', at: 17 }, { state: 'idle' }, t).text).toBe(once)
  })

  it('says what needs doing in the theme’s plain words', () => {
    expect([...said('whale', 'tooLate')]).toEqual([wordsFor('en', 'magic').cat.tooLate])
  })
})
