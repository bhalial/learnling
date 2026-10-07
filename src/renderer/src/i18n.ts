import type { IsoDate, Kind, Lang } from './types'
import { asDate, daysBetween } from './lib/dates'
import type { ThemeId } from './themes'
import { THEME_WORDS } from './themeWords'

/**
 * The app's words in plain language: a planner with tasks. Every theme but the notebook
 * swaps some of them for its own (themeWords.ts); `wordsFor` puts the two together.
 */
const en = {
  title: 'My planner',
  thisWeek: 'This week',
  nextWeek: 'Next week',
  comingWeek: 'Coming week',
  weekAfter: 'The week after',
  week: (n: number) => `Week ${n}`,
  today: 'Today',
  weekend: 'Weekend',
  newTask: 'New task',
  addOn: (day: string) => `Add something for ${day}`,
  settings: 'Settings',
  zoomIn: 'Bigger',
  zoomOut: 'Smaller',
  zoomReset: (percent: number) => `${percent}%, back to normal size`,
  close: 'Close',
  progress: (done: number, total: number) => `${done} of ${total} done this week`,
  progressEmpty: 'Nothing planned yet this week',

  kinds: {
    homework: 'Homework',
    learn: 'Learn',
    read: 'Read',
    handin: 'Hand in',
    bring: 'Bring',
    test: 'Test',
    quiz: 'Quiz',
    study: 'Practice'
  } satisfies Record<Kind, string>,
  /** A theme's own name for a test and a quiz, shown next to the plain word. */
  testName: null as string | null,
  quizName: null as string | null,
  round: (n: number, of: number) => `Round ${n} of ${of}`,
  mysteryText: 'Homework set, but what?',
  decipher: 'Fill in',
  decipherPrompt: 'What’s the homework?',
  mine: 'written by you',
  markDone: 'Mark done',
  markOpen: 'Not done yet',

  dueToday: 'due today',
  dueTomorrow: 'due tomorrow',
  dueOn: (day: string) => `due ${day}`,
  wasDue: (day: string) => `was due ${day}`,
  wasPlanned: (day: string) => `planned ${day}`,
  inDays: (n: number) => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`),

  attention: 'Still to do',
  attentionHint: 'Drag these to a new day, or tick them off.',
  further: 'Further ahead',
  noLessons: 'No lessons',
  lessons: 'Lessons',
  fresh: 'new',
  seeTeams: 'see Teams',
  gone: 'removed from Magister',
  dismiss: 'Take it out of the book',

  magister: {
    title: 'Magister',
    intro: 'Connect Magister and your lessons, homework and tests come in by themselves. Learnling only reads; it never changes anything in Magister.',
    connect: 'Connect Magister',
    connected: (who: string, school: string) => (who ? `Connected: ${who}, ${school}` : `Connected: ${school}`),
    lastSync: (time: string) => `Last read at ${time}`,
    syncNow: 'Read Magister now',
    syncing: 'Reading Magister…',
    status: (time: string) => `Magister · ${time}`,
    login: 'Log in to Magister',
    error: 'Magister didn’t answer',
    retry: 'Try again',
    disconnect: 'Disconnect',
    fromMagister: 'From Magister',
    teacherWrote: 'What the teacher wrote',
    ownWords: 'In your own words',
    ownWordsHint: 'What exactly do you need to do?'
  },

  reminder: {
    title: 'After-school reminder',
    hint: 'On school days your companion tells you what is waiting.',
    at: 'at',
    test: 'Send a test',
    sample: 'This is how I’ll tell you after school what is waiting.',
    sent: 'Sent! Nothing popped up? Then Windows is holding notifications back: check Do not disturb.'
  },
  background: {
    title: 'In the background',
    tray: 'Keep running next to the clock when the window closes',
    autostart: 'Start with Windows',
    autostartDev: 'Works in the installed app.'
  },
  on: 'On',
  off: 'Off',

  sheet: {
    newTitle: 'A new task',
    editTitle: 'Change this task',
    subject: 'Subject',
    kind: 'What kind?',
    what: 'What do you need to do?',
    whatTrial: 'What is it about?',
    placeholder: 'e.g. p. 52, questions 1–4',
    placeholderTrial: 'e.g. Ancient Egypt, ch. 2 §1–4',
    emptyHint: 'Don’t know yet? Leave it empty and fill it in later.',
    due: 'When is it due?',
    nextLesson: 'next lesson',
    otherDate: 'Another day',
    training: (n: number) => `I’ll plan ${n} practice rounds before it.`,
    add: 'Add to my planner',
    save: 'Save',
    remove: 'Remove',
    noSubjects: 'Add your subjects in Settings first.'
  },

  setup: {
    title: 'Settings',
    companion: 'Your companion',
    companionHint: 'Pick who keeps you company: an animal, or a robot. You can switch whenever you like.',
    companionOpen: 'Change your companion',
    coat: 'Colour',
    wearing: 'Wearing',
    catName: 'Name',
    eyeColor: 'Eye colour',
    catNamePlaceholder: 'Give it a name',
    subjects: 'Subjects',
    subjectName: 'Subject name',
    subjectShort: 'Short name, for the timetable line',
    addSubject: 'Add subject',
    removeSubject: 'Remove subject',
    inUse: 'Still used in your book or timetable',
    color: 'Pick a colour',
    colorSwap: 'Every subject has its own colour. Pick one another subject has, and the two swap.',
    timetable: 'Timetable',
    timetableHint: 'Pick a day, then tap subjects in the order of your lessons. Tap a lesson to remove it.',
    timetableMagister: 'Magister fills in your real lessons. This timetable is only used where Magister has nothing.',
    language: 'Language',
    theme: 'Theme',
    themeHint: 'Pick how your planner looks. Your companion dresses to match.'
  },

  dress: (name: string, animal: string) => (name ? `Dress up ${name}` : `Dress up your ${animal.toLowerCase()}`),
  hat: 'Bow',
  nothing: 'Nothing',

  cat: {
    setup: 'Hi! Connect Magister or fill in your timetable, then I can help you plan.',
    setupButton: 'Open settings',
    mystery: (subject: string) => `${subject} set homework, but nobody wrote down what. Fill it in before you forget!`,
    late: (n: number) => (n === 1 ? 'One task slipped past its day. Drag it to a new one?' : `${n} tasks slipped past their day. Drag them to a new one?`),
    trialSoon: (subject: string, kind: string, when: string) => `${subject} ${kind.toLowerCase()} ${when}. Some practice today?`,
    left: (n: number) => (n === 1 ? 'One task left for today.' : `${n} tasks left for today.`),
    clear: 'Today’s page is clear. Go play some Minecraft!',
    empty: 'Your planner is empty. Tap “New task” when a teacher gives homework.',
    yay: (n: number) => (n === 0 ? 'Nice! That was the last one for today.' : `Nice! ${n} left for today.`),
    /** What follows a companion's own cheer (companions/voices.ts). */
    yayRest: (n: number) => (n === 0 ? 'That was the last one for today.' : `${n} left for today.`),
    decoded: 'Filled in! Now it can’t sneak away.',
    dress: 'Ooh, that suits you.',
    added: 'In your planner!',
    moved: 'Moved. I’ll remind you on the day.',
    tooLate: 'That day is after it’s due. Pick an earlier one!',
    undo: 'No worries, I’ll keep an eye on it.',
    synced: (n: number) => (n === 1 ? 'Magister brought one new task.' : `Magister brought ${n} new tasks.`),
    login: 'Magister wants you to log in again. Tap the button up top.'
  }
}

export type Dict = typeof en

const nl: Dict = {
  title: 'Mijn planner',
  thisWeek: 'Deze week',
  nextWeek: 'Volgende week',
  comingWeek: 'Komende week',
  weekAfter: 'De week erna',
  week: (n) => `Week ${n}`,
  today: 'Vandaag',
  weekend: 'Weekend',
  newTask: 'Nieuwe taak',
  addOn: (day) => `Iets toevoegen voor ${day}`,
  settings: 'Instellingen',
  zoomIn: 'Groter',
  zoomOut: 'Kleiner',
  zoomReset: (percent) => `${percent}%, terug naar normale grootte`,
  close: 'Sluiten',
  progress: (done, total) => `${done} van ${total} taken af deze week`,
  progressEmpty: 'Nog niks gepland deze week',

  kinds: {
    homework: 'Huiswerk',
    learn: 'Leren',
    read: 'Lezen',
    handin: 'Inleveren',
    bring: 'Meenemen',
    test: 'Toets',
    quiz: 'SO',
    study: 'Oefenen'
  },
  testName: null,
  quizName: null,
  round: (n, of) => `Ronde ${n} van ${of}`,
  mysteryText: 'Huiswerk opgegeven, maar wat?',
  decipher: 'Invullen',
  decipherPrompt: 'Wat is het huiswerk?',
  mine: 'door jou geschreven',
  markDone: 'Afvinken',
  markOpen: 'Toch nog niet af',

  dueToday: 'voor vandaag',
  dueTomorrow: 'voor morgen',
  dueOn: (day) => `voor ${day}`,
  wasDue: (day) => `was voor ${day}`,
  wasPlanned: (day) => `gepland ${day}`,
  inDays: (n) => (n === 0 ? 'vandaag' : n === 1 ? 'morgen' : `over ${n} dagen`),

  attention: 'Nog doen',
  attentionHint: 'Sleep ze naar een nieuwe dag, of vink ze af.',
  further: 'Verder vooruit',
  noLessons: 'Geen lessen',
  lessons: 'Lessen',
  fresh: 'nieuw',
  seeTeams: 'zie Teams',
  gone: 'uit Magister gehaald',
  dismiss: 'Uit het boek halen',

  magister: {
    title: 'Magister',
    intro: 'Koppel Magister en je lessen, huiswerk en toetsen komen vanzelf binnen. Learnling leest alleen; het verandert nooit iets in Magister.',
    connect: 'Magister koppelen',
    connected: (who, school) => (who ? `Gekoppeld: ${who}, ${school}` : `Gekoppeld: ${school}`),
    lastSync: (time) => `Laatst gelezen om ${time}`,
    syncNow: 'Magister nu lezen',
    syncing: 'Magister lezen…',
    status: (time) => `Magister · ${time}`,
    login: 'Log in bij Magister',
    error: 'Magister gaf geen antwoord',
    retry: 'Opnieuw',
    disconnect: 'Ontkoppelen',
    fromMagister: 'Uit Magister',
    teacherWrote: 'Wat de docent schreef',
    ownWords: 'In je eigen woorden',
    ownWordsHint: 'Wat moet je precies doen?'
  },

  reminder: {
    title: 'Herinnering na school',
    hint: 'Op schooldagen vertelt je maatje wat er op je wacht.',
    at: 'om',
    test: 'Stuur een test',
    sample: 'Zo vertel ik je na school wat er op je wacht.',
    sent: 'Verstuurd! Niks gezien? Dan houdt Windows meldingen tegen: kijk bij Niet storen.'
  },
  background: {
    title: 'Op de achtergrond',
    tray: 'Blijf naast de klok draaien als het venster dichtgaat',
    autostart: 'Starten met Windows',
    autostartDev: 'Werkt in de geïnstalleerde app.'
  },
  on: 'Aan',
  off: 'Uit',

  sheet: {
    newTitle: 'Een nieuwe taak',
    editTitle: 'Deze taak aanpassen',
    subject: 'Vak',
    kind: 'Wat voor soort?',
    what: 'Wat moet je doen?',
    whatTrial: 'Waar gaat het over?',
    placeholder: 'bijv. blz. 52, vragen 1–4',
    placeholderTrial: 'bijv. Oud-Egypte, H2 §1–4',
    emptyHint: 'Weet je het nog niet? Laat het leeg en vul het later in.',
    due: 'Wanneer moet het af?',
    nextLesson: 'volgende les',
    otherDate: 'Andere dag',
    training: (n) => `Ik plan er ${n} oefenrondes voor in.`,
    add: 'Zet in mijn planner',
    save: 'Opslaan',
    remove: 'Verwijderen',
    noSubjects: 'Zet eerst je vakken in Instellingen.'
  },

  setup: {
    title: 'Instellingen',
    companion: 'Je maatje',
    companionHint: 'Kies wie je gezelschap houdt: een dier of een robot. Wisselen mag altijd.',
    companionOpen: 'Maatje aanpassen',
    coat: 'Kleur',
    wearing: 'Draagt',
    catName: 'Naam',
    eyeColor: 'Oogkleur',
    catNamePlaceholder: 'Geef een naam',
    subjects: 'Vakken',
    subjectName: 'Naam van het vak',
    subjectShort: 'Afkorting, voor de lessenregel',
    addSubject: 'Vak toevoegen',
    removeSubject: 'Vak verwijderen',
    inUse: 'Wordt nog gebruikt in je boek of rooster',
    color: 'Kies een kleur',
    colorSwap: 'Elk vak heeft een eigen kleur. Kies je de kleur van een ander vak, dan ruilen ze.',
    timetable: 'Rooster',
    timetableHint: 'Kies een dag en tik de vakken aan in de volgorde van je lessen. Tik op een les om hem weg te halen.',
    timetableMagister: 'Magister vult je echte lessen in. Dit rooster wordt alleen gebruikt waar Magister niks heeft.',
    language: 'Taal',
    theme: 'Thema',
    themeHint: 'Kies hoe je planner eruitziet. Je maatje kleedt zich erbij aan.'
  },

  dress: (name, animal) => (name ? `Kleed ${name} aan` : `Kleed je ${animal.toLowerCase()} aan`),
  hat: 'Strik',
  nothing: 'Niets',

  cat: {
    setup: 'Hoi! Koppel Magister of vul je rooster in, dan kan ik je helpen plannen.',
    setupButton: 'Open instellingen',
    mystery: (subject) => `${subject} gaf huiswerk, maar er staat niet bij wát. Vul het in voor je het vergeet!`,
    late: (n) => (n === 1 ? 'Er is één taak over zijn dag heen geglipt. Naar een nieuwe dag slepen?' : `Er zijn ${n} taken over hun dag heen geglipt. Naar een nieuwe dag slepen?`),
    trialSoon: (subject, kind, when) => `${kind} ${subject.toLowerCase()} ${when}. Vandaag even oefenen?`,
    left: (n) => (n === 1 ? 'Nog één taak voor vandaag.' : `Nog ${n} taken voor vandaag.`),
    clear: 'De pagina van vandaag is leeg. Ga lekker Minecraften!',
    empty: 'Je planner is nog leeg. Tik op “Nieuwe taak” als je huiswerk krijgt.',
    yay: (n) => (n === 0 ? 'Top! Dat was de laatste voor vandaag.' : `Top! Nog ${n} voor vandaag.`),
    yayRest: (n) => (n === 0 ? 'Dat was de laatste voor vandaag.' : `Nog ${n} voor vandaag.`),
    decoded: 'Ingevuld! Nu kan het niet meer wegsluipen.',
    dress: 'Ooh, staat je goed.',
    added: 'Staat in je planner!',
    moved: 'Verplaatst. Ik herinner je eraan op die dag.',
    tooLate: 'Die dag is ná de inleverdag. Kies een eerdere!',
    undo: 'Geen zorgen, ik hou hem in de gaten.',
    synced: (n) => (n === 1 ? 'Magister bracht één nieuwe taak.' : `Magister bracht ${n} nieuwe taken.`),
    login: 'Magister wil dat je opnieuw inlogt. Tik op de knop bovenin.'
  }
}

/** The plain words, without a theme: what the notebook theme uses. */
export const dictionaries: Record<Lang, Dict> = { en, nl }

/**
 * What a theme may change: any word, and within a group (cat, sheet, kinds…) any single
 * one of its words.
 */
export type ThemeWords = {
  [K in keyof Dict]?: Dict[K] extends (...args: never[]) => unknown ? Dict[K] : Dict[K] extends object ? Partial<Dict[K]> : Dict[K]
}

const merged = new Map<string, Dict>()

/** The words for a language in a theme: the plain words with the theme's own laid over them. */
export function wordsFor(lang: Lang, theme: ThemeId): Dict {
  const key = `${theme}:${lang}`
  const known = merged.get(key)
  if (known) return known
  const base = dictionaries[lang] as Record<string, unknown>
  const own = (THEME_WORDS[theme][lang] ?? {}) as Record<string, unknown>
  const words = { ...base }
  for (const [name, value] of Object.entries(own)) {
    const plain = base[name]
    words[name] = plain && typeof plain === 'object' ? { ...plain, ...(value as object) } : value
  }
  merged.set(key, words as Dict)
  return words as Dict
}

const locale = (lang: Lang): string => (lang === 'nl' ? 'nl-NL' : 'en-GB')

const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/** "Wed" / "Wo" */
export function weekdayName(date: IsoDate, lang: Lang): string {
  const name = new Intl.DateTimeFormat(locale(lang), { weekday: 'short', timeZone: 'UTC' }).format(asDate(date))
  return capital(name.replace('.', ''))
}

/** "Wed 30" / "Wo 30" */
export function shortDay(date: IsoDate, lang: Lang): string {
  return `${weekdayName(date, lang)} ${Number(date.slice(8))}`
}

/** "28 Sep – 2 Oct", or "5 – 9 Oct" within one month. */
export function range(from: IsoDate, to: IsoDate, lang: Lang): string {
  const fmt = (date: IsoDate, month: boolean): string =>
    new Intl.DateTimeFormat(locale(lang), month ? { day: 'numeric', month: 'short', timeZone: 'UTC' } : { day: 'numeric', timeZone: 'UTC' })
      .format(asDate(date))
      .replace('.', '')
  return `${fmt(from, from.slice(5, 7) !== to.slice(5, 7))} – ${fmt(to, true)}`
}

/** "14:05" */
export function clock(timestamp: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp))
}

/** A due day relative to today: "today", "tomorrow", "Fri", or "Mon 12" further out. */
export function dueWhen(due: IsoDate, today: IsoDate, lang: Lang): string {
  const t = dictionaries[lang]
  const days = daysBetween(today, due)
  if (days === 0) return t.dueToday
  if (days === 1) return t.dueTomorrow
  return t.dueOn(days > 1 && days < 7 ? weekdayName(due, lang) : shortDay(due, lang))
}
