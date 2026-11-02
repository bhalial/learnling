/**
 * Runs on a school's Magister pages once Magister is connected (agenda.ts registers it).
 * Magister's own code keeps its login in sessionStorage; as soon as it holds a token that is
 * good for another minute, this hands it to the extension. It reads nothing else on the page.
 */
const MINUTE = 60_000

function currentToken(): { token: string; expiresAt: number } | null {
  const key = Object.keys(sessionStorage).find((k) => k.startsWith('oidc.user'))
  if (!key) return null
  try {
    const user = JSON.parse(sessionStorage.getItem(key) ?? 'null') as { access_token?: string; expires_at?: number } | null
    if (!user?.access_token || !user.expires_at || user.expires_at * 1000 <= Date.now() + MINUTE) return null
    return { token: user.access_token, expiresAt: user.expires_at * 1000 }
  } catch {
    return null
  }
}

let handed: string | null = null
let looks = 0

// Every second while the page logs in, then once a minute to catch Magister's own renewals.
const look = (): void => {
  const found = currentToken()
  if (found && found.token !== handed) {
    handed = found.token
    chrome.runtime.sendMessage({ type: 'magister-token', ...found }).catch(() => undefined)
  }
  looks++
  setTimeout(look, looks < 60 ? 1000 : MINUTE)
}
look()
