import { describe, expect, it } from 'vitest'
import { dictionaries } from '../src/renderer/src/i18n'
import { demoBook, freshBook } from '../src/renderer/src/lib/seed'
import type { MagisterSync, SpellbookData } from '../src/renderer/src/types'
import { closedReminder, readRange } from './remind'

// 5 October 2026 is a Monday.
const MONDAY = '2026-10-05'
const at = (time: string): Date => new Date(`${MONDAY}T${time}:00`)
let n = 0
const uid = (): string => `id-${++n}`

const linked = (book: SpellbookData): SpellbookData => ({ ...book, magister: { school: 'school.magister.net' } })

const agenda: MagisterSync = {
  ok: true,
  student: { id: 1, name: 'Sam' },
  items: [
    {
      id: 123,
      start: '2026-10-06T08:30:00Z',
      hour: 1,
      type: 13,
      status: 7,
      infoType: 1,
      html: '<p>p. 52, questions 1–4</p>',
      subjects: [{ id: 7, name: 'English_' }]
    }
  ]
}

describe('closedReminder', () => {
  it('waits for the chosen time', () => {
    expect(closedReminder(freshBook(), at('15:59'), null, uid)).toBeNull()
  })

  it('marks the day as sent, even when nothing is waiting', () => {
    const result = closedReminder(freshBook(), at('16:05'), null, uid)
    expect(result?.book.reminder.lastSent).toBe(MONDAY)
    expect(result?.message).toBeNull()
  })

  it('goes out once a day', () => {
    const sent = closedReminder(freshBook(), at('16:05'), null, uid)!.book
    expect(closedReminder(sent, at('17:00'), null, uid)).toBeNull()
  })

  it('tells what is waiting in the stored book', () => {
    const result = closedReminder(demoBook(MONDAY), at('16:05'), null, uid)
    expect(result?.message?.body).toBeTruthy()
  })

  it('brings in a fresh Magister read first', () => {
    const result = closedReminder(linked(freshBook()), at('16:05'), agenda, uid)!
    expect(result.book.tasks.some((task) => task.origin === 'magister')).toBe(true)
    expect(result.book.magister).toMatchObject({ school: 'school.magister.net', studentName: 'Sam' })
    expect(result.book.magister?.lastSync).toBeTruthy()
  })

  it('asks for a login when Magister wants one', () => {
    const result = closedReminder(linked(freshBook()), at('16:05'), { ok: false, reason: 'login' }, uid)
    expect(result?.message?.body).toBe(dictionaries.en.cat.login)
  })

  it('plans a test from Magister in a book stored before training could be set', () => {
    const { training: _, weeks: __, ...old } = linked(freshBook())
    const test: MagisterSync = { ...agenda, items: [{ ...agenda.items[0], id: 124, start: '2026-10-09T08:30:00Z', infoType: 2 }] } as MagisterSync
    const result = closedReminder(old as SpellbookData, at('16:05'), test, uid)!
    expect(result.book.tasks.filter((task) => task.given.round)).toHaveLength(3)
  })
})

describe('readRange', () => {
  it('reads this week and four more from Monday, or as far as the book reaches', () => {
    expect(readRange(freshBook(), '2026-10-07')).toEqual({ from: MONDAY, to: '2026-11-08' })
    expect(readRange({ ...freshBook(), weeks: 8 }, '2026-10-07')).toEqual({ from: MONDAY, to: '2026-11-29' })
    const { weeks: _, ...old } = freshBook()
    expect(readRange(old as SpellbookData, '2026-10-07')).toEqual({ from: MONDAY, to: '2026-11-08' })
  })
})
