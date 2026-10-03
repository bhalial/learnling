import { describe, expect, it } from 'vitest'
import { isoWeek, weekday, windowStart } from './dates'

describe('windowStart', () => {
  it('shows this week on school days', () => {
    expect(windowStart('2026-09-28')).toBe('2026-09-28') // Monday
    expect(windowStart('2026-10-02')).toBe('2026-09-28') // Friday
  })

  it('turns the page on Saturday', () => {
    expect(windowStart('2026-10-03')).toBe('2026-10-05') // Saturday
    expect(windowStart('2026-10-04')).toBe('2026-10-05') // Sunday
  })

  it('crosses a year boundary', () => {
    expect(windowStart('2027-01-02')).toBe('2027-01-04') // Saturday
    expect(windowStart('2026-12-31')).toBe('2026-12-28') // Thursday
  })
})

describe('isoWeek', () => {
  it('numbers weeks the Dutch way', () => {
    expect(isoWeek('2026-09-28')).toBe(40)
    expect(isoWeek('2026-10-05')).toBe(41)
    expect(isoWeek('2027-01-01')).toBe(53)
    expect(isoWeek('2027-01-04')).toBe(1)
  })
})

describe('weekday', () => {
  it('counts Monday as 1 and Sunday as 7', () => {
    expect(weekday('2026-09-28')).toBe(1)
    expect(weekday('2026-10-04')).toBe(7)
  })
})
