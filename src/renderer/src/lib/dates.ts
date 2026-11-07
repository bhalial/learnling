import type { IsoDate } from '../types'

const DAY = 86_400_000

// All day arithmetic runs in UTC so a daylight-saving switch can never shift a date.
const toUtc = (date: IsoDate): number => {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

const fromUtc = (ms: number): IsoDate => new Date(ms).toISOString().slice(0, 10)

const pad = (n: number): string => String(n).padStart(2, '0')

export function todayIso(now = new Date()): IsoDate {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function addDays(date: IsoDate, n: number): IsoDate {
  return fromUtc(toUtc(date) + n * DAY)
}

/** Mon = 1 … Sun = 7. */
export function weekday(date: IsoDate): number {
  const day = new Date(toUtc(date)).getUTCDay()
  return day === 0 ? 7 : day
}

export function isSchoolDay(date: IsoDate): boolean {
  return weekday(date) <= 5
}

export function mondayOf(date: IsoDate): IsoDate {
  return addDays(date, 1 - weekday(date))
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY)
}

/**
 * Monday of the first of the two weeks the book shows: the current week on
 * school days, the coming week from Saturday on.
 */
export function windowStart(today: IsoDate): IsoDate {
  const monday = mondayOf(today)
  return weekday(today) >= 6 ? addDays(monday, 7) : monday
}

/** How far Settings let the book reach: from just its two open pages up to ten weeks. */
export const WEEKS = { min: 2, max: 10 }

export const clampWeeks = (weeks: number): number => Math.min(WEEKS.max, Math.max(WEEKS.min, Math.round(weeks) || WEEKS.min))

/** Monday of the left page, with the book leafed `leaf` weeks past its first one. */
export const leafStart = (today: IsoDate, leaf: number): IsoDate => addDays(windowStart(today), leaf * 7)

export function isoWeek(date: IsoDate): number {
  const thursday = addDays(date, 4 - weekday(date))
  return Math.floor(daysBetween(`${thursday.slice(0, 4)}-01-01`, thursday) / 7) + 1
}

/** The first school day after `after`. */
export function nextSchoolDay(after: IsoDate): IsoDate {
  let date = addDays(after, 1)
  while (!isSchoolDay(date)) date = addDays(date, 1)
  return date
}

export function asDate(date: IsoDate): Date {
  return new Date(toUtc(date))
}
