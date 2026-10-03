import type { SpellbookApi } from './index'

declare global {
  interface Window {
    spellbook: SpellbookApi
  }
}

export {}
