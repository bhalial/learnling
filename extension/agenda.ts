import type { MagisterItem, MagisterSync } from '../src/renderer/src/types'

// What the book's page and the service worker both need to read Magister. The Windows app
// does the same reads inside a hidden Magister page (src/main/magister.ts); keep the two alike.

/** Asked for only when Magister is connected (optional_host_permissions in the manifest). */
export const MAGISTER = ['https://*.magister.net/*']
export const ACCOUNTS = 'accounts.magister.net'
export const SCHOOL = /^[a-z0-9-]+\.magister\.net$/i

const SCRIPT = 'magister'
const MINUTE = 60_000

export const schoolOf = (url: string): string | null => {
  try {
    const host = new URL(url).host
    return host.endsWith('.magister.net') && host !== ACCOUNTS ? host : null
  } catch {
    return null
  }
}

/** A token Magister's own page handed over (content.ts), kept in memory only. */
export interface Token {
  token: string
  /** Milliseconds, like Date.now(). */
  expiresAt: number
}

export const tokenKey = (school: string): string => `magister:${school}`

/** The school's token, if it is good for at least another minute. */
export async function storedToken(school: string): Promise<Token | null> {
  const key = tokenKey(school)
  const token = (await chrome.storage.session.get(key))[key] as Token | undefined
  return token && token.expiresAt > Date.now() + MINUTE ? token : null
}

export async function forgetTokens(): Promise<void> {
  const all = await chrome.storage.session.get(null)
  await chrome.storage.session.remove(Object.keys(all).filter((key) => key.startsWith('magister:')))
}

/** Puts content.ts on the schools' Magister pages, once Magister may be read. */
export async function ensureContentScript(): Promise<void> {
  if (!(await chrome.permissions.contains({ origins: MAGISTER }))) return
  const registered = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT] })
  if (registered.length) return
  await chrome.scripting.registerContentScripts([
    {
      id: SCRIPT,
      matches: MAGISTER,
      excludeMatches: [`https://${ACCOUNTS}/*`],
      js: ['content.js'],
      runAt: 'document_idle'
    }
  ])
}

export async function removeContentScript(): Promise<void> {
  await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT] }).catch(() => undefined)
}

interface Person {
  Id: number
  Roepnaam?: string
}

interface Appointment {
  Id: number
  Start: string
  LesuurVan: number | null
  Type: number
  Status: number
  InfoType: number
  Inhoud: string | null
  Vakken?: Array<{ Id: number; Naam: string }>
}

/** Reads lessons, homework and tests for [from, to] with the school's token. */
export async function readAgenda(school: string, token: string, from: string, to: string): Promise<MagisterSync> {
  const get = async <T>(path: string): Promise<T> => {
    const response = await fetch(`https://${school}${path}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) throw new Error(`${path.split('?')[0]} ${response.status}`)
    return response.json() as Promise<T>
  }
  try {
    const account = await get<{ Persoon: Person }>('/api/account')
    let student = { id: account.Persoon.Id, name: account.Persoon.Roepnaam || '' }
    // A parent account sees its children; a student account has none and reads its own agenda.
    try {
      const children = await get<{ Items?: Person[] }>(`/api/personen/${student.id}/kinderen`)
      if (children.Items?.length) student = { id: children.Items[0].Id, name: children.Items[0].Roepnaam || '' }
    } catch {
      // Not a parent.
    }
    const agenda = await get<{ Items?: Appointment[] }>(`/api/personen/${student.id}/afspraken?status=1&van=${from}&tot=${to}`)
    const items: MagisterItem[] = (agenda.Items ?? []).map((item) => ({
      id: item.Id,
      start: item.Start,
      hour: item.LesuurVan,
      type: item.Type,
      status: item.Status,
      infoType: item.InfoType,
      html: item.Inhoud,
      subjects: (item.Vakken ?? []).map((subject) => ({ id: subject.Id, name: subject.Naam }))
    }))
    return { ok: true, student, items }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, reason: / 401$/.test(message) ? 'login' : 'error', message }
  }
}
