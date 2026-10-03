import type { ReactNode } from 'react'
import { isDone } from '../lib/tasks'
import { useBook, useWords } from '../store'
import type { ThemeId } from '../themes'
import type { Task } from '../types'

/**
 * The few parts each theme draws its own way. Colours and shapes that CSS can change live
 * in styles.css; these are the ones that need different drawings: icons, the progress row,
 * what the companion stands on, the tick box and the test seal.
 */

const useTheme = (): ThemeId => useBook((s) => s.data.theme)

// ---------- icons: 24 × 24, drawn with the stroke

const QUILL = <path d="M5 20 C 9 12, 14 6, 22 2 C 19 10, 13 16, 7 19 Z M5 20 L3 23" />

const ICONS = {
  quill: QUILL,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  rocket: (
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </>
  ),
  signal: (
    <>
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </>
  ),
  sprout: (
    <>
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </>
  ),
  scroll: (
    <>
      <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    </>
  ),
  pencil: (
    <>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
      <path d="M15 5l4 4" />
    </>
  ),
  anchor: (
    <>
      <circle cx="12" cy="5" r="3" />
      <path d="M12 22V8" />
      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    </>
  ),
  waves: (
    <>
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </>
  ),
  swords: (
    <>
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6M16 16l4 4M19 21l2-2" />
      <path d="M14.5 6.5L18 3h3v3l-3.5 3.5" />
      <path d="M5 14l4 4M7 17l-3 3M3 19l2 2" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  carrot: (
    <>
      <path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7z" />
      <path d="M8.64 14l-2.05-2.04M15.34 15l-2.46-2.46" />
      <path d="M22 9s-1.33-2-3.5-2C16.86 7 15 9 15 9s1.33 2 3.5 2S22 9 22 9z" />
      <path d="M15 2s-2 1.33-2 3.5S15 9 15 9s2-1.84 2-3.5C17 3.33 15 2 15 2z" />
    </>
  ),
  apple: (
    <>
      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06z" />
      <path d="M10 2c1 .5 2 2 2 5" />
    </>
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </>
  )
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof ICONS

export function Icon({ name, className = 'size-5', size, width = 2 }: { name: IconName; className?: string; size?: number; width?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`shrink-0 fill-none stroke-current ${size ? '' : className}`}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}

/** The icon on the big "new" button, and on the button that fills in a mystery task. */
const NEW_ICON: Record<ThemeId, IconName> = { magic: 'quill', garden: 'sprout', ocean: 'plus', space: 'rocket', quest: 'plus', notebook: 'pencil' }
const DECIPHER_ICON: Record<ThemeId, IconName> = { magic: 'quill', garden: 'search', ocean: 'scroll', space: 'signal', quest: 'eye', notebook: 'pencil' }

export function NewIcon() {
  const theme = useTheme()
  return <Icon name={NEW_ICON[theme]} width={theme === 'magic' ? 1.6 : 2.4} />
}

export function DecipherIcon() {
  const theme = useTheme()
  return <Icon name={DECIPHER_ICON[theme]} width={theme === 'magic' ? 1.6 : 2.2} />
}

// ---------- the week's progress, in the top bar

/** XP for the questlog's level: a training round is worth more than a plain task. */
export function experience(tasks: Task[]): number {
  return tasks.filter(isDone).reduce((xp, task) => xp + (task.given.kind === 'study' ? 25 : 10), 0)
}

const LEVEL_XP = 250

/** One mark per task this week (`marks` of them, `filled` done), drawn the theme's way. */
export function ProgressMarks({ marks, filled }: { marks: number; filled: number }) {
  const theme = useTheme()
  const tasks = useBook((s) => s.data.tasks)
  const each = Array.from({ length: marks }, (_, i) => i < filled)

  switch (theme) {
    case 'space':
      return (
        <div className="flex gap-1 rounded-lg border border-[#2b3d7a] bg-[#0f1633] p-1" aria-hidden="true">
          {each.map((on, i) => (
            <span key={i} className={`block h-3.5 w-3 rounded-[2px] ${on ? 'bg-wax' : 'bg-[#1c2650]'}`} />
          ))}
        </div>
      )
    case 'quest': {
      const xp = experience(tasks)
      return (
        <div className="flex items-center gap-2.5" aria-hidden="true">
          <span className="rounded-md bg-quill px-2 py-0.5 font-fell text-[14px] text-[#1a1033]">LVL {Math.floor(xp / LEVEL_XP) + 1}</span>
          <span className="block h-4 w-48 overflow-hidden rounded-md border-[3px] border-[#0e0820] bg-[#2a1d4d]">
            <span className="block h-full bg-quill" style={{ width: `${((xp % LEVEL_XP) / LEVEL_XP) * 100}%` }} />
          </span>
        </div>
      )
    }
    case 'garden':
      return (
        <div className="flex gap-0.5 text-[#3f7a2a]" aria-hidden="true">
          {each.map((on, i) => (
            <svg key={i} viewBox="0 0 24 24" className={`size-[18px] stroke-current ${on ? 'fill-[#7fbf55]' : 'fill-none opacity-50'}`} strokeWidth={1.6} strokeLinejoin="round">
              {ICONS.leaf}
            </svg>
          ))}
        </div>
      )
    case 'ocean':
      return (
        <div className="flex gap-1.5" aria-hidden="true">
          {each.map((on, i) => (
            <span
              key={i}
              className={`block size-3.5 rounded-full ${on ? 'bg-[#fffaf0] shadow-[inset_-3px_-3px_0_#e2cfa6]' : 'border-2 border-dashed border-cream/40'}`}
            />
          ))}
        </div>
      )
    case 'notebook':
      return (
        <div className="flex gap-1" aria-hidden="true">
          {each.map((on, i) => (
            <span key={i} className="grid size-[15px] place-items-center rounded-[3px] border-[1.5px] border-cream text-cream">
              {on && <Icon name="check" className="size-3" width={3.2} />}
            </span>
          ))}
        </div>
      )
    default:
      return (
        <div className="flex gap-1.5" aria-hidden="true">
          {each.map((on, i) => (
            <span key={i} className={`size-4 rounded-full ${on ? 'seal-on' : 'seal'}`} />
          ))}
        </div>
      )
  }
}

// ---------- what the companion stands on

export function Platform() {
  const theme = useTheme()
  switch (theme) {
    case 'space':
      return (
        <div className="relative h-[34px] w-[226px]" aria-hidden="true">
          <span className="absolute inset-x-6 top-0 block h-3 rounded-[50%] bg-[rgb(77_214_255/0.28)]" />
          <span className="absolute inset-x-0 top-1.5 block h-3.5 rounded-[4px] border-t-[3px] border-wax bg-[#2b3566]" />
          <span className="absolute left-5 top-5 block h-3.5 w-2.5 bg-[#2b3566]" />
          <span className="absolute right-5 top-5 block h-3.5 w-2.5 bg-[#2b3566]" />
        </div>
      )
    case 'quest':
      return (
        <div className="flex" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-[30px] w-[72px] border-[3px] border-[#0e0820] bg-[#ffd23f] shadow-[inset_-4px_-4px_0_#c99a2e,inset_4px_4px_0_#ffe98a]" />
          ))}
        </div>
      )
    case 'garden':
      return (
        <div className="relative h-[40px] w-[234px] text-[#3d7027]" aria-hidden="true">
          <span className="absolute inset-x-0 bottom-0 block h-[26px] rounded-[999px_999px_10px_10px] bg-[#7a4f2c] shadow-[inset_0_3px_0_#94623a]" />
          <span className="absolute bottom-[18px] left-2">
            <Icon name="sprout" className="size-6" width={2.2} />
          </span>
          <span className="absolute bottom-[18px] right-3">
            <Icon name="sprout" className="size-5" width={2.2} />
          </span>
        </div>
      )
    case 'ocean':
      return (
        <div className="relative h-[42px] w-[240px]" aria-hidden="true">
          <span className="absolute inset-x-0 bottom-0 block h-[28px] rounded-[100%_100%_10px_10px/100%_100%_10px_10px] bg-[#e9cf96] shadow-[inset_0_3px_0_#f4e0b2]" />
          <svg viewBox="0 0 22 40" className="absolute bottom-3 left-3 h-10 w-[22px] fill-none stroke-[#3fa37a] stroke-[3]" strokeLinecap="round">
            <path d="M11 40c-6-6 6-10 0-16s6-10 0-18" />
          </svg>
          <svg viewBox="0 0 18 14" className="absolute bottom-2 right-6 h-3.5 w-[18px] fill-[#ffb4a6] stroke-[#c4553f] stroke-[1.6]" strokeLinejoin="round">
            <path d="M9 1L1 13h16z M9 1v12M5 13l4-12 4 12" />
          </svg>
        </div>
      )
    case 'notebook':
      return (
        <div className="flex flex-col items-center" aria-hidden="true">
          <span className="block h-[16px] w-[200px] rounded-[3px] border-[1.5px] border-[#2b2b33] bg-[#b3d4ff]" />
          <span className="block h-[18px] w-[226px] rounded-b-[3px] border-[1.5px] border-t-0 border-[#2b2b33] bg-[#ffb3a7]" />
        </div>
      )
    default:
      return (
        <div className="flex flex-col items-center" aria-hidden="true">
          <span className="stack-book block h-[17px] w-[206px] rounded-[3px] bg-[#6b2b2b]" />
          <span className="stack-book block h-[17px] w-[234px] rounded-[3px] bg-[#2f4a6b]" />
          <span className="stack-book block h-[17px] w-[220px] rounded-[3px] bg-[#56622c]" />
        </div>
      )
  }
}

