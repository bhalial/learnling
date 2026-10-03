import type { IsoDate, Kind, SpellbookData, Subject, Task } from '../types'
import { addDays, windowStart } from './dates'
import { retrain } from './tasks'

/**
 * Watercolour inks that stay readable on the paper and differ in lightness, not just hue.
 * Enough for every subject of a full timetable to have its own; new ones go at the end so
 * existing books keep their colours.
 */
export const PALETTE = [
  '#4a74b8', '#c0463f', '#d98a3a', '#8a5fb5', '#5f9a45', '#b08a3c',
  '#3c9590', '#cf6a92', '#7a8594', '#8a5a3c', '#2f4a7a', '#9aa83a',
  '#5aa7c9', '#9c3f7c', '#e2775f', '#d6ae2f', '#2f7a4f', '#6a5acd'
]

const SUBJECTS: Array<[string, string, string]> = [
  ['english', 'English', '#c0463f'],
  ['dutch', 'Dutch', '#d98a3a'],
  ['french', 'French', '#8a5fb5'],
  ['maths', 'Maths', '#4a74b8'],
  ['biology', 'Biology', '#5f9a45'],
  ['history', 'History', '#b08a3c'],
  ['geography', 'Geography', '#3c9590'],
  ['art', 'Art', '#cf6a92'],
  ['pe', 'PE', '#7a8594']
]

export function freshBook(): SpellbookData {
  return {
    version: 1,
    lang: 'en',
    theme: 'magic',
    subjects: SUBJECTS.map(([id, name, color]): Subject => ({ id, name, color })),
    timetable: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    tasks: [],
    companion: { name: '', species: 'cat', coat: 'ginger', accessory: 'hat', eyes: 'green' },
    reminder: { enabled: true, time: '16:00' },
    app: { tray: true, autostart: false }
  }
}

/** A filled book for trying the app out (SPELLBOOK_DEMO=1). Dates follow `today`. */
export function demoBook(today: IsoDate): SpellbookData {
  const book = freshBook()
  book.companion.name = 'Mochi'
  // A bilingual school's long subject names, to see the book stay tidy with them.
  book.subjects.push(
    { id: 'mentor', name: 'Mentoruur', color: '#8a5a3c' },
    { id: 'music', name: 'Music', color: '#5aa7c9' },
    { id: 'languages', name: 'Moderne talen en culturen', color: '#9aa83a' },
    { id: 'health', name: 'Physical health education', color: '#9c3f7c' }
  )
  book.timetable = {
    1: ['mentor', 'music', 'maths', 'english', 'dutch', 'biology'],
    2: ['geography', 'languages', 'health', 'health', 'history', 'english'],
    3: ['biology', 'french', 'maths', 'history', 'english', 'music'],
    4: ['mentor', 'dutch', 'geography', 'french', 'maths', 'art'],
    5: ['history', 'english', 'languages', 'health', 'maths']
  }

  const monday = windowStart(today)
  let n = 0
  const task = (offset: number, subjectId: string, kind: Kind, text: string): Task => {
    const due = addDays(monday, offset)
    n++
    return {
      id: `demo-${n}`,
      origin: 'self',
      given: { subjectId, kind, text, due },
      own: due < today ? { doneAt: `${due}T16:00:00.000Z` } : {},
      createdAt: `2026-01-01T00:00:${String(n).padStart(2, '0')}.000Z`
    }
  }

  const tasks = [
    task(0, 'maths', 'homework', 'p. 34, ex. 1–8'),
    task(0, 'english', 'read', 'Read chapter 3 of Holes'),
    task(1, 'french', 'learn', 'Woordjes unit 1A'),
    task(1, 'geography', 'homework', 'Worksheet: climate zones'),
    task(2, 'biology', 'homework', ''),
    task(2, 'maths', 'homework', 'p. 36, ex. 9–15'),
    task(3, 'french', 'quiz', 'Woordjes unit 1A'),
    task(3, 'english', 'homework', 'Write 100 words: my summer'),
    task(4, 'dutch', 'read', 'Lees blz. 20–24'),
    task(7, 'history', 'test', 'Ancient Egypt, ch. 2 §1–4'),
    task(8, 'maths', 'homework', 'p. 40, ex. 1–6'),
    task(8, 'art', 'bring', 'Sketchbook + pencils'),
    task(9, 'biology', 'quiz', 'Cells §2.1–2.3'),
    task(10, 'geography', 'homework', 'Finish poster: biomes'),
    task(11, 'english', 'learn', 'Vocab list 2'),
    task(-3, 'dutch', 'handin', 'Toestemmingsformulier'),
    task(18, 'maths', 'test', 'Chapter 3: fractions'),
    task(3, 'geography', 'homework', 'Zie Teams opdrachten'),
    task(8, 'maths', 'homework', 'p. 41, ex. 7–9'),
    task(7, 'mentor', 'homework', 'Make a plan in your planner for one subject'),
    task(8, 'languages', 'homework', 'Describe 3 family members in French'),
    task(8, 'health', 'homework', 'Start video + practice plan'),
    task(11, 'languages', 'homework', 'Exercise 4 of lesson 26'),
    task(14, 'english', 'test', 'Listening test (PET part 1)')
  ]
  // The form from last week is still waiting.
  tasks[15].own = {}

  // A few arrived from Magister: fresh ones, one that only points to Teams, one the teacher removed.
  const fromMagister = (i: number, given: Partial<Task['given']> = {}): void => {
    tasks[i] = { ...tasks[i], origin: 'magister', externalId: `demo-${i}`, given: { ...tasks[i].given, ...given }, own: {} }
  }
  fromMagister(9, { text: 'Ancient Egypt, ch. 2 §1–4\nLearn the word list on p. 48 as well, and the map of the Nile.' })
  fromMagister(17)
  fromMagister(18, { gone: true })

  // Plan training as if the trials were entered at the start of the week.
  const plannedFrom = monday < today ? monday : today
  let all = tasks
  for (const trial of tasks.filter((t) => t.given.kind === 'test' || t.given.kind === 'quiz')) {
    all = retrain(all, trial, plannedFrom, () => `demo-${++n}`, trial.createdAt)
  }
  // Training that should have happened before today is done in the demo.
  book.tasks = all.map((t) => (t.given.round && (t.own.plan ?? '') < today ? { ...t, own: { ...t.own, doneAt: `${t.own.plan}T17:00:00.000Z` } } : t))
  return book
}
