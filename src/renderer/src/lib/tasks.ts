import type { IsoDate, Kind, Task, Training } from '../types'
import { addDays, isSchoolDay } from './dates'
import { isVague } from './text'

/** How many training rounds a trial gets before its date, until Settings say otherwise. */
export const DEFAULT_TRAINING: Training = { test: 3, quiz: 2 }

/** The most rounds Settings offer: two school weeks of practice. */
export const MAX_TRAINING = 10

export const clampTraining = (rounds: number): number => Math.min(MAX_TRAINING, Math.max(0, Math.round(rounds) || 0))

/** How many training rounds a task of this kind gets. */
export const roundsFor = (kind: Kind, training: Training): number => (kind === 'test' || kind === 'quiz' ? training[kind] : 0)

/** Kinds that land on the day they are added: homework is mostly done the same day. */
const SAME_DAY: Kind[] = ['homework', 'learn', 'read']

export const isTrial = (kind: Kind): boolean => kind === 'test' || kind === 'quiz'

export const isDone = (task: Task): boolean => Boolean(task.own.doneAt)

/** Trials sit on their date; everything else on the day it was planned for, or its due day. */
export function shownOn(task: Task): IsoDate {
  return isTrial(task.given.kind) ? task.given.due : (task.own.plan ?? task.given.due)
}

/**
 * Work that was set without saying what, and that has not been deciphered yet.
 * From Magister that includes a short line that only points to Teams.
 */
export function isMystery(task: Task): boolean {
  const { kind, text, gone } = task.given
  if (isTrial(kind) || kind === 'study' || gone || task.own.note?.trim()) return false
  return task.origin === 'magister' ? isVague(text) : !text.trim()
}

/** The student's own words win over the given text. */
export const wording = (task: Task): string => task.own.note?.trim() || task.given.text

/** Where a freshly added task goes: today for same-day kinds, otherwise its due day. */
export function initialPlan(kind: Kind, due: IsoDate, today: IsoDate, windowFrom: IsoDate): IsoDate | undefined {
  return SAME_DAY.includes(kind) && today < due && today >= windowFrom ? today : undefined
}

/**
 * The days to train on before a trial: the last school days before it, topped
 * up with weekend days when the week runs out (a Monday test seen on Saturday).
 * Days in `taken` already have a round.
 */
export function trainingDays(due: IsoDate, today: IsoDate, rounds: number, taken: IsoDate[] = []): IsoDate[] {
  // slice(-0) would hand back every day, so no rounds is said outright.
  if (rounds <= 0) return []
  const candidates: IsoDate[] = []
  for (let day = today; day < due; day = addDays(day, 1)) if (!taken.includes(day)) candidates.push(day)

  const picked = candidates.filter(isSchoolDay).slice(-rounds)
  if (picked.length < rounds) {
    const weekend = candidates.filter((day) => !isSchoolDay(day))
    picked.push(...weekend.slice(-(rounds - picked.length)))
  }
  return picked.sort()
}

const dayOf = (task: Task): IsoDate => task.own.plan ?? task.given.due

/** A trial's rounds, numbered in the order of their days and following the trial's subject and date. */
function numbered(test: Task, rounds: Task[]): Task[] {
  const { subjectId, due } = test.given
  return [...rounds]
    .sort((a, b) => dayOf(a).localeCompare(dayOf(b)) || a.createdAt.localeCompare(b.createdAt))
    .map((task, i, all) => ({ ...task, given: { ...task.given, subjectId, due, round: { n: i + 1, of: all.length } } }))
}

const freshRound = (test: Task, day: IsoDate, uid: () => string, now: string): Task => ({
  id: uid(),
  origin: 'self',
  parentId: test.id,
  given: { subjectId: test.given.subjectId, kind: 'study', text: '', due: test.given.due },
  own: { plan: day },
  createdAt: now
})

/**
 * Rebuilds the training rounds of one task after it was added or changed.
 * Finished rounds are kept (those ticks were earned); open ones are planned
 * anew. A task that is no longer a trial loses its open rounds.
 */
export function retrain(tasks: Task[], test: Task, today: IsoDate, uid: () => string, now: string, training: Training): Task[] {
  const rest = tasks.filter((task) => task.parentId !== test.id)
  if (!isTrial(test.given.kind)) return rest

  const kept = tasks.filter((task) => task.parentId === test.id && isDone(task))
  const days = trainingDays(test.given.due, today, roundsFor(test.given.kind, training) - kept.length)
  return [...rest, ...numbered(test, [...kept, ...days.map((day) => freshRound(test, day, uid, now))])]
}

/**
 * Gives a trial a new number of rounds after Settings changed it. Unlike `retrain` every round
 * stays where it is, also one that was moved by hand: more rounds go on free days before the
 * trial, fewer take away the open rounds furthest from it. Ticked-off rounds always stay.
 */
export function resizeTraining(tasks: Task[], test: Task, today: IsoDate, uid: () => string, now: string, training: Training): Task[] {
  const rounds = tasks.filter((task) => task.parentId === test.id)
  const rest = tasks.filter((task) => task.parentId !== test.id)
  const wanted = roundsFor(test.given.kind, training)

  const done = rounds.filter(isDone)
  const open = rounds.filter((task) => !isDone(task)).sort((a, b) => dayOf(a).localeCompare(dayOf(b)))
  const kept = [...done, ...open.slice(Math.max(0, open.length - Math.max(0, wanted - done.length)))]
  const days = trainingDays(test.given.due, today, wanted - kept.length, kept.map(dayOf))
  return [...rest, ...numbered(test, [...kept, ...days.map((day) => freshRound(test, day, uid, now))])]
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

/** Trials, then the rest in the order they were added. */
export function dayOrder(a: Task, b: Task): number {
  const trial = Number(isTrial(b.given.kind)) - Number(isTrial(a.given.kind))
  return trial || a.createdAt.localeCompare(b.createdAt)
}

export function progress(tasks: Task[], from: IsoDate): { done: number; total: number } {
  const to = addDays(from, 6)
  const week = tasks.filter((task) => !isTrial(task.given.kind) && !task.given.gone && shownOn(task) >= from && shownOn(task) <= to)
  return { done: week.filter(isDone).length, total: week.length }
}
