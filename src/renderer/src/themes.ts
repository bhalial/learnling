import type { Headwear } from './companions/pixel/face'
import { subjectInk } from './lib/color'
import type { Lang, ThemeId } from './types'

export type { ThemeId }

/**
 * How the book looks and talks. A theme brings three things: its words (themeWords.ts:
 * a mission log, a questlog, a garden), its look (the `data-theme` rules in styles.css and
 * the few theme parts in components/ThemeParts.tsx), and what the companion wears on its
 * head. What a task is and how planning works never changes with the theme.
 */
/**
 * The colours every theme fills in. They become the `--color-*` variables the Tailwind
 * classes use (bg-paper, text-ink…), so one set of components wears every theme. All text
 * pairs are held to 4.5:1 by themes.test.ts.
 */
export interface ThemeColors {
  /** The ground around the book, and the lightest spot of it (the lamp, the light from above). */
  desk: string
  glow: string
  /** The book's cover or the frame around a page. */
  leather: string
  /** Pages and sheets, a darker cut of them for buttons, and the companion's note. */
  paper: string
  'paper-deep': string
  note: string
  /** Text on a page: main, quiet. */
  ink: string
  'ink-soft': string
  /** Text on the ground: main, quiet, and an error. */
  cream: string
  'cream-soft': string
  'desk-alert': string
  /** Accents on a page: wax (due dates, today, warnings), gold (new), quill (your own words, ticks). */
  wax: string
  'wax-deep': string
  gold: string
  quill: string
  /** Text on a filled cream, wax or gold, and on the big "new" button. */
  'on-cream': string
  'on-wax': string
  'on-gold': string
  button: string
  'on-button': string
  /** A mystery task's text, a done task's text, and the keyboard focus ring. */
  mystery: string
  done: string
  focus: string
}

export interface Theme {
  id: ThemeId
  name: Record<Lang, string>
  headwear: Headwear
  colors: ThemeColors
  /** Body text, display (titles, dates, buttons) and handwriting (your own words). */
  fonts: { sans: string; display: string; displayWeight: number; hand: string }
}

const HAND = "'Caveat', cursive"
const NUNITO = "'Nunito', system-ui, sans-serif"

