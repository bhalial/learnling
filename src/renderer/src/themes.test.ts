import { describe, expect, it } from 'vitest'
import { dictionaries, wordsFor } from './i18n'
import { contrast, READABLE } from './lib/color'
import { PALETTE } from './lib/seed'
import { ALL_THEMES, subjectInkFor, THEMES, themeFor, type ThemeColors } from './themes'
import { THEME_WORDS } from './themeWords'

/** Every place text sits on a colour: [text, ground]. */
const PAIRS: Array<[keyof ThemeColors, keyof ThemeColors]> = [
  ['ink', 'paper'],
  ['ink-soft', 'paper'],
  ['wax', 'paper'],
  ['quill', 'paper'],
  ['mystery', 'paper'],
  ['done', 'paper'],
  ['ink', 'paper-deep'],
  ['ink-soft', 'paper-deep'],
  ['quill', 'paper-deep'],
  ['ink', 'note'],
  ['quill', 'note'],
  ['cream', 'desk'],
  ['cream', 'glow'],
  ['cream-soft', 'desk'],
  ['cream-soft', 'glow'],
  ['desk-alert', 'glow'],
  ['on-cream', 'cream'],
  ['on-wax', 'wax'],
  ['on-gold', 'gold'],
  ['on-button', 'button'],
  ['paper', 'ink']
]

describe('themes stay readable', () => {
  it.each(ALL_THEMES)('%s: all text reads at 4.5:1', (id) => {
    const colors = THEMES[id].colors
    const weak = PAIRS.map(([text, ground]) => [`${text} on ${ground}`, contrast(colors[text], colors[ground])] as const).filter(
      ([, ratio]) => ratio < READABLE
    )
    expect(weak.map(([pair, ratio]) => `${pair}: ${ratio.toFixed(2)}`)).toEqual([])
  })

  it.each(ALL_THEMES)('%s: every subject colour reads on the page', (id) => {
    const paper = THEMES[id].colors.paper
    const weak = PALETTE.filter((color) => contrast(subjectInkFor(color, id), paper) < READABLE)
    expect(weak).toEqual([])
  })
})

describe('theme words', () => {
  it('lays a theme’s words over the plain ones, word by word', () => {
    const magic = wordsFor('en', 'magic')
    expect(magic.newTask).toBe('New spell')
    expect(magic.kinds.study).toBe('Training')
    // A group keeps the plain words the theme leaves alone.
    expect(magic.kinds.test).toBe('Test')
    expect(magic.cat.login).toBe(dictionaries.en.cat.login)
    expect(wordsFor('nl', 'garden').cat.yay(0)).toBe('Het groeit! Dat was de laatste voor vandaag.')
  })

  it('leaves the notebook plain', () => {
    expect(wordsFor('nl', 'notebook')).toEqual(dictionaries.nl)
  })

  it.each(ALL_THEMES)('%s: says the same things in English and Dutch', (id) => {
    const keys = (lang: 'en' | 'nl'): string[] =>
      Object.entries(THEME_WORDS[id][lang]).flatMap(([key, value]) =>
        value && typeof value === 'object' ? Object.keys(value).map((inner) => `${key}.${inner}`) : [key]
      )
    expect(keys('nl').sort()).toEqual(keys('en').sort())
  })

  it('names a test and a quiz in a theme only together', () => {
    for (const id of ALL_THEMES)
      for (const lang of ['en', 'nl'] as const) {
        const t = wordsFor(lang, id)
        expect(t.testName === null).toBe(t.quizName === null)
      }
  })
})

describe('themeFor', () => {
  it('keeps a known theme and makes anything else a spellbook', () => {
    expect(themeFor('ocean')).toBe('ocean')
    expect(themeFor(undefined)).toBe('magic')
    expect(themeFor('jungle')).toBe('magic')
  })
})
