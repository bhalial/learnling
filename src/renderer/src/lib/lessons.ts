import type { IsoDate, Lesson, SpellbookData, Weekday } from '../types'
import { addDays, weekday } from './dates'

type LessonSource = Pick<SpellbookData, 'timetable' | 'lessons' | 'magister'>

/** Whether Magister's lessons cover this day (then an empty day really is a day off). */
export function fromMagister(data: LessonSource, date: IsoDate): boolean {
  const { from, to } = data.magister ?? {}
  return Boolean(data.lessons && from && to && date >= from && date <= to)
}

/** The lessons of a day: Magister's real ones where synced, her timetable elsewhere. */
export function lessonsOn(data: LessonSource, date: IsoDate): Lesson[] {
  if (fromMagister(data, date)) return data.lessons?.[date] ?? []
  const day = weekday(date)
  return day <= 5 ? data.timetable[day as Weekday].map((subjectId, i) => ({ subjectId, hour: i + 1 })) : []
}

const hasLesson = (data: LessonSource, date: IsoDate, subjectId: string): boolean =>
  lessonsOn(data, date).some((lesson) => lesson.subjectId === subjectId && !lesson.cancelled)

/** The first day after `after` with a lesson of this subject, within three weeks. */
export function nextLesson(data: LessonSource, subjectId: string, after: IsoDate): IsoDate | null {
  for (let i = 1; i <= 21; i++) {
    const date = addDays(after, i)
    if (hasLesson(data, date, subjectId)) return date
  }
  return null
}

/** The last day before `before` with a lesson of this subject, within three weeks. */
export function previousLesson(data: LessonSource, subjectId: string, before: IsoDate): IsoDate | null {
  for (let i = 1; i <= 21; i++) {
    const date = addDays(before, -i)
    if (hasLesson(data, date, subjectId)) return date
  }
  return null
}

/** Lessons of one subject in a row, as the day's lesson line shows them. */
export interface LessonRun {
  subjectId: string
  /** How many lessons in a row: 2 for a double period. */
  count: number
  cancelled: boolean
}

/** A day's lessons with back-to-back lessons of the same subject taken together. */
export function lessonRuns(lessons: Lesson[]): LessonRun[] {
  const runs: LessonRun[] = []
  for (const lesson of lessons) {
    const cancelled = Boolean(lesson.cancelled)
    const last = runs[runs.length - 1]
    if (last && last.subjectId === lesson.subjectId && last.cancelled === cancelled) last.count++
    else runs.push({ subjectId: lesson.subjectId, count: 1, cancelled })
  }
  return runs
}
