import { wordsFor } from '../src/renderer/src/i18n'
import { todayIso } from '../src/renderer/src/lib/dates'
import { mergeSync, syncRange } from '../src/renderer/src/lib/magister'
import { reminderDue, reminderMessage } from '../src/renderer/src/lib/reminder'
import { DEFAULT_TRAINING } from '../src/renderer/src/lib/tasks'
import type { SyncState } from '../src/renderer/src/store'
import type { IsoDate, MagisterSync, SpellbookData } from '../src/renderer/src/types'

/**
 * The days a read covers, as the open book reads them (lib/magister.ts). The stored book has not
 * been through the open book's upgrade, so one from before the weeks setting reaches two.
 */
export const readRange = (book: SpellbookData, today: IsoDate): { from: IsoDate; to: IsoDate } => syncRange(today, book.weeks ?? 2)

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

  // A book from before training could be set plans tests the way it always did.
  let next: SpellbookData = { ...book, training: book.training ?? { ...DEFAULT_TRAINING }, reminder: { ...book.reminder, lastSent: today } }
  if (agenda?.ok && next.magister) {
    const stamp = now.toISOString()
    const outcome = mergeSync(next, agenda.items, readRange(next, today), today, uid, stamp)
    next = { ...outcome.data, magister: { ...outcome.data.magister!, studentName: agenda.student.name, lastSync: stamp } }
  }
  const sync: SyncState = agenda && !agenda.ok && agenda.reason === 'login' ? { state: 'login' } : { state: 'idle' }
  return { book: next, message: reminderMessage(next, today, sync, wordsFor(next.lang, next.theme)) }
}
