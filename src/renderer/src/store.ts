import { create } from 'zustand'
import { coatFor, eyesFor, settleCompanion } from './companions'
import { wordsFor, type Dict } from './i18n'
import { themeFor, type ThemeId } from './themes'
import type { AccessoryId } from './companions/types'
import type { Boot, CompanionSettings, IsoDate, Kind, Lang, SpellbookData, Task, Weekday } from './types'
import { addDays, mondayOf, todayIso, windowStart } from './lib/dates'
import { mergeSync } from './lib/magister'
import { demoBook, freshBook } from './lib/seed'
import { distinctColors, freeColor, recolor, subjectInUse } from './lib/subjects'
import { initialPlan, isDone, isMystery, isTrial, retrain } from './lib/tasks'

export interface Draft {
  subjectId: string
  kind: Kind
  text: string
  due: IsoDate
}

export type Sheet = { mode: 'new'; due?: IsoDate } | { mode: 'edit'; id: string } | null

export type ReactionKind = 'yay' | 'undo' | 'decoded' | 'dress' | 'added' | 'moved' | 'tooLate' | 'synced'

export interface Reaction {
  kind: ReactionKind
  at: number
  /** How many, for reactions that count something (new spells from Magister). */
  n?: number
}

export type SyncState = { state: 'idle' | 'busy' | 'login' | 'error'; message?: string }

interface BookState {
  ready: boolean
  data: SpellbookData
  today: IsoDate
  /** Set when SPELLBOOK_TODAY pins the date, so the clock never moves it. */
  pinnedToday: boolean
  sheet: Sheet
  settingsOpen: boolean
  reaction: Reaction | null
  sync: SyncState

  boot(boot: Boot): void
  refreshToday(): void
  openSheet(sheet: Sheet): void
  openSettings(open: boolean): void
  clearReaction(at: number): void

  setLang(lang: Lang): void
  setTheme(theme: ThemeId): void
  addTask(draft: Draft): void
  updateTask(id: string, draft: Draft): void
  removeTask(id: string): void
  toggleDone(id: string): void
  decipher(id: string, note: string): void
  setNote(id: string, note: string): void
  markSeen(id: string): void
  plan(id: string, day: IsoDate): void

  setCompanion(patch: Partial<CompanionSettings>): void
  addSubject(): void
  renameSubject(id: string, name: string): void
  /** The subject's own abbreviation; empty goes back to the made-up one. */
  shortenSubject(id: string, short: string): void
  /** Takes the colour; a subject that had it gets this one's old colour. */
  recolorSubject(id: string, color: string): void
  removeSubject(id: string): void
  addLesson(day: Weekday, subjectId: string): void
  removeLesson(day: Weekday, index: number): void

  setReminder(patch: Partial<SpellbookData['reminder']>): void
  setApp(patch: Partial<SpellbookData['app']>): void
  connectMagister(): Promise<void>
  syncMagister(): Promise<void>
  disconnectMagister(): Promise<void>
}

const uid = (): string => crypto.randomUUID()

/** One Magister read at a time; timers, focus and the button can all ask for one. */
let syncing = false

const isBook = (data: unknown): data is SpellbookData =>
  typeof data === 'object' && data !== null && (data as SpellbookData).version === 1

/**
 * Brings an older book up to date: a `cat` became a `companion` (and later animals and eye
 * colours came along), subjects now each have their own colour, and a book from before
 * there were themes is a spellbook.
 */
function upgrade(data: SpellbookData & { cat?: { name: string; fur: string; accessory: AccessoryId } }): SpellbookData {
  const { cat, ...book } = data
  const upgraded = book.companion || !cat ? book : { ...book, companion: { name: cat.name, species: 'cat' as const, coat: cat.fur, accessory: cat.accessory } }
  return {
    ...freshBook(),
    ...upgraded,
    theme: themeFor(upgraded.theme),
    companion: settleCompanion(upgraded.companion ?? freshBook().companion),
    subjects: distinctColors(upgraded.subjects ?? freshBook().subjects)
  }
}

