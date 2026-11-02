import type { MagisterSync } from '../src/renderer/src/types'
import { ACCOUNTS, MAGISTER, SCHOOL, ensureContentScript, forgetTokens, readAgenda, removeContentScript, schoolOf, storedToken, tokenKey, type Token } from './agenda'

// Magister in the Chrome extension, the counterpart of src/main/magister.ts. Learnling only
// ever reads, with the token Magister's own page keeps (content.ts hands it over). The login
// is the browser's own; no password ever passes through Learnling.

const log = (...parts: unknown[]): void => console.log('[magister]', ...parts)

/** Magister's login screens; the OIDC endpoints under /connect/ only bounce back. */
function isLoginPage(url: string): boolean {
  try {
    const { host, pathname } = new URL(url)
    return host === ACCOUNTS && !pathname.startsWith('/connect/')
  } catch {
    return false
  }
}

/** Resolves with the school's token as soon as content.ts has handed one over, or null after `seconds`. */
function tokenWithin(school: string | null, seconds: number): { found: Promise<{ school: string; token: Token } | null>; stop: () => void } {
  let stop = (): void => undefined
  const found = new Promise<{ school: string; token: Token } | null>((resolve) => {
    const listener = (changes: Record<string, chrome.storage.StorageChange>): void => {
      for (const [key, change] of Object.entries(changes)) {
        const from = key.startsWith('magister:') ? key.slice('magister:'.length) : null
        if (from && change.newValue && (!school || from === school)) return done({ school: from, token: change.newValue as Token })
      }
    }
    const timer = setTimeout(() => done(null), seconds * 1000)
    const done = (result: { school: string; token: Token } | null): void => {
      stop()
      resolve(result)
    }
    stop = () => {
      clearTimeout(timer)
      chrome.storage.session.onChanged.removeListener(listener)
    }
    chrome.storage.session.onChanged.addListener(listener)
  })
  return { found, stop }
}

/**
 * Lets the school's Magister page renew the login in a tab in the background, the way the
 * Windows app uses a hidden window. When Magister wants a fresh login the tab is closed before
 * the login page shows: nothing asks for a password behind the user's back.
 */
async function freshToken(school: string, seconds: number): Promise<{ token: Token | null; login: boolean }> {
  const known = await storedToken(school)
  if (known) return { token: known, login: false }

  const wait = tokenWithin(school, seconds)
  const url = `https://${school}/magister/`
  // In a window of the person's own, not in the book's window, which has room for one tab only.
  const normal = await chrome.windows.getLastFocused({ windowTypes: ['normal'] }).catch(() => null)
  const tab = normal?.id
    ? await chrome.tabs.create({ url, windowId: normal.id, active: false })
    : (await chrome.windows.create({ url, state: 'minimized', focused: false }))?.tabs?.[0]
  if (!tab?.id) {
    wait.stop()
    return { token: null, login: false }
  }
  const tabId = tab.id

  let login = false
  let watch: (id: number, info: chrome.tabs.OnUpdatedInfo) => void = () => undefined
  const loginPage = new Promise<null>((resolve) => {
    watch = (id, info) => {
      if (id !== tabId || !info.url || !isLoginPage(info.url)) return
      login = true
      resolve(null)
    }
    chrome.tabs.onUpdated.addListener(watch)
  })

  const found = await Promise.race([wait.found, loginPage])
  wait.stop()
  chrome.tabs.onUpdated.removeListener(watch)
  await chrome.tabs.remove(tabId).catch(() => undefined)
  if (login) log('background: Magister wants a fresh login; closed before the login page')
  return { token: found?.token ?? null, login }
}

/**
 * Opens the real Magister login in a window of its own: straight at the school when it is
 * known, else at the school search. Resolves with the school's host once logged in, or null
 * when the user gives up. Closing the window after logging in still counts.
 */
export function connect(knownSchool?: string): Promise<string | null> {
  // First of all, while the click still counts: Chrome only asks for a permission on a click.
  const allowed = chrome.permissions.request({ origins: MAGISTER })
  return allowed.then(async (granted) => {
    if (!granted) return null
    await ensureContentScript()
    const school = knownSchool && SCHOOL.test(knownSchool) ? knownSchool : undefined
    if (school && (await storedToken(school))) return school
    return login(school)
  })
}

async function login(knownSchool?: string): Promise<string | null> {
  const start = knownSchool ? `https://${knownSchool}/magister/` : `https://${ACCOUNTS}/`
  const wait = tokenWithin(null, 15 * 60)
  const win = await chrome.windows.create({ url: start, type: 'popup', width: 1000, height: 760, focused: true })
  if (!win?.id) {
    wait.stop()
    return null
  }
  const windowId = win.id
  const ours = new Set((win.tabs ?? []).flatMap((tab) => (tab.id ? [tab.id] : [])))
  let school: string | null = knownSchool ?? null
  let closed = false

  // School sign-ins (Microsoft, Entree) sometimes open a popup; it is closed along with the login.
  const opened = (tab: chrome.tabs.Tab): void => {
    if (tab.id && tab.openerTabId && ours.has(tab.openerTabId)) ours.add(tab.id)
  }
  const seen = (id: number, info: chrome.tabs.OnUpdatedInfo): void => {
    if (!ours.has(id) || !info.url) return
    log('login →', info.url.split(/[?#]/)[0])
    school = schoolOf(info.url) ?? school
  }
  let removed: (id: number) => void = () => undefined
  const gone = new Promise<null>((resolve) => {
    removed = (id) => {
      if (id !== windowId) return
      closed = true
      resolve(null)
    }
  })
  chrome.windows.onRemoved.addListener(removed)
  chrome.tabs.onCreated.addListener(opened)
  chrome.tabs.onUpdated.addListener(seen)

  const result = await Promise.race([wait.found, gone])
  wait.stop()
  chrome.windows.onRemoved.removeListener(removed)
  chrome.tabs.onCreated.removeListener(opened)
  chrome.tabs.onUpdated.removeListener(seen)
  for (const id of ours) await chrome.tabs.remove(id).catch(() => undefined)

  if (result) {
    log('connect finished:', result.school)
    return result.school
  }
  // The window may have been closed right after logging in; see whether the school lets us in.
  if (closed && school) {
    log('window closed; checking', school, 'in the background')
    const { token } = await freshToken(school, 15)
    return token ? school : null
  }
  return null
}

/** Forgets the Magister link: the tokens, the content script and the permission. */
export async function disconnect(): Promise<void> {
  await forgetTokens()
  await removeContentScript()
  await chrome.permissions.remove({ origins: MAGISTER })
}

/**
 * Reads lessons, homework and tests for [from, to]. When the login has expired, it says so
 * instead of showing anything.
 */
export async function sync(school: string, from: string, to: string): Promise<MagisterSync> {
  if (!SCHOOL.test(school)) return { ok: false, reason: 'error', message: 'Unknown school address' }
  if (!(await chrome.permissions.contains({ origins: MAGISTER }))) return { ok: false, reason: 'login' }
  await ensureContentScript()

  const { token, login } = await freshToken(school, 30)
  if (!token) {
    log('no token;', login ? 'login needed' : 'no answer')
    return login ? { ok: false, reason: 'login' } : { ok: false, reason: 'error', message: 'Magister did not answer' }
  }
  const result = await readAgenda(school, token.token, from, to)
  log('sync', result.ok ? `${result.items.length} items` : `failed: ${result.message ?? result.reason}`)
  // A refused token is no use any more.
  if (!result.ok && result.reason === 'login') await chrome.storage.session.remove(tokenKey(school))
  return result
}
