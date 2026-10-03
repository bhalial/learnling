import { describe, expect, it } from 'vitest'
import { initialPlan, isMystery, needsAttention, retrain, shownOn, trainingDays } from './tasks'
import type { Task } from '../types'

let n = 0
const uid = (): string => `id-${++n}`

const task = (over: Partial<Task['given']> = {}, own: Task['own'] = {}, extra: Partial<Task> = {}): Task => ({
  id: uid(),
  origin: 'self',
  given: { subjectId: 'history', kind: 'homework', text: 'p. 12', due: '2026-10-02', ...over },
  own,
  createdAt: '2026-09-30T12:00:00.000Z',
  ...extra
})

describe('trainingDays', () => {
  it('takes the last school days before the test', () => {
    // Test on Monday 5 Oct, seen on Wednesday 30 Sep.
    expect(trainingDays('2026-10-05', '2026-09-30', 3)).toEqual(['2026-09-30', '2026-10-01', '2026-10-02'])
    // Test on Tuesday: Monday counts, the weekend does not.
    expect(trainingDays('2026-10-06', '2026-09-30', 3)).toEqual(['2026-10-01', '2026-10-02', '2026-10-05'])
  })

  it('falls back to the weekend when the week has run out', () => {
    expect(trainingDays('2026-10-05', '2026-10-03', 3)).toEqual(['2026-10-03', '2026-10-04'])
  })

  it('plans nothing for a test that is today', () => {
    expect(trainingDays('2026-10-01', '2026-10-01', 3)).toEqual([])
  })
})

describe('retrain', () => {
  it('adds numbered rounds to a new test', () => {
    const test = task({ kind: 'test', due: '2026-10-05' })
    const out = retrain([test], test, '2026-09-30', uid, 'now')
    const rounds = out.filter((t) => t.parentId === test.id)
    expect(rounds.map((r) => [r.own.plan, r.given.round])).toEqual([
      ['2026-09-30', { n: 1, of: 3 }],
      ['2026-10-01', { n: 2, of: 3 }],
      ['2026-10-02', { n: 3, of: 3 }]
    ])
  })

  it('keeps finished rounds when the test moves', () => {
    const test = task({ kind: 'test', due: '2026-10-05' })
    const first = retrain([test], test, '2026-09-30', uid, 'now')
    const ticked = first.map((t) => (t.given.round?.n === 1 ? { ...t, own: { ...t.own, doneAt: 'x' } } : t))
    const moved = { ...test, given: { ...test.given, due: '2026-10-07' } }
    const out = retrain(ticked.map((t) => (t.id === test.id ? moved : t)), moved, '2026-10-01', uid, 'now')
    const rounds = out.filter((t) => t.parentId === test.id)
    expect(rounds).toHaveLength(3)
    expect(rounds[0].own.doneAt).toBe('x')
    expect(rounds.map((r) => r.given.round)).toEqual([
      { n: 1, of: 3 },
      { n: 2, of: 3 },
      { n: 3, of: 3 }
    ])
    expect(rounds.every((r) => r.given.due === '2026-10-07')).toBe(true)
  })

  it('drops open rounds when a test becomes homework', () => {
    const test = task({ kind: 'test', due: '2026-10-05' })
    const withRounds = retrain([test], test, '2026-09-30', uid, 'now')
    const homework = { ...test, given: { ...test.given, kind: 'homework' as const } }
    expect(retrain(withRounds, homework, '2026-09-30', uid, 'now').filter((t) => t.parentId === test.id)).toHaveLength(0)
  })
})

describe('placement', () => {
  it('puts same-day work on today, the rest on its due day', () => {
    expect(initialPlan('homework', '2026-10-02', '2026-09-30', '2026-09-28')).toBe('2026-09-30')
    expect(initialPlan('bring', '2026-10-02', '2026-09-30', '2026-09-28')).toBeUndefined()
    // On Saturday the book shows the coming weeks, so today is off the page.
    expect(initialPlan('homework', '2026-10-06', '2026-10-03', '2026-10-05')).toBeUndefined()
  })

  it('keeps tests on their date even when planned elsewhere', () => {
    expect(shownOn(task({ kind: 'test', due: '2026-10-05' }, { plan: '2026-10-01' }))).toBe('2026-10-05')
    expect(shownOn(task({}, { plan: '2026-09-30' }))).toBe('2026-09-30')
  })

  it('treats empty homework as a mystery until she deciphers it', () => {
    expect(isMystery(task({ text: '' }))).toBe(true)
    expect(isMystery(task({ text: '' }, { note: 'p. 52' }))).toBe(false)
    expect(isMystery(task({ kind: 'test', text: '' }))).toBe(false)
  })
})

describe('needsAttention', () => {
  it('collects open work from past days only', () => {
    const late = task({ due: '2026-09-29' })
    const done = task({ due: '2026-09-29' }, { doneAt: 'x' })
    const future = task({ due: '2026-10-05' })
    const missedPlan = task({ due: '2026-10-05' }, { plan: '2026-09-29' })
    expect(needsAttention([late, done, future, missedPlan], '2026-09-30').map((t) => t.id)).toEqual([late.id, missedPlan.id])
  })

  it('forgets training for a test that is over', () => {
    const test = task({ kind: 'test', due: '2026-09-30' })
    const round = task({ kind: 'study', text: '' }, { plan: '2026-09-29' }, { parentId: test.id })
    expect(needsAttention([test, round], '2026-09-30')).toEqual([])
  })
})
