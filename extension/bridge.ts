import type { Boot, SpellbookData } from '../src/renderer/src/types'
import * as magister from './magister'

// window.spellbook for the Chrome extension: the same calls the Windows app's preload offers
// (src/preload/index.ts), done with Chrome's own APIs. The book itself is the very same code.

// Development switches in the page's address, like SPELLBOOK_* in the Windows app:
//   app.html?demo=1             fill the book with sample homework (never saved)
//   app.html?demo=empty         start with an empty book (never saved)
//   &today=2026-09-30           pretend it is that day
//   &theme=garden&lang=nl       open the book in that theme and language
const params = new URLSearchParams(location.search)
const demo = params.get('demo')

/** Where the book is kept; background.ts reads the same key for reminders. */
const BOOK = 'book'

/** This page's own tab, for zooming it alone. */
const ownTab = chrome.tabs.getCurrent().then(async (tab) => {
  if (tab?.id === undefined) return null
  await chrome.tabs.setZoomSettings(tab.id, { mode: 'automatic', scope: 'per-tab' })
  return tab.id
})

const store = (data: SpellbookData): Promise<void> => (demo ? Promise.resolve() : chrome.storage.local.set({ [BOOK]: data }))

// The preload's own type (src/preload/index.d.ts), so the two can never drift apart.
const spellbook: Window['spellbook'] = {
  async boot(): Promise<Boot> {
    const data = demo ? null : ((await chrome.storage.local.get(BOOK))[BOOK] ?? null)
    return { data, demo: demo === '1', today: params.get('today'), theme: params.get('theme'), lang: params.get('lang'), platform: 'extension' }
  },

  save: store,

  /** Chrome cannot save while blocking; the write is handed over before the page goes. */
  saveNow(data) {
    void store(data)
  },

  /** No tray and no starting with the computer: Chrome keeps the reminders going (background.ts). */
  async applySettings() {},

  zoom(factor) {
    void ownTab.then((id) => (id === null ? undefined : chrome.tabs.setZoom(id, factor)))
  },

  // The book's own steps (lib/zoom.ts), not Chrome's: the keys and Ctrl + wheel go through the book.
  onZoomKey(listener) {
    window.addEventListener('keydown', (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return
      const step = event.key === '=' || event.key === '+' ? 1 : event.key === '-' ? -1 : event.key === '0' ? 0 : null
      if (step === null) return
      event.preventDefault()
      listener(step)
    })
    // A touchpad pinch arrives as a stream of Ctrl + wheel events: one step per moment.
    let last = 0
    window.addEventListener(
      'wheel',
      (event) => {
        if (!event.ctrlKey) return
        event.preventDefault()
        if (event.timeStamp - last < 300) return
        last = event.timeStamp
        listener(event.deltaY < 0 ? 1 : -1)
      },
      { passive: false }
    )
  },

  async notify(title, body) {
    await chrome.notifications.create({ type: 'basic', iconUrl: 'icon-128.png', title, message: body })
  },

  magister: {
    connect: (school) => magister.connect(school),
    sync: (school, from, to) => magister.sync(school, from, to),
    disconnect: () => magister.disconnect()
  }
}

window.spellbook = spellbook