// ---------- the tick box and the test seal

/** The box a task is ticked off in. The spellbook's is drawn by hand; the garden's sprouts. */
export function TickBox() {
  const theme = useTheme()
  if (theme === 'magic') {
    return (
      <svg viewBox="0 0 42 42" className="size-11" aria-hidden="true">
        <path
          d="M8 9 C 14 7.5, 26 8, 34 8.5 C 35.5 16, 35 26, 34.5 34 C 26 35.5, 15 35, 8.5 34.5 C 7.5 26, 8 16, 8 9 Z"
          className="fill-none stroke-ink stroke-2"
          strokeLinejoin="round"
        />
        <path d="M13 22 L19 29 L35 8" className="tick fill-none stroke-quill stroke-[3.5]" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <span className="tickbox mx-auto">
      {theme === 'garden' ? <Icon name="sprout" className="size-5" width={2.2} /> : <Icon name="check" className="size-5" width={3} />}
    </span>
  )
}

const EDGE =
  'M20 3 C 26 2, 29 6, 33 8 C 37 11, 37 16, 37 20 C 38 25, 35 29, 32 33 C 28 37, 24 37, 20 37 C 15 38, 11 35, 8 32 C 4 28, 3 24, 3 20 C 2 15, 5 11, 8 8 C 11 5, 15 3, 20 3 Z'
const STAR = 'M20 13 L22 18 L27 18 L23 21.5 L24.5 27 L20 24 L15.5 27 L17 21.5 L13 18 L18 18 Z'
const BOLT = 'M22 11 L15 22 L20 22 L18 29 L25 18 L20 18 Z'

/** For each theme: the badge's ground, rim, mark, and icon, for a test and for a quiz. */
const BADGES: Partial<Record<ThemeId, Record<'test' | 'quiz', { ground: string; rim: string; mark: string; icon: IconName; square?: boolean }>>> = {
  space: {
    test: { ground: '#ff9a3c', rim: 'rgb(255 154 60 / 0.25)', mark: '#1a1030', icon: 'rocket' },
    quiz: { ground: '#4dd6ff', rim: 'rgb(77 214 255 / 0.25)', mark: '#0b1026', icon: 'rocket' }
  },
  quest: {
    test: { ground: '#cc3f57', rim: '#0e0820', mark: '#ffffff', icon: 'swords', square: true },
    quiz: { ground: '#ffd23f', rim: '#0e0820', mark: '#1a1033', icon: 'shield', square: true }
  },
  garden: {
    test: { ground: '#ffb36b', rim: '#d9762b', mark: '#5a2e0a', icon: 'carrot' },
    quiz: { ground: '#f7d4e0', rim: '#d0569a', mark: '#8a2350', icon: 'apple' }
  },
  ocean: {
    test: { ground: '#0f4c5c', rim: '#2f7a88', mark: '#fdf3dc', icon: 'anchor' },
    quiz: { ground: '#ffd9d1', rim: '#ff7f6a', mark: '#8a2a18', icon: 'waves' }
  }
}

/**
 * What a test or quiz carries instead of a tick box: a wax seal in the spellbook, a badge
 * with the theme's mark elsewhere, a strip of tape in the notebook.
 */
export function Seal({ kind, size = 40 }: { kind: 'test' | 'quiz'; size?: number }) {
  const theme = useTheme()
  const t = useWords()
  const test = kind === 'test'

  if (theme === 'notebook') {
    return (
      <span
        aria-hidden="true"
        className={`block px-2 py-1 font-sans font-extrabold tracking-[0.08em] uppercase shadow-[0_2px_4px_rgb(60_50_30/0.14)] ${
          test ? '-rotate-4 bg-[#ffb3a7] text-[#5a1a10]' : 'rotate-3 bg-[#b3d4ff] text-[#10305a]'
        }`}
        style={{ fontSize: size < 36 ? 10 : 12 }}
      >
        {t.kinds[kind]}
      </span>
    )
  }

  const badge = BADGES[theme]?.[kind]
  if (badge) {
    const edge = Math.max(2, Math.round(size / 13))
    return (
      <span
        aria-hidden="true"
        className="grid place-items-center"
        style={{
          width: size,
          height: size,
          background: badge.ground,
          color: badge.mark,
          borderRadius: badge.square ? size / 4 : '50%',
          boxShadow: badge.square ? `inset 0 0 0 ${edge}px ${badge.rim}, 0 3px 0 ${badge.rim}` : `0 0 0 ${edge + 1}px ${badge.rim}`
        }}
      >
        <Icon name={badge.icon} size={Math.round(size * 0.5)} width={2.2} />
      </span>
    )
  }

  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="drop-shadow-[0_2px_1px_rgb(0_0_0/0.3)]">
      <path d={EDGE} fill={test ? '#a32c25' : '#2f4a7a'} />
      <circle cx="20" cy="20" r="11" fill={test ? '#8a2019' : '#253c66'} stroke={test ? '#c2463d' : '#4c6aa0'} strokeWidth="1" />
      <path d={test ? STAR : BOLT} fill={test ? '#efc4ad' : '#c7d6f2'} />
    </svg>
  )
}