export const useBook = create<BookState>()((set, get) => {
  /** Applies a change to the book and lets the cat react to it. */
  const change = (fn: (data: SpellbookData) => SpellbookData, reaction?: ReactionKind): void =>
    set((state) => ({
      data: fn(state.data),
      reaction: reaction ? { kind: reaction, at: Date.now() } : state.reaction
    }))

  const mapTask = (id: string, fn: (task: Task) => Task) => (data: SpellbookData): SpellbookData => ({
    ...data,
    tasks: data.tasks.map((task) => (task.id === id ? fn(task) : task))
  })

  return {
    ready: false,
    data: freshBook(),
    today: todayIso(),
    pinnedToday: false,
    sheet: null,
    settingsOpen: false,
    reaction: null,
    sync: { state: 'idle' },

    boot({ data, demo, today, theme, lang }) {
      const day = today ?? todayIso()
      // Books saved by an older version lack the newer settings; fill them in.
      const book = isBook(data) ? upgrade(data) : demo ? demoBook(day) : freshBook()
      if (theme) book.theme = themeFor(theme)
      if (lang === 'en' || lang === 'nl') book.lang = lang
      set({ ready: true, data: book, today: day, pinnedToday: Boolean(today) })
    },

    refreshToday() {
      if (!get().pinnedToday && get().today !== todayIso()) set({ today: todayIso() })
    },

    openSheet: (sheet) => set({ sheet }),
    openSettings: (settingsOpen) => set({ settingsOpen }),
    clearReaction: (at) => {
      if (get().reaction?.at === at) set({ reaction: null })
    },

    setLang: (lang) => change((data) => ({ ...data, lang })),
    // The companion changes its headwear along with the theme, and says so.
    setTheme: (theme) => change((data) => ({ ...data, theme }), 'dress'),

    addTask(draft) {
      const { today } = get()
      const now = new Date().toISOString()
      const task: Task = {
        id: uid(),
        origin: 'self',
        given: { ...draft, text: draft.text.trim() },
        own: { plan: initialPlan(draft.kind, draft.due, today, windowStart(today)) },
        createdAt: now
      }
      change((data) => {
        const tasks = [...data.tasks, task]
        return { ...data, tasks: isTrial(task.given.kind) ? retrain(tasks, task, today, uid, now) : tasks }
      }, 'added')
    },

    updateTask(id, draft) {
      const { today } = get()
      change((data) => {
        const old = data.tasks.find((task) => task.id === id)
        if (!old) return data
        // Deciphered words stay the student's own: editing them changes the note, not the given text.
        const text = draft.text.trim()
        const next: Task = old.own.note
          ? { ...old, given: { ...old.given, ...draft, text: old.given.text }, own: { ...old.own, note: text || undefined } }
          : { ...old, given: { ...old.given, ...draft, text } }
        const tasks = data.tasks.map((task) => (task.id === id ? next : task))
        const trialChanged =
          (isTrial(old.given.kind) || isTrial(next.given.kind)) &&
          (old.given.kind !== next.given.kind || old.given.due !== next.given.due || old.given.subjectId !== next.given.subjectId)
        return { ...data, tasks: trialChanged ? retrain(tasks, next, today, uid, new Date().toISOString()) : tasks }
      })
    },

    removeTask: (id) =>
      change((data) => ({ ...data, tasks: data.tasks.filter((task) => task.id !== id && task.parentId !== id) })),

    toggleDone(id) {
      const task = get().data.tasks.find((t) => t.id === id)
      if (!task) return
      const done = isDone(task)
      change(
        mapTask(id, (t) => ({ ...t, own: { ...t.own, seen: true, doneAt: done ? undefined : new Date().toISOString() } })),
        done ? 'undo' : 'yay'
      )
    },

    decipher: (id, note) => change(mapTask(id, (t) => ({ ...t, own: { ...t.own, seen: true, note: note.trim() } })), 'decoded'),

    setNote(id, note) {
      const task = get().data.tasks.find((t) => t.id === id)
      if (!task) return
      const wasMystery = isMystery(task)
      change(
        mapTask(id, (t) => ({ ...t, own: { ...t.own, seen: true, note: note.trim() || undefined } })),
        wasMystery && note.trim() ? 'decoded' : undefined
      )
    },

    markSeen(id) {
      const task = get().data.tasks.find((t) => t.id === id)
      if (task && task.origin === 'magister' && !task.own.seen) change(mapTask(id, (t) => ({ ...t, own: { ...t.own, seen: true } })))
    },

    plan(id, day) {
      const task = get().data.tasks.find((t) => t.id === id)
      if (!task) return
      // Planning past the due day helps nobody, unless it is already late anyway.
      if (day > task.given.due && task.given.due >= get().today) {
        set({ reaction: { kind: 'tooLate', at: Date.now() } })
        return
      }
      change(mapTask(id, (t) => ({ ...t, own: { ...t.own, seen: true, plan: day } })), 'moved')
    },

    setCompanion(patch) {
      const looks = 'species' in patch || 'coat' in patch || 'accessory' in patch || 'eyes' in patch
      change((data) => {
        const companion = { ...data.companion, ...patch }
        // Every animal has its own coats; a new animal keeps the look if it can.
        companion.coat = coatFor(companion.species, companion.coat)
        companion.eyes = eyesFor(companion.eyes)
        return { ...data, companion }
      }, looks ? 'dress' : undefined)
    },

    addSubject: () =>
      change((data) => ({ ...data, subjects: [...data.subjects, { id: uid(), name: '', color: freeColor(data.subjects) }] })),

    renameSubject: (id, name) =>
      change((data) => ({ ...data, subjects: data.subjects.map((s) => (s.id === id ? { ...s, name } : s)) })),

    shortenSubject: (id, short) =>
      change((data) => ({ ...data, subjects: data.subjects.map((s) => (s.id === id ? { ...s, short: short.trim() || undefined } : s)) })),

    recolorSubject: (id, color) => change((data) => ({ ...data, subjects: recolor(data.subjects, id, color) })),

    removeSubject: (id) =>
      change((data) => (subjectInUse(data, id) ? data : { ...data, subjects: data.subjects.filter((s) => s.id !== id) })),

    addLesson: (day, subjectId) =>
      change((data) => ({ ...data, timetable: { ...data.timetable, [day]: [...data.timetable[day], subjectId] } })),

    removeLesson: (day, index) =>
      change((data) => ({
        ...data,
        timetable: { ...data.timetable, [day]: data.timetable[day].filter((_, i) => i !== index) }
      })),

    setReminder: (patch) => change((data) => ({ ...data, reminder: { ...data.reminder, ...patch } })),

    setApp(patch) {
      change((data) => ({ ...data, app: { ...data.app, ...patch } }))
      void window.spellbook.applySettings(get().data.app)
    },

    async connectMagister() {
      set({ sync: { state: 'busy' } })
      const school = await window.spellbook.magister.connect(get().data.magister?.school)
      if (!school) {
        set({ sync: { state: get().data.magister ? 'login' : 'idle' } })
        return
      }
      change((data) => ({ ...data, magister: { ...data.magister, school } }))
      await get().syncMagister()
    },

    async syncMagister() {
      const { data } = get()
      if (!data.magister || syncing) return
      syncing = true
      set({ sync: { state: 'busy' } })

      // This week and four more: the book's two weeks plus room for tests further ahead.
      const from = mondayOf(get().today)
      const to = addDays(from, 34)
      const result = await window.spellbook.magister.sync(data.magister.school, from, to).finally(() => {
        syncing = false
      })
      if (!result.ok) {
        set({ sync: { state: result.reason, message: result.message } })
        return
      }

      const now = new Date().toISOString()
      const outcome = mergeSync(get().data, result.items, { from, to }, get().today, uid, now)
      set({
        data: { ...outcome.data, magister: { ...outcome.data.magister!, studentName: result.student.name, lastSync: now } },
        sync: { state: 'idle' },
        reaction: outcome.added ? { kind: 'synced', at: Date.now(), n: outcome.added } : get().reaction
      })
    },

    async disconnectMagister() {
      await window.spellbook.magister.disconnect()
      change((data) => ({ ...data, magister: undefined, lessons: undefined }))
      set({ sync: { state: 'idle' } })
    }
  }
})

/** The words to show: the book's language, in the book's theme. */
export function useWords(): Dict {
  const lang = useBook((s) => s.data.lang)
  const theme = useBook((s) => s.data.theme)
  return wordsFor(lang, theme)
}

