import { describe, expect, it } from 'vitest'
import { mergeSync } from './magister'
import { freshBook } from './seed'
import { isMystery } from './tasks'
import type { MagisterItem, SpellbookData } from '../types'

let n = 0
const uid = (): string => `id-${++n}`
const range = { from: '2026-09-28', to: '2026-11-01' }

// 07:00 UTC is 09:00 in Amsterdam: the same calendar day either way.
const item = (id: number, date: string, subject: [number, string], infoType = 0, html: string | null = null): MagisterItem => ({
  id,
  start: `${date}T07:00:00Z`,
  hour: 2,
  type: 13,
  status: 1,
  infoType,
  html,
  subjects: [{ id: subject[0], name: subject[1] }]
})

const BIO: [number, string] = [168, 'biology']
const NED: [number, string] = [188, 'Nederlands_']

const linked = (): SpellbookData => ({ ...freshBook(), magister: { school: 'x.magister.net' } })

describe('mergeSync', () => {
  it('brings Magister’s subjects and clears unused starters on the first link', () => {
    const { data } = mergeSync(linked(), [item(1, '2026-09-30', BIO), item(2, '2026-09-30', NED)], range, '2026-09-30', uid, 'now')
    const names = data.subjects.map((s) => s.name)
    expect(names).toContain('Biology') // matched the starter by name, kept its colour
    expect(names).toContain('Nederlands') // cleaned up
    expect(names).not.toContain('Dutch') // unused starter dropped
    expect(data.subjects.find((s) => s.name === 'Biology')?.externalId).toBe('168')
  })

  it('records the real lessons per day', () => {
    const { data } = mergeSync(linked(), [item(1, '2026-09-30', BIO), item(2, '2026-10-01', NED)], range, '2026-09-30', uid, 'now')
    expect(Object.keys(data.lessons ?? {})).toEqual(['2026-09-30', '2026-10-01'])
    expect(data.magister?.from).toBe('2026-09-28')
  })

  it('adds homework on the day it was set, and tests with training', () => {
    const items = [
      item(1, '2026-09-30', BIO),
      item(2, '2026-10-02', BIO, 1, '<p>Lees §2.1</p>'),
      item(3, '2026-10-07', BIO, 2, '<p>H2 §1-3</p>')
    ]
    const { data, added } = mergeSync(linked(), items, range, '2026-09-30', uid, 'now')
    expect(added).toBe(2)
    const homework = data.tasks.find((t) => t.externalId === '2')!
    expect(homework.given).toMatchObject({ kind: 'homework', text: 'Lees §2.1', due: '2026-10-02' })
    expect(homework.own.plan).toBe('2026-09-30') // the biology lesson where it was set
    const test = data.tasks.find((t) => t.externalId === '3')!
    expect(test.given.kind).toBe('test')
    expect(data.tasks.filter((t) => t.parentId === test.id).length).toBeGreaterThan(0)
  })

  it('never imports work that was due before today', () => {
    const { added } = mergeSync(linked(), [item(1, '2026-09-29', BIO, 1, 'old')], range, '2026-09-30', uid, 'now')
    expect(added).toBe(0)
  })

  it('updates the teacher’s half and leaves the student’s alone', () => {
    const first = mergeSync(linked(), [item(2, '2026-10-02', BIO, 1, 'Lees §2.1')], range, '2026-09-30', uid, 'now').data
    const id = first.tasks[0].id
    const worked = {
      ...first,
      tasks: first.tasks.map((t) => (t.id === id ? { ...t, own: { ...t.own, doneAt: 'x', note: 'mine', plan: '2026-10-01', seen: true } } : t))
    }
    const { data, changed } = mergeSync(worked, [item(2, '2026-10-02', BIO, 1, 'Lees §2.1 en §2.2')], range, '2026-09-30', uid, 'now')
    expect(changed).toBe(1)
    const task = data.tasks.find((t) => t.id === id)!
    expect(task.given.text).toBe('Lees §2.1 en §2.2')
    expect(task.own).toMatchObject({ doneAt: 'x', note: 'mine', plan: '2026-10-01', seen: false })
  })

  it('flags work the teacher removed instead of deleting it', () => {
    const first = mergeSync(linked(), [item(2, '2026-10-02', BIO, 1, 'Lees §2.1')], range, '2026-09-30', uid, 'now').data
    const { data, gone } = mergeSync(first, [], range, '2026-09-30', uid, 'now')
    expect(gone).toBe(1)
    expect(data.tasks[0].given.gone).toBe(true)
  })

  it('makes a pointer to Teams a mystery scroll', () => {
    const { data } = mergeSync(linked(), [item(2, '2026-10-02', BIO, 1, '<p>Huiswerk</p><p>Zie Teams</p>')], range, '2026-09-30', uid, 'now')
    expect(data.tasks[0].given.text).toBe('Zie Teams')
    expect(isMystery(data.tasks[0])).toBe(true)
  })

  it('skips information that is not work', () => {
    const { added } = mergeSync(linked(), [item(2, '2026-10-02', BIO, 6, 'Excursie')], range, '2026-09-30', uid, 'now')
    expect(added).toBe(0)
  })
})
