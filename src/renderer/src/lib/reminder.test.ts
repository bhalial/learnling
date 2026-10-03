import { describe, expect, it } from 'vitest'
import { dictionaries } from '../i18n'
import { reminderDue, reminderMessage } from './reminder'
import { freshBook } from './seed'

// 5 October 2026 is a Monday, the 10th a Saturday.
const MONDAY = '2026-10-05'
const SATURDAY = '2026-10-10'
const at = (day: string, time: string): Date => new Date(`${day}T${time}:00`)
const reminder = { enabled: true, time: '16:00' }

describe('reminderDue', () => {
  it('goes out at the chosen time on a school day, and after it if the laptop was asleep', () => {
    expect(reminderDue(reminder, MONDAY, at(MONDAY, '15:59'))).toBe(false)
    expect(reminderDue(reminder, MONDAY, at(MONDAY, '16:00'))).toBe(true)
    expect(reminderDue(reminder, MONDAY, at(MONDAY, '19:30'))).toBe(true)
  })

  it('goes out once a day', () => {
    expect(reminderDue({ ...reminder, lastSent: MONDAY }, MONDAY, at(MONDAY, '16:01'))).toBe(false)
    expect(reminderDue({ ...reminder, lastSent: '2026-10-02' }, MONDAY, at(MONDAY, '16:01'))).toBe(true)
  })

  it('stays quiet in the weekend and when switched off', () => {
    expect(reminderDue(reminder, SATURDAY, at(SATURDAY, '16:00'))).toBe(false)
    expect(reminderDue({ ...reminder, enabled: false }, MONDAY, at(MONDAY, '16:00'))).toBe(false)
  })

  it('follows the chosen time', () => {
    expect(reminderDue({ ...reminder, time: '09:30' }, MONDAY, at(MONDAY, '09:30'))).toBe(true)
    expect(reminderDue({ ...reminder, time: '09:30' }, MONDAY, at(MONDAY, '09:29'))).toBe(false)
  })
})

describe('reminderMessage', () => {
  const t = dictionaries.en

  it('says nothing when nothing is waiting', () => {
    expect(reminderMessage(freshBook(), MONDAY, { state: 'idle' }, t)).toBeNull()
  })

  it('asks for a Magister login first, signed with the companion’s name', () => {
    const data = { ...freshBook(), companion: { ...freshBook().companion, name: 'Mochi' } }
    expect(reminderMessage(data, MONDAY, { state: 'login' }, t)).toEqual({ title: 'Mochi', body: t.cat.login })
  })

  it('falls back to the app name while the companion has none', () => {
    expect(reminderMessage(freshBook(), MONDAY, { state: 'login' }, t)?.title).toBe('Learnling')
  })
})
