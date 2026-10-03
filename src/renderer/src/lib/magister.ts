import type { IsoDate, Kind, Lesson, MagisterItem, SpellbookData, Subject, Task } from '../types'
import { todayIso, windowStart } from './dates'
import { previousLesson } from './lessons'
import { cleanSubjectName, distinctColors, subjectInUse } from './subjects'
import { initialPlan, isDone, isTrial, retrain } from './tasks'
import { plainText, withoutLabel } from './text'

/** Magister's InfoType. 0 is "nothing set"; 6 (info) and 7 (note) are not work for her. */
const KINDS: Record<number, Kind> = { 1: 'homework', 2: 'test', 3: 'test', 4: 'quiz', 5: 'quiz' }

/** Lesson statuses for a cancelled lesson, from unofficial documentation; not seen live yet. */
const CANCELLED = new Set([4, 5])

/** Magister times are UTC; the lesson's day is the day on her clock. */
export const localDate = (timestamp: string): IsoDate => todayIso(new Date(timestamp))

export interface SyncOutcome {
  data: SpellbookData
  added: number
  changed: number
  gone: number
}

/**
 * Folds one Magister read into the book. Only `given` halves and lessons are
 * written; whatever she did herself (`own`) survives every sync untouched.
 */
export function mergeSync(
  data: SpellbookData,
  items: MagisterItem[],
  range: { from: IsoDate; to: IsoDate },
  today: IsoDate,
  uid: () => string,
  now: string
): SyncOutcome {
  // Subjects: match on Magister's id, then once on name; otherwise add one.
  const firstLink = !data.subjects.some((s) => s.externalId)
  const subjects: Subject[] = [...data.subjects]
  const subjectFor = new Map<number, string>()
  for (const { id, name } of items.flatMap((item) => item.subjects)) {
    if (subjectFor.has(id)) continue
    const externalId = String(id)
    const clean = cleanSubjectName(name)
    let i = subjects.findIndex((s) => s.externalId === externalId)
    if (i < 0) i = subjects.findIndex((s) => !s.externalId && s.name.trim().toLowerCase() === clean.toLowerCase())
    if (i >= 0) {
      subjects[i] = { ...subjects[i], externalId }
    } else {
      // Coloured below, once it is known which subjects stay.
      subjects.push({ id: uid(), name: clean, color: '', externalId })
      i = subjects.length - 1
    }
    subjectFor.set(id, subjects[i].id)
  }
  // On the first link Magister brings its own subjects; unused starter ones only get in the way.
  const keptSubjects = distinctColors(firstLink ? subjects.filter((s) => s.externalId || subjectInUse(data, s.id)) : subjects)

  // Lessons: Magister's are the truth for the synced range.
  const lessons: Record<IsoDate, Lesson[]> = {}
  for (const item of items) {
    const subjectId = item.subjects[0] && subjectFor.get(item.subjects[0].id)
    if (!subjectId) continue
    const lesson: Lesson = { subjectId, hour: item.hour }
    if (CANCELLED.has(item.status)) lesson.cancelled = true
    ;(lessons[localDate(item.start)] ??= []).push(lesson)
  }
  for (const day of Object.values(lessons)) day.sort((a, b) => (a.hour ?? 99) - (b.hour ?? 99))
  const magister = { ...data.magister!, from: range.from, to: range.to }
  const lessonSource = { timetable: data.timetable, lessons, magister }

  // Tasks: update what we know, add what is new, flag what disappeared.
  let tasks = [...data.tasks]
  const known = new Map(tasks.filter((t) => t.origin === 'magister' && t.externalId).map((t) => [t.externalId!, t]))
  const present = new Set<string>()
  let added = 0
  let changed = 0

  for (const item of items) {
    const kind = KINDS[item.infoType]
    const subjectId = item.subjects[0] && subjectFor.get(item.subjects[0].id)
    if (!kind || !subjectId) continue
    const externalId = String(item.id)
    present.add(externalId)
    const given = { subjectId, kind, text: withoutLabel(plainText(item.html)), due: localDate(item.start) }
    const old = known.get(externalId)

    if (old) {
      const same =
        old.given.subjectId === given.subjectId && old.given.kind === given.kind && old.given.text === given.text && old.given.due === given.due
      if (same && !old.given.gone) continue
      const next: Task = {
        ...old,
        given: { ...old.given, ...given, gone: undefined },
        // A changed text or day is news again; the rest of her half stays as it was.
        own: { ...old.own, seen: same ? old.own.seen : false }
      }
      tasks = tasks.map((t) => (t.id === old.id ? next : t))
      const trialMoved = old.given.kind !== given.kind || old.given.due !== given.due || old.given.subjectId !== given.subjectId
      if (trialMoved && (isTrial(old.given.kind) || isTrial(kind))) tasks = retrain(tasks, next, today, uid, now)
      changed++
      continue
    }

    // Work that was due before today is history: never import it as new.
    if (given.due < today) continue
    // Homework belongs on the day it was set (the lesson before), or today if that has passed.
    const setOn = previousLesson(lessonSource, subjectId, given.due)
    const plan = isTrial(kind) ? undefined : setOn && setOn >= today ? setOn : initialPlan('homework', given.due, today, windowStart(today))
    const task: Task = { id: uid(), origin: 'magister', externalId, given, own: plan ? { plan } : {}, createdAt: now }
    tasks.push(task)
    if (isTrial(kind)) tasks = retrain(tasks, task, today, uid, now)
    added++
  }

  const goneIds = new Set<string>()
  tasks = tasks.map((t) => {
    const vanished =
      t.origin === 'magister' && t.externalId && !present.has(t.externalId) && !t.given.gone && t.given.due >= range.from && t.given.due <= range.to
    if (!vanished) return t
    goneIds.add(t.id)
    return { ...t, given: { ...t.given, gone: true } }
  })
  // Open training for a trial that vanished has nothing left to train for.
  tasks = tasks.filter((t) => !(t.parentId && goneIds.has(t.parentId) && !isDone(t)))

  return {
    data: { ...data, subjects: keptSubjects, lessons, tasks, magister },
    added,
    changed,
    gone: goneIds.size
  }
}
