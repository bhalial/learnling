import { wordsFor } from '../src/renderer/src/i18n'
import { addDays, mondayOf, todayIso } from '../src/renderer/src/lib/dates'
import { mergeSync } from '../src/renderer/src/lib/magister'
import { reminderDue, reminderMessage } from '../src/renderer/src/lib/reminder'
import type { SyncState } from '../src/renderer/src/store'
import type { IsoDate, MagisterSync, SpellbookData } from '../src/renderer/src/types'

/** The days a read covers: this week and four more, as the open book reads them (store.ts). */
export function syncRange(today: IsoDate): { from: IsoDate; to: IsoDate } {
  const from = mondayOf(today)
  return { from, to: addDays(from, 34) }
}

/**
 * The after-school reminder while the book is closed: what main.tsx's remind() does, on
 * the stored book. `agenda` is a fresh Magister read when a login was at hand, else null.
 * Null when no reminder is due; otherwise the book to store and the message, if any.
 */
export function closedReminder(
  book: SpellbookData,
  now: Date,
  agenda: MagisterSync | null,
  uid: () => string
): { book: SpellbookData; message: { title: string; body: string } | null } | null {
  const today = todayIso(now)
  if (!reminderDue(book.reminder, today, now)) return null

  let next: SpellbookData = { ...book, reminder: { ...book.reminder, lastSent: today } }
  if (agenda?.ok && next.magister) {
    const stamp = now.toISOString()
    const outcome = mergeSync(next, agenda.items, syncRange(today), today, uid, stamp)
    next = { ...outcome.data, magister: { ...outcome.data.magister!, studentName: agenda.student.name, lastSync: stamp } }
  }
  const sync: SyncState = agenda && !agenda.ok && agenda.reason === 'login' ? { state: 'login' } : { state: 'idle' }
  return { book: next, message: reminderMessage(next, today, sync, wordsFor(next.lang, next.theme)) }
}
