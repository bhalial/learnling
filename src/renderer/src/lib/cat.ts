import { VOICES } from '../companions/voices'
import type { Dict } from '../i18n'
import type { Reaction, SyncState } from '../store'
import type { IsoDate, SpellbookData } from '../types'
import { addDays, daysBetween, windowStart } from './dates'
import { isDone, isMystery, isTrial, needsAttention, shownOn } from './tasks'

/** Spells still open for a day. */
export function openOn(data: SpellbookData, day: IsoDate): number {
  return data.tasks.filter((task) => shownOn(task) === day && !isTrial(task.given.kind) && !task.given.gone && !isDone(task)).length
}

/**
 * The most useful thing the cat can say right now, or null when all is well.
 * Shared by the note in the book and the after-school notification.
 */
export function nudge(data: SpellbookData, today: IsoDate, t: Dict): string | null {
  const subjectName = (id: string): string => data.subjects.find((s) => s.id === id)?.name ?? ''

  const end = addDays(windowStart(today), 13)
  const mystery = data.tasks.find((task) => isMystery(task) && !isDone(task) && shownOn(task) <= end)
  if (mystery) return t.cat.mystery(subjectName(mystery.given.subjectId))

  const late = needsAttention(data.tasks, today)
  if (late.length) return t.cat.late(late.length)

  const soon = data.tasks
    .filter((task) => isTrial(task.given.kind) && !task.given.gone && task.given.due >= today && daysBetween(today, task.given.due) <= 3)
    .sort((a, b) => a.given.due.localeCompare(b.given.due))[0]
  if (soon) return t.cat.trialSoon(subjectName(soon.given.subjectId), t.kinds[soon.given.kind], t.inDays(daysBetween(today, soon.given.due)))

  const open = openOn(data, today)
  if (open) return t.cat.left(open)
  return null
}

/** One of `lines`, the same one for as long as `seed` stays the same. */
const pick = (lines: string[], seed: number): string => lines[Math.abs(Math.floor(seed)) % lines.length]

/**
 * What the cat says in the book: a fresh reaction first, then setup, then the nudge. A
 * reaction and the all-done line take turns between the theme's words and the animal's own
 * (companions/voices.ts); what needs doing is always said in the theme's plain words.
 */
export function catLine(
  data: SpellbookData,
  today: IsoDate,
  reaction: Reaction | null,
  sync: SyncState,
  t: Dict
): { text: string; setup?: boolean } {
  const voice = VOICES[data.companion.species][data.lang]
  if (reaction) {
    // A reaction's moment picks the line, so it holds while the note is up and differs the next time.
    if (reaction.kind === 'yay') {
      const left = openOn(data, today)
      return { text: pick([t.cat.yay(left), ...voice.yay.map((cheer) => `${cheer} ${t.cat.yayRest(left)}`)], reaction.at) }
    }
    if (reaction.kind === 'synced') return { text: t.cat.synced(reaction.n ?? 0) }
    if (reaction.kind === 'tooLate') return { text: t.cat.tooLate }
    return { text: pick([t.cat[reaction.kind], ...voice[reaction.kind]], reaction.at) }
  }
  if (sync.state === 'login') return { text: t.cat.login }

  const noTimetable = Object.values(data.timetable).every((day) => day.length === 0)
  if (noTimetable && !data.magister) return { text: t.cat.setup, setup: true }

  const line = nudge(data, today, t)
  if (line) return { text: line }
  // The all-done line changes from day to day, not while you look at it.
  if (data.tasks.length) return { text: pick([t.cat.clear, ...voice.clear], daysBetween('2026-01-01', today)) }
  return { text: t.cat.empty }
}
