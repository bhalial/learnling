import type { Lang } from '../types'

export interface News {
  /** The version that brought it. */
  version: string
  /** What the companion says about it. */
  text: Record<Lang, string>
  /** The Settings section "Show me" opens at (its id is `settings-<section>`). */
  settings?: string
}

/**
 * What a version brings that is worth a word from the companion, newest first. Only what the
 * student would otherwise never find: a new setting, a new way to do something.
 */
export const NEWS: News[] = [
  {
    version: '0.5.1',
    text: {
      en: 'New: you can look further ahead in your planner, and choose how many days you practise for a test.',
      nl: 'Nieuw: je kunt nu verder vooruitkijken in je planner, en kiezen hoeveel dagen je oefent voor een toets.'
    },
    settings: 'ahead'
  }
]

/** Whether version `a` comes after `b`, number by number: 0.5.10 after 0.5.9. */
export function newer(a: string, b: string): boolean {
  const [x, y] = [a, b].map((v) => v.split('.').map((n) => Number.parseInt(n, 10) || 0))
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0)
  }
  return false
}

/**
 * The news for a book that last heard that of `seen`, in an app at `current`: the newest item
 * after `seen` that this app already has, or null. A book from before there was news (no
 * `seen`) hears the newest item; a book that skipped several versions only the newest one.
 */
export function newsFor(seen: string | undefined, current: string, news: News[] = NEWS): News | null {
  return news.find((item) => !newer(item.version, current) && (!seen || newer(item.version, seen))) ?? null
}
