import type { ReactionKind } from '../store'
import type { IsoDate, SpellbookData } from '../types'
import { addDays, windowStart } from '../lib/dates'
import { isDone, isMystery, isTrial, shownOn } from '../lib/tasks'
import type { Mood } from './types'

/** How the companion answers each thing the student does. */
export const REACTION_MOOD: Record<ReactionKind, Mood> = {
  yay: 'happy',
  decoded: 'happy',
  dress: 'happy',
  added: 'happy',
  synced: 'happy',
  moved: 'talk',
  tooLate: 'talk',
  undo: 'talk'
}

/**
 * The mood between events: asleep at night, curious while a mystery scroll
 * waits, proud once today's page is done, otherwise just idle.
 */
export function restingMood(data: Pick<SpellbookData, 'tasks'>, today: IsoDate, hour: number): Mood {
  if (hour >= 21 || hour < 7) return 'sleep'
  const end = addDays(windowStart(today), 13)
  if (data.tasks.some((task) => isMystery(task) && !isDone(task) && shownOn(task) <= end)) return 'curious'
  const todays = data.tasks.filter((task) => shownOn(task) === today && !isTrial(task.given.kind) && !task.given.gone)
  if (todays.length && todays.every(isDone)) return 'proud'
  return 'idle'
}
