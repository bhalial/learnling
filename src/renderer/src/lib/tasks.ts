import type { IsoDate, Kind, Task } from '../types'
import { addDays, isSchoolDay } from './dates'
import { isVague } from './text'

/** How many training rounds a trial gets before its date. */
export const TRAINING_ROUNDS: Partial<Record<Kind, number>> = { test: 3, quiz: 2 }

/** Kinds that land on the day she adds them, because she does homework the same day. */
const SAME_DAY: Kind[] = ['homework', 'learn', 'read']

export const isTrial = (kind: Kind): boolean => kind === 'test' || kind === 'quiz'

export const isDone = (task: Task): boolean => Boolean(task.own.doneAt)

/** Trials sit on their date; everything else on the day she planned it, or its due day. */
export function shownOn(task: Task): IsoDate {
  return isTrial(task.given.kind) ? task.given.due : (task.own.plan ?? task.given.due)
}

/**
 * Work that was set without saying what, and that she has not deciphered yet.
 * From Magister that includes a short line that only points to Teams.
 */
export function isMystery(task: Task): boolean {
  const { kind, text, gone } = task.given
  if (isTrial(kind) || kind === 'study' || gone || task.own.note?.trim()) return false
  return task.origin === 'magister' ? isVague(text) : !text.trim()
}

/** Her words win over the given text. */
export const wording = (task: Task): string => task.own.note?.trim() || task.given.text

/** Where a freshly added task goes: today for same-day kinds, otherwise its due day. */
export function initialPlan(kind: Kind, due: IsoDate, today: IsoDate, windowFrom: IsoDate): IsoDate | undefined {
  return SAME_DAY.includes(kind) && today < due && today >= windowFrom ? today : undefined
}

/**
 * The days to train on before a trial: the last school days before it, topped
 * up with weekend days when the week runs out (a Monday test seen on Saturday).
 */
export function trainingDays(due: IsoDate, today: IsoDate, rounds: number): IsoDate[] {
  const candidates: IsoDate[] = []
  for (let day = today; day < due; day = addDays(day, 1)) candidates.push(day)

  const picked = candidates.filter(isSchoolDay).slice(-rounds)
  if (picked.length < rounds) {
    const weekend = candidates.filter((day) => !isSchoolDay(day))
    picked.push(...weekend.slice(-(rounds - picked.length)))
  }
  return picked.sort()
}

/**
 * Rebuilds the training rounds of one task after it was added or changed.
 * Finished rounds are kept (she earned those ticks); open ones are planned
 * anew. A task that is no longer a trial loses its open rounds.
 */
export function retrain(tasks: Task[], test: Task, today: IsoDate, uid: () => string, now: string): Task[] {
  const rest = tasks.filter((task) => task.parentId !== test.id)
  if (!isTrial(test.given.kind)) return rest

  const kept = tasks.filter((task) => task.parentId === test.id && isDone(task))
  const wanted = TRAINING_ROUNDS[test.given.kind] ?? 0
  const days = trainingDays(test.given.due, today, Math.max(0, wanted - kept.length))
  const total = kept.length + days.length
  const { subjectId, due } = test.given

  const keptRounds = kept.map((task, i) => ({
    ...task,
    given: { ...task.given, subjectId, due, round: { n: i + 1, of: total } }
  }))
  const freshRounds = days.map((day, i): Task => ({
    id: uid(),
    origin: 'self',
    parentId: test.id,
    given: { subjectId, kind: 'study', text: '', due, round: { n: kept.length + i + 1, of: total } },
    own: { plan: day },
    createdAt: now
  }))

  return [...rest, ...keptRounds, ...freshRounds]
}

/** Unfinished work whose day has passed. Training for a trial that is over is moot. */
export function needsAttention(tasks: Task[], today: IsoDate): Task[] {
  const byId = new Map(tasks.map((task) => [task.id, task]))
  return tasks
    .filter((task) => {
      if (isDone(task) || task.given.gone || isTrial(task.given.kind) || shownOn(task) >= today) return false
      if (!task.parentId) return true
      const parent = byId.get(task.parentId)
      return Boolean(parent && parent.given.due > today)
    })
    .sort((a, b) => shownOn(a).localeCompare(shownOn(b)))
}

/** Trials, then the rest in the order she added them. */
export function dayOrder(a: Task, b: Task): number {
  const trial = Number(isTrial(b.given.kind)) - Number(isTrial(a.given.kind))
  return trial || a.createdAt.localeCompare(b.createdAt)
}

export function progress(tasks: Task[], from: IsoDate): { done: number; total: number } {
  const to = addDays(from, 6)
  const week = tasks.filter((task) => !isTrial(task.given.kind) && !task.given.gone && shownOn(task) >= from && shownOn(task) <= to)
  return { done: week.filter(isDone).length, total: week.length }
}
