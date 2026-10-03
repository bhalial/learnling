import { join } from 'node:path'
import { BrowserWindow, session } from 'electron'
import type { MagisterSync } from '../renderer/src/types'

// Magister has no public API. Learnling only ever *reads*, and it does so the way
// the Magister web app itself does: inside a real Magister page, with the token
// that page keeps in sessionStorage. Her login lives in this persistent session;
// no password ever passes through Learnling.
const PARTITION = 'persist:magister'
const ACCOUNTS = 'accounts.magister.net'

/**
 * How long her login cookies are kept across app restarts. Magister ends the
 * session on its own side within hours to a day, so this only bridges restarts.
 */
const REMEMBER_DAYS = 30

/** Quiets the passkey prompt on Magister's login page (see preload/magister.ts). */
const PRELOAD = join(__dirname, '../preload/magister.js')

const log = (...parts: unknown[]): void => console.log('[magister]', ...parts)
const withoutQuery = (url: string): string => url.split(/[?#]/)[0]

function magisterSession(): Electron.Session {
  const ses = session.fromPartition(PARTITION)
  // An honest Chrome user agent without the Electron token keeps school sign-in pages happy.
  ses.setUserAgent(ses.getUserAgent().replace(/\s(Electron|learnling)\/\S+/g, ''))
  return ses
}

function magisterWindow(show: boolean, parent?: BrowserWindow): BrowserWindow {
  const win = new BrowserWindow({
    width: 1000,
    height: 760,
    show,
    parent,
    title: 'Magister',
    autoHideMenuBar: true,
    webPreferences: { session: magisterSession(), preload: PRELOAD, backgroundThrottling: false }
  })
  // School sign-ins (Microsoft, Entree) sometimes open a popup; keep it in the same session.
  win.webContents.setWindowOpenHandler(() => ({
    action: 'allow',
    overrideBrowserWindowOptions: { autoHideMenuBar: true, webPreferences: { session: magisterSession(), preload: PRELOAD } }
  }))
  return win
}

/** Magister's login screens; the OIDC endpoints under /connect/ only bounce back. */
function isLoginPage(url: string): boolean {
  try {
    const { host, pathname } = new URL(url)
    return host === ACCOUNTS && !pathname.startsWith('/connect/')
  } catch {
    return false
  }
}

/**
 * Magister's login cookie only lives as long as the app runs. Rewriting the
 * accounts cookies with an expiry date keeps her logged in across restarts,
 * until Magister itself ends the session.
 */
async function rememberLogin(): Promise<void> {
  const ses = magisterSession()
  const cookies = await ses.cookies.get({ domain: ACCOUNTS })
  const until = Date.now() / 1000 + REMEMBER_DAYS * 86_400
  for (const cookie of cookies) {
    if (!cookie.session) continue
    await ses.cookies
      .set({
        url: `https://${cookie.domain?.replace(/^\./, '') ?? ACCOUNTS}${cookie.path ?? '/'}`,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.hostOnly ? undefined : cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expirationDate: until
      })
      .catch((error: Error) => log('could not keep cookie', cookie.name, error.message))
  }
  await ses.cookies.flushStore()
  log('login remembered,', cookies.filter((c) => c.session).length, 'session cookies kept')
}

/** True once Magister's own code holds a token that is good for at least another minute. */
const TOKEN_READY = `(() => {
  const key = Object.keys(sessionStorage).find((k) => k.startsWith('oidc.user'))
  if (!key) return false
  const user = JSON.parse(sessionStorage.getItem(key))
  return Boolean(user && user.access_token && user.expires_at * 1000 > Date.now() + 60000)
})()`

const schoolOf = (url: string): string | null => {
  try {
    const host = new URL(url).host
    return host.endsWith('.magister.net') && host !== ACCOUNTS ? host : null
  } catch {
    return null
  }
}

async function tokenReady(win: BrowserWindow): Promise<boolean> {
  if (win.isDestroyed() || !schoolOf(win.webContents.getURL())) return false
  return win.webContents.executeJavaScript(TOKEN_READY).catch(() => false)
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Loads the school's Magister in a hidden window and waits for a usable token.
 * A hidden window never shows the login page: if Magister wants her to log in,
 * the navigation is stopped and `login` says so. Nothing pops up behind her back.
 */
async function openSchool(school: string, seconds: number): Promise<{ win: BrowserWindow; ready: boolean; login: boolean }> {
  const win = magisterWindow(false)
  let login = false
  const guard = (event: Electron.Event<{ url: string; isMainFrame: boolean }>): void => {
    if (!event.isMainFrame || !isLoginPage(event.url)) return
    login = true
    event.preventDefault()
  }
  win.webContents.on('will-redirect', guard)
  win.webContents.on('will-navigate', guard)
  win.webContents.on('did-navigate', (_event, url) => log('hidden →', withoutQuery(url)))
  await win.loadURL(`https://${school}/magister/`).catch(() => undefined)
  let ready = false
  for (let i = 0; i < seconds && !ready && !login; i++) {
    ready = await tokenReady(win)
    if (!ready) await sleep(1000)
  }
  if (login) log('hidden: Magister wants a fresh login; stopped before the login page')
  return { win, ready, login }
}

/**
 * Opens the real Magister login: straight at her school when it is known, else
 * at the school search. Resolves with the school's host once she is in, or null
 * when she gives up. Closing the window after logging in still counts: the
 * school seen on the way is then checked in the background.
 */
export function connect(parent: BrowserWindow, knownSchool?: string): Promise<string | null> {
  const start = knownSchool && /^[a-z0-9-]+\.magister\.net$/i.test(knownSchool) ? `https://${knownSchool}/magister/` : `https://${ACCOUNTS}/`
  return new Promise((resolve) => {
    const win = magisterWindow(true, parent)
    // Some logins finish in a popup rather than in the window we opened.
    const popups: BrowserWindow[] = []
    let school: string | null = knownSchool ?? null
    let done = false

    const finish = async (found: string | null): Promise<void> => {
      if (done) return
      done = true
      clearInterval(poll)
      for (const popup of popups) if (!popup.isDestroyed()) popup.close()
      if (!win.isDestroyed()) win.close()
      if (found) await rememberLogin()
      log('connect finished:', found ?? 'no school')
      resolve(found)
    }

    const seen = (url: string): void => {
      log('login →', withoutQuery(url))
      school = schoolOf(url) ?? school
    }
    win.webContents.on('did-navigate', (_event, url) => seen(url))
    win.webContents.on('did-navigate-in-page', (_event, url) => seen(url))
    win.webContents.on('did-create-window', (popup) => {
      log('popup opened')
      popups.push(popup)
      popup.webContents.on('did-navigate', (_event, url) => seen(url))
    })

    const poll = setInterval(async () => {
      for (const candidate of [win, ...popups]) {
        if (await tokenReady(candidate)) return void finish(schoolOf(candidate.webContents.getURL()))
      }
    }, 1000)

    win.on('closed', async () => {
      if (done) return
      clearInterval(poll)
      // She may have closed the window right after logging in; see whether the school lets us in.
      if (school) {
        log('window closed; checking', school, 'in the background')
        const { win: hidden, ready } = await openSchool(school, 15)
        hidden.destroy()
        void finish(ready ? school : null)
      } else {
        void finish(null)
      }
    })

    void win.loadURL(start)
  })
}

/** Forgets her Magister login on this computer. */
export async function disconnect(): Promise<void> {
  await magisterSession().clearStorageData()
}

/**
 * Reads lessons, homework and tests for [from, to] in a hidden Magister page.
 * When the stored login has expired, it says so instead of showing anything.
 */
export async function sync(school: string, from: string, to: string): Promise<MagisterSync> {
  if (!/^[a-z0-9-]+\.magister\.net$/i.test(school)) return { ok: false, reason: 'error', message: 'Unknown school address' }

  const { win, ready, login } = await openSchool(school, 30)
  try {
    if (!ready) {
      log('no token;', login ? 'login needed' : 'no answer')
      return login ? { ok: false, reason: 'login' } : { ok: false, reason: 'error', message: 'Magister did not answer' }
    }

    const script = `(async () => { try {
      const key = Object.keys(sessionStorage).find((k) => k.startsWith('oidc.user'))
      const token = JSON.parse(sessionStorage.getItem(key)).access_token
      const get = async (path) => {
        const response = await fetch(path, { headers: { Authorization: 'Bearer ' + token } })
        if (!response.ok) throw new Error(path.split('?')[0] + ' ' + response.status)
        return response.json()
      }
      const account = await get('/api/account')
      let student = { id: account.Persoon.Id, name: account.Persoon.Roepnaam || '' }
      // A parent account sees its children; a student account has none and reads its own agenda.
      try {
        const children = await get('/api/personen/' + student.id + '/kinderen')
        if (children.Items && children.Items.length) student = { id: children.Items[0].Id, name: children.Items[0].Roepnaam || '' }
      } catch (error) {}
      const agenda = await get('/api/personen/' + student.id + '/afspraken?status=1&van=' + ${JSON.stringify(from)} + '&tot=' + ${JSON.stringify(to)})
      return {
        ok: true,
        student,
        items: (agenda.Items || []).map((item) => ({
          id: item.Id,
          start: item.Start,
          hour: item.LesuurVan,
          type: item.Type,
          status: item.Status,
          infoType: item.InfoType,
          html: item.Inhoud,
          subjects: (item.Vakken || []).map((subject) => ({ id: subject.Id, name: subject.Naam }))
        }))
      }
    } catch (error) {
      const message = String((error && error.message) || error)
      return { ok: false, reason: / 401$/.test(message) ? 'login' : 'error', message }
    } })()`

    const result: MagisterSync = await win.webContents.executeJavaScript(script)
    log('sync', result.ok ? `${result.items.length} items` : `failed: ${result.message ?? result.reason}`)
    if (result.ok) await rememberLogin()
    return result
  } catch (error) {
    return { ok: false, reason: 'error', message: error instanceof Error ? error.message : String(error) }
  } finally {
    if (!win.isDestroyed()) win.destroy()
  }
}
