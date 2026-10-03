import type { Dict } from '../i18n'
import type { SyncState } from '../store'
import type { IsoDate, SpellbookData } from '../types'
import { nudge } from './cat'
import { isSchoolDay } from './dates'

/** "HH:MM" on the local clock, the same shape as the chosen time. */
export const clockTime = (now: Date): string => `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

/**
 * Whether the after-school reminder should go out now: once per school day, at the
 * chosen time or the first moment after it (the laptop may have been asleep at 16:00).
 */
export function reminderDue(reminder: SpellbookData['reminder'], today: IsoDate, now: Date): boolean {
  return reminder.enabled && reminder.lastSent !== today && isSchoolDay(today) && clockTime(now) >= reminder.time
}

/**
 * What the reminder says, from the companion. Without a fresh Magister login there is
 * no fresh homework, so that comes first. Nothing waiting: null, and no message.
 */
export function reminderMessage(data: SpellbookData, today: IsoDate, sync: SyncState, t: Dict): { title: string; body: string } | null {
  const body = sync.state === 'login' ? t.cat.login : nudge(data, today, t)
  return body ? { title: data.companion.name || 'Learnling', body } : null
}
