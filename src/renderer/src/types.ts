import type { CompanionLook } from './companions/types'

export type Lang = 'en' | 'nl'

/** A calendar day as 'YYYY-MM-DD'. */
export type IsoDate = string

export type Kind = 'homework' | 'learn' | 'read' | 'handin' | 'bring' | 'test' | 'quiz' | 'study'

/** Mon = 1 … Fri = 5. */
export type Weekday = 1 | 2 | 3 | 4 | 5

export interface Subject {
  id: string
  name: string
  color: string
  /** Magister's subject id, so renaming never breaks the match. */
  externalId?: string
}

export interface Lesson {
  subjectId: string
  hour: number | null
  cancelled?: boolean
}

/**
 * What was set: typed in by her now, and later also delivered by a Magister
 * sync. A sync may overwrite this part, never `Own`.
 */
export interface Given {
  subjectId: string
  kind: Kind
  /** Empty means "there is homework, but nobody said what": a mystery scroll. */
  text: string
  due: IsoDate
  /** Training rounds for a test: round n of `of`. */
  round?: { n: number; of: number }
  /** The teacher took it out of Magister. */
  gone?: boolean
}

/** What she does with it. Belongs to her alone; a sync never touches it. */
export interface Own {
  /** The day she plans to do it. Without one, it sits on its due day. */
  plan?: IsoDate
  doneAt?: string
  /** Her own words, e.g. the homework she deciphered. */
  note?: string
  /** She has looked at it since it arrived from Magister. */
  seen?: boolean
}

export interface Task {
  id: string
  origin: 'self' | 'magister'
  externalId?: string
  /** Training rounds point at the test they train for. */
  parentId?: string
  given: Given
  own: Own
  createdAt: string
}

/** Her companion: which animal, how it looks, and the name she gave it. */
export interface CompanionSettings extends CompanionLook {
  name: string
}

export interface MagisterLink {
  /** e.g. 'school.magister.net' */
  school: string
  studentName?: string
  lastSync?: string
  /** The days the last sync covered; lessons outside it come from the timetable. */
  from?: IsoDate
  to?: IsoDate
}

export interface SpellbookData {
  version: 1
  lang: Lang
  subjects: Subject[]
  /** Subject ids per lesson, in order, for each school day. The fallback when Magister is not linked. */
  timetable: Record<Weekday, string[]>
  tasks: Task[]
  companion: CompanionSettings
  magister?: MagisterLink
  /** Real lessons per day from Magister, for the synced range. */
  lessons?: Record<IsoDate, Lesson[]>
  reminder: { enabled: boolean; time: string; lastSent?: IsoDate }
  app: { tray: boolean; autostart: boolean }
}

export interface Boot {
  data: unknown
  demo: boolean
  today: IsoDate | null
}

/** One appointment as the main process hands it over: Magister's fields, trimmed. */
export interface MagisterItem {
  id: number
  start: string
  hour: number | null
  type: number
  status: number
  infoType: number
  html: string | null
  subjects: Array<{ id: number; name: string }>
}

export type MagisterSync =
  | { ok: true; student: { id: number; name: string }; items: MagisterItem[] }
  | { ok: false; reason: 'login' | 'error'; message?: string }
