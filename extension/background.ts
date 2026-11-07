import { todayIso } from '../src/renderer/src/lib/dates'
import { reminderDue } from '../src/renderer/src/lib/reminder'
import type { SpellbookData } from '../src/renderer/src/types'
import { ensureContentScript, readAgenda, schoolOf, storedToken, tokenKey } from './agenda'
import { closedReminder, readRange } from './remind'

// The extension's service worker. Chrome wakes it for the toolbar button, a click on a
// notification, the minute alarm and a Magister token, and puts it to sleep again soon after.

const APP = chrome.runtime.getURL('app.html')
const BOOK = 'book'
const TICK = 'tick'

/** The book's open pages, in whatever window. */
async function bookPages(): Promise<chrome.runtime.ExtensionContext[]> {
  const pages = await chrome.runtime.getContexts({ contextTypes: [chrome.runtime.ContextType.TAB] })
  return pages.filter((page) => page.documentUrl?.startsWith(APP))
}

/** Brings the book to the front, or opens it in a window of its own. */
async function openBook(): Promise<void> {
  const [page] = await bookPages()
  if (page && page.windowId >= 0) {
    const win = await chrome.windows.get(page.windowId)
    await chrome.windows.update(page.windowId, win.state === 'minimized' ? { state: 'maximized', focused: true } : { focused: true })
    return
  }
  await chrome.windows.create({ url: APP, type: 'popup', state: 'maximized' })
}

/** Alarms usually survive a restart of Chrome, but not always. */
async function ensureTick(): Promise<void> {
  if (!(await chrome.alarms.get(TICK))) await chrome.alarms.create(TICK, { periodInMinutes: 1 })
}

/**
 * Every minute: the after-school reminder, when the book is closed. An open book reminds by
 * itself (main.tsx). Magister is read only with a login at hand: from the background no
 * Magister tab ever opens.
 */
async function tick(): Promise<void> {
  if ((await bookPages()).length) return
  const book = (await chrome.storage.local.get(BOOK))[BOOK] as SpellbookData | undefined
  if (!book) return
  const now = new Date()
  const today = todayIso(now)
  if (!reminderDue(book.reminder, today, now)) return

  const token = book.magister ? await storedToken(book.magister.school) : null
  const { from, to } = readRange(book, today)
  const agenda = token && book.magister ? await readAgenda(book.magister.school, token.token, from, to) : null
  const result = closedReminder(book, now, agenda, () => crypto.randomUUID())
  if (!result) return
  await chrome.storage.local.set({ [BOOK]: result.book })
  if (result.message) await chrome.notifications.create({ type: 'basic', iconUrl: 'icon-128.png', title: result.message.title, message: result.message.body })
}

chrome.action.onClicked.addListener(() => void openBook())
chrome.notifications.onClicked.addListener((id) => {
  void chrome.notifications.clear(id)
  void openBook()
})

chrome.runtime.onInstalled.addListener(({ reason }) => {
  void ensureTick()
  void ensureContentScript()
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) void openBook()
})
chrome.runtime.onStartup.addListener(() => {
  void ensureTick()
  void ensureContentScript()
})
chrome.permissions.onAdded.addListener(() => void ensureContentScript())

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === TICK) void tick().catch((error: unknown) => console.error('reminder failed:', error))
})

// content.ts hands over Magister's token; it is kept in memory only (storage.session),
// under the school the page really came from, not the one the message names.
chrome.runtime.onMessage.addListener((message: { type?: string; token?: unknown; expiresAt?: unknown }, sender) => {
  if (message?.type !== 'magister-token' || sender.id !== chrome.runtime.id || !sender.url) return
  const school = schoolOf(sender.url)
  if (!school || typeof message.token !== 'string' || typeof message.expiresAt !== 'number') return
  void chrome.storage.session.set({ [tokenKey(school)]: { token: message.token, expiresAt: message.expiresAt } })
})