export const THEMES: Record<ThemeId, Theme> = {
  magic: {
    id: 'magic',
    name: { en: 'Spellbook', nl: 'Toverboek' },
    headwear: 'wizard',
    colors: {
      desk: '#241911',
      glow: '#4a3426',
      leather: '#5b2b23',
      paper: '#f6ecd6',
      'paper-deep': '#efe2c4',
      note: '#fbf3df',
      ink: '#2b2118',
      'ink-soft': '#6e5a44',
      cream: '#f3e3c0',
      'cream-soft': '#c9b48e',
      'desk-alert': '#f0a090',
      wax: '#a32c25',
      'wax-deep': '#7f1d17',
      gold: '#e3b54a',
      quill: '#2b4a8a',
      'on-cream': '#2b2118',
      'on-wax': '#fbf3df',
      'on-gold': '#2b2118',
      button: '#f3e3c0',
      'on-button': '#2b2118',
      mystery: '#7a5a2c',
      done: '#716453',
      focus: '#e3b54a'
    },
    fonts: { sans: "'Alegreya Sans', system-ui, sans-serif", display: "'IM Fell English', Georgia, serif", displayWeight: 400, hand: HAND }
  },
  garden: {
    id: 'garden',
    name: { en: 'Vegetable garden', nl: 'Moestuin' },
    headwear: 'straw',
    colors: {
      desk: '#e3ecd2',
      glow: '#eef4e2',
      leather: '#b07a43',
      paper: '#fbf6e9',
      'paper-deep': '#f1e6c9',
      note: '#f3e2c0',
      ink: '#2f3a24',
      'ink-soft': '#5a6649',
      cream: '#2f3a24',
      'cream-soft': '#4f5b40',
      'desk-alert': '#a33a1f',
      wax: '#9a5419',
      'wax-deep': '#7a4012',
      gold: '#f2c94c',
      quill: '#356224',
      'on-cream': '#fbf6e9',
      'on-wax': '#fff8ec',
      'on-gold': '#2f3a24',
      button: '#3d7027',
      'on-button': '#ffffff',
      mystery: '#76571b',
      done: '#686f5c',
      focus: '#1f5fa8'
    },
    fonts: { sans: NUNITO, display: "'Baloo 2', sans-serif", displayWeight: 700, hand: HAND }
  },
  ocean: {
    id: 'ocean',
    name: { en: 'Ocean dive', nl: 'Oceaanduik' },
    headwear: 'goggles',
    colors: {
      desk: '#0f4c5c',
      glow: '#135a6b',
      leather: '#0a3540',
      paper: '#fdf3dc',
      'paper-deep': '#f5e6c2',
      note: '#fdf3dc',
      ink: '#173b44',
      'ink-soft': '#4f6d73',
      cream: '#fdf3dc',
      'cream-soft': '#b5dde0',
      'desk-alert': '#ffc9bf',
      wax: '#b84a35',
      'wax-deep': '#8a2a18',
      gold: '#ffd27a',
      quill: '#0f4c5c',
      'on-cream': '#0f4c5c',
      'on-wax': '#fff8ec',
      'on-gold': '#173b44',
      button: '#ff7f6a',
      'on-button': '#2b0d07',
      mystery: '#6f5528',
      done: '#607072',
      focus: '#ffd27a'
    },
    fonts: { sans: NUNITO, display: "'Quicksand', sans-serif", displayWeight: 700, hand: HAND }
  },
  space: {
    id: 'space',
    name: { en: 'Space mission', nl: 'Ruimtemissie' },
    headwear: 'space',
    colors: {
      desk: '#0b1026',
      glow: '#0b1026',
      leather: '#2b3d7a',
      paper: '#121a3a',
      'paper-deep': '#1c2752',
      note: '#121a3a',
      ink: '#e8ecff',
      'ink-soft': '#9aa7d6',
      cream: '#e8ecff',
      'cream-soft': '#9aa7d6',
      'desk-alert': '#ff9f8f',
      wax: '#ff9a3c',
      'wax-deep': '#c96f1f',
      gold: '#4dd6ff',
      quill: '#7fe3ff',
      'on-cream': '#0b1026',
      'on-wax': '#1a1030',
      'on-gold': '#0b1026',
      button: '#ff9a3c',
      'on-button': '#1a1030',
      mystery: '#f0c96a',
      done: '#7d89b8',
      focus: '#4dd6ff'
    },
    fonts: { sans: "'Exo 2', system-ui, sans-serif", display: "'Exo 2', sans-serif", displayWeight: 700, hand: HAND }
  },
  quest: {
    id: 'quest',
    name: { en: 'Questlog', nl: 'Questlog' },
    headwear: 'crown',
    colors: {
      desk: '#1a1033',
      glow: '#1a1033',
      leather: '#0e0820',
      paper: '#251845',
      'paper-deep': '#33245a',
      note: '#0e0820',
      ink: '#f3eaff',
      'ink-soft': '#b5a6d9',
      cream: '#f3eaff',
      'cream-soft': '#b5a6d9',
      'desk-alert': '#ff9fb0',
      wax: '#ff8fd0',
      'wax-deep': '#cc3f57',
      gold: '#ffd23f',
      quill: '#7cff6b',
      'on-cream': '#1a1033',
      'on-wax': '#1a1033',
      'on-gold': '#1a1033',
      button: '#ffd23f',
      'on-button': '#1a1033',
      mystery: '#ffd23f',
      done: '#8f80b8',
      focus: '#ffd23f'
    },
    fonts: { sans: "'Rubik', system-ui, sans-serif", display: "'Bungee', sans-serif", displayWeight: 400, hand: HAND }
  },
  notebook: {
    id: 'notebook',
    name: { en: 'Notebook', nl: 'Notitieboek' },
    headwear: 'bow',
    colors: {
      desk: '#ece6da',
      glow: '#ece6da',
      leather: '#8f8a7c',
      paper: '#fdfcf7',
      'paper-deep': '#f2efe4',
      note: '#fff1a8',
      ink: '#2b2b33',
      'ink-soft': '#5d5d6b',
      cream: '#2b2b33',
      'cream-soft': '#55555f',
      'desk-alert': '#b8322a',
      wax: '#b8322a',
      'wax-deep': '#8f241e',
      gold: '#ffe98a',
      quill: '#2c4f9e',
      'on-cream': '#fdfcf7',
      'on-wax': '#fffaf0',
      'on-gold': '#2b2b33',
      button: '#2b2b33',
      'on-button': '#fdfcf7',
      mystery: '#6b5420',
      done: '#73727c',
      focus: '#2c4f9e'
    },
    fonts: { sans: NUNITO, display: HAND, displayWeight: 700, hand: HAND }
  }
}

export const ALL_THEMES = Object.keys(THEMES) as ThemeId[]

/** The theme to use: the asked one if it exists, else the spellbook every book started as. */
export const themeFor = (id: unknown): ThemeId => (ALL_THEMES.includes(id as ThemeId) ? (id as ThemeId) : 'magic')

/** Puts a theme on the page: its colours and fonts as CSS variables, its name for the shape rules. */
export function applyTheme(id: ThemeId, root: HTMLElement = document.documentElement): void {
  const { colors, fonts } = THEMES[id]
  root.dataset.theme = id
  for (const [name, value] of Object.entries(colors)) root.style.setProperty(`--color-${name}`, value)
  root.style.setProperty('--font-sans', fonts.sans)
  root.style.setProperty('--font-fell', fonts.display)
  root.style.setProperty('--font-hand', fonts.hand)
  root.style.setProperty('--display-weight', String(fonts.displayWeight))
}

/** A subject's colour as text on this theme's pages. */
export const subjectInkFor = (color: string, id: ThemeId): string => subjectInk(color, THEMES[id].colors.paper, THEMES[id].colors.ink)
