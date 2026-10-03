import { describe, expect, it } from 'vitest'
import { fromMagister, lessonRuns, lessonsOn, nextLesson, previousLesson } from './lessons'
import type { Weekday } from '../types'

const timetable: Record<Weekday, string[]> = { 1: ['maths'], 2: ['biology'], 3: [], 4: ['biology'], 5: [] }

describe('lessons from the timetable', () => {
  const data = { timetable }

  it('finds the next lesson after a day', () => {
    expect(nextLesson(data, 'biology', '2026-09-29')).toBe('2026-10-01') // Tue → Thu
    expect(nextLesson(data, 'maths', '2026-09-28')).toBe('2026-10-05') // Mon → next Mon
  })

  it('finds the lesson before a day', () => {
    expect(previousLesson(data, 'biology', '2026-10-01')).toBe('2026-09-29')
  })

  it('gives up on subjects without lessons', () => {
    expect(nextLesson(data, 'art', '2026-09-28')).toBeNull()
  })
})

describe('lessons from Magister', () => {
  const data = {
    timetable,
    magister: { school: 'x.magister.net', from: '2026-10-05', to: '2026-10-25' },
    lessons: { '2026-10-06': [{ subjectId: 'art', hour: 2 }], '2026-10-08': [{ subjectId: 'biology', hour: 1, cancelled: true }] }
  }

  it('uses the real lessons inside the synced range', () => {
    expect(lessonsOn(data, '2026-10-06')).toEqual([{ subjectId: 'art', hour: 2 }])
    expect(fromMagister(data, '2026-10-13')).toBe(true)
    expect(lessonsOn(data, '2026-10-13')).toEqual([]) // a holiday: no lessons, not the timetable
  })

  it('falls back to the timetable outside it', () => {
    expect(lessonsOn(data, '2026-09-29')).toEqual([{ subjectId: 'biology', hour: 1 }])
  })

  it('skips cancelled lessons when looking for the next one', () => {
    // Thursday 8 Oct is cancelled; after the synced range the timetable's Tuesday takes over.
    expect(nextLesson(data, 'biology', '2026-10-06')).toBe('2026-10-27')
  })
})

describe('lessonRuns', () => {
  const lesson = (subjectId: string, cancelled = false) => ({ subjectId, hour: null, cancelled })

  it('takes a double period together', () => {
    expect(lessonRuns([lesson('english'), lesson('pe'), lesson('pe'), lesson('geography')])).toEqual([
      { subjectId: 'english', count: 1, cancelled: false },
      { subjectId: 'pe', count: 2, cancelled: false },
      { subjectId: 'geography', count: 1, cancelled: false }
    ])
  })

  it('keeps lessons apart that are not back to back, or of which only one is cancelled', () => {
    expect(lessonRuns([lesson('maths'), lesson('art'), lesson('maths')]).map((r) => r.count)).toEqual([1, 1, 1])
    expect(lessonRuns([lesson('pe'), lesson('pe', true)]).map((r) => [r.count, r.cancelled])).toEqual([
      [1, false],
      [1, true]
    ])
  })
})
