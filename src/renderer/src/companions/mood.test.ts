import { describe, expect, it } from 'vitest'
import { restingMood } from './mood'
import type { Task } from '../types'

const task = (given: Partial<Task['given']>, own: Task['own'] = {}): Task => ({
  id: Math.random().toString(36),
  origin: 'self',
  given: { subjectId: 'bio', kind: 'homework', text: 'p. 12', due: '2026-09-30', ...given },
  own,
  createdAt: '2026-09-30T08:00:00.000Z'
})

describe('restingMood', () => {
  it('sleeps at night, whatever is waiting', () => {
    expect(restingMood({ tasks: [task({ text: '' })] }, '2026-09-30', 22)).toBe('sleep')
    expect(restingMood({ tasks: [] }, '2026-09-30', 6)).toBe('sleep')
  })

  it('gets curious about a mystery scroll', () => {
    expect(restingMood({ tasks: [task({ text: '' })] }, '2026-09-30', 16)).toBe('curious')
  })

  it('is proud when today is done, idle while it is not', () => {
    expect(restingMood({ tasks: [task({}, { doneAt: 'x' })] }, '2026-09-30', 16)).toBe('proud')
    expect(restingMood({ tasks: [task({})] }, '2026-09-30', 16)).toBe('idle')
    expect(restingMood({ tasks: [] }, '2026-09-30', 16)).toBe('idle')
  })
})
