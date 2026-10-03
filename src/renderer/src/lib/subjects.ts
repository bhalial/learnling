import type { SpellbookData, Subject } from '../types'
import { PALETTE } from './seed'

export function subjectInUse(data: Pick<SpellbookData, 'tasks' | 'timetable'>, id: string): boolean {
  return data.tasks.some((t) => t.given.subjectId === id) || Object.values(data.timetable).some((day) => day.includes(id))
}

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
