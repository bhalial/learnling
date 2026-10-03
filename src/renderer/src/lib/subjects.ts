import type { SpellbookData, Subject } from '../types'
import { PALETTE } from './seed'

export function subjectInUse(data: Pick<SpellbookData, 'tasks' | 'timetable'>, id: string): boolean {
  return data.tasks.some((t) => t.given.subjectId === id) || Object.values(data.timetable).some((day) => day.includes(id))
}

/** Timetable abbreviations for common subjects, whether the school names them in Dutch or English. */
const SHORT: Record<string, string> = {
  nederlands: 'NE', dutch: 'NE', engels: 'EN', english: 'EN', frans: 'FA', french: 'FR', duits: 'DU', german: 'GER',
  spaans: 'SP', spanish: 'SPA', latijn: 'LA', latin: 'LAT', grieks: 'GR', greek: 'GRE',
  wiskunde: 'WI', mathematics: 'MATH', maths: 'MATH', math: 'MATH',
  biologie: 'BI', biology: 'BIO', geschiedenis: 'GS', history: 'HIS', aardrijkskunde: 'AK', geography: 'GEO',
  natuurkunde: 'NA', physics: 'PHY', scheikunde: 'SK', chemistry: 'CHEM', economie: 'EC', economics: 'ECO',
  muziek: 'MU', music: 'MUS', kunst: 'KU', art: 'ART', tekenen: 'TE', drama: 'DR',
  'lichamelijke opvoeding': 'LO', gym: 'LO', pe: 'PE', 'physical education': 'PE',
  mentoruur: 'MEN', mentor: 'MEN', informatica: 'IN', techniek: 'TECH', science: 'SCI'
}

/**
 * A subject's short name, for the timetable line: the student's own if they gave one, a
 * known abbreviation, the name itself when it is short, or else its initials ("Moderne talen
 * en culturen" → "MTC").
 */
export function shortName(subject: Pick<Subject, 'name' | 'short'>): string {
  const own = subject.short?.trim()
  if (own) return own
  const name = subject.name.trim()
  const known = SHORT[name.toLowerCase()]
  if (known) return known
  if (name.length <= 5) return name.toUpperCase()
  const words = name.split(/\s+/).filter((word) => word.length > 2)
  if (words.length > 1) return words.map((word) => word[0]).join('').toUpperCase().slice(0, 4)
  return name.slice(0, 4).toUpperCase()
}

/** The name on a task: the whole name while it fits, the short one when it is long. */
export const labelName = (subject: Pick<Subject, 'name' | 'short'>): string => (subject.name.trim().length <= 12 ? subject.name : shortName(subject))

/** "Nederlands_" → "Nederlands", "biology" → "Biology". */
export function cleanSubjectName(name: string): string {
  const clean = name.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim()
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

/** The first palette colour no subject has yet; once all are taken, the colours come round again. */
export function freeColor(subjects: Pick<Subject, 'color'>[]): string {
  const used = new Set(subjects.map((s) => s.color))
  return PALETTE.find((c) => !used.has(c)) ?? PALETTE[subjects.length % PALETTE.length]
}

/**
 * Every subject its own colour: the first one keeps a colour, any later one sharing it (or
 * without one) gets a free colour. Repairs books from before colours had to differ.
 */
export function distinctColors(subjects: Subject[]): Subject[] {
  const owner = new Map<string, string>()
  for (const s of subjects) if (s.color && !owner.has(s.color)) owner.set(s.color, s.id)
  const taken: Pick<Subject, 'color'>[] = subjects.filter((s) => owner.get(s.color) === s.id)
  return subjects.map((s) => {
    if (owner.get(s.color) === s.id) return s
    const color = freeColor(taken)
    taken.push({ color })
    return { ...s, color }
  })
}

/** Gives a subject a colour; the subject that had it takes over the old one, so two never match. */
export function recolor(subjects: Subject[], id: string, color: string): Subject[] {
  const old = subjects.find((s) => s.id === id)?.color
  if (!old || old === color) return subjects
  return subjects.map((s) => (s.id === id ? { ...s, color } : s.color === color ? { ...s, color: old } : s))
}
