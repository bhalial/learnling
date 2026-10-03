import { describe, expect, it } from 'vitest'
import type { Subject } from '../types'
import { PALETTE } from './seed'
import { distinctColors, labelName, recolor, shortName } from './subjects'

const subject = (id: string, color: string): Subject => ({ id, name: id, color })
const colors = (subjects: Subject[]): string[] => subjects.map((s) => s.color)

describe('recolor', () => {
  it('swaps with the subject that had the colour', () => {
    const subjects = [subject('maths', PALETTE[0]), subject('english', PALETTE[1]), subject('dutch', PALETTE[2])]
    expect(colors(recolor(subjects, 'maths', PALETTE[1]))).toEqual([PALETTE[1], PALETTE[0], PALETTE[2]])
  })

  it('simply takes a free colour', () => {
    const subjects = [subject('maths', PALETTE[0]), subject('english', PALETTE[1])]
    expect(colors(recolor(subjects, 'maths', PALETTE[5]))).toEqual([PALETTE[5], PALETTE[1]])
  })

  it('can never end with every subject in one colour', () => {
    let subjects = [subject('a', PALETTE[0]), subject('b', PALETTE[1]), subject('c', PALETTE[2])]
    for (const id of ['a', 'b', 'c']) subjects = recolor(subjects, id, PALETTE[0])
    expect(new Set(colors(subjects)).size).toBe(3)
  })
})

describe('distinctColors', () => {
  it('gives later look-alikes and blank ones a free colour, keeping the first', () => {
    const subjects = [subject('a', PALETTE[0]), subject('b', PALETTE[0]), subject('c', ''), subject('d', PALETTE[1])]
    const fixed = distinctColors(subjects)
    expect(fixed[0].color).toBe(PALETTE[0])
    expect(fixed[3].color).toBe(PALETTE[1])
    expect(new Set(colors(fixed)).size).toBe(4)
  })

  it('has enough colours for a full Magister timetable', () => {
    const many = Array.from({ length: 16 }, (_, i) => subject(`s${i}`, ''))
    expect(new Set(colors(distinctColors(many))).size).toBe(16)
  })
})

describe('shortName', () => {
  it('knows the usual subjects, in Dutch and English', () => {
    expect(shortName({ name: 'Nederlands' })).toBe('NE')
    expect(shortName({ name: 'English' })).toBe('EN')
    expect(shortName({ name: 'Mathematics' })).toBe('MATH')
  })

  it('makes one up for the rest: the name if short, else initials or a start', () => {
    expect(shortName({ name: 'Nto2' })).toBe('NTO2')
    expect(shortName({ name: 'Moderne talen en culturen' })).toBe('MTC')
    expect(shortName({ name: 'Physical health education' })).toBe('PHE')
    expect(shortName({ name: 'Specialisatieblok' })).toBe('SPEC')
  })

  it('keeps the student’s own', () => {
    expect(shortName({ name: 'Moderne talen en culturen', short: 'MTC2' })).toBe('MTC2')
    expect(shortName({ name: 'English', short: '  ' })).toBe('EN')
  })

  it('puts the whole name on a task while it fits', () => {
    expect(labelName({ name: 'Geography' })).toBe('Geography')
    expect(labelName({ name: 'Physical health education' })).toBe('PHE')
  })
})
