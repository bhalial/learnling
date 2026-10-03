import { useState, type CSSProperties, type FormEvent } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { dictionaries, dueWhen, shortDay } from '../i18n'
import { daysBetween } from '../lib/dates'
import { isDone, isMystery, isTrial, shownOn, wording } from '../lib/tasks'
import { firstLine, pointsElsewhere } from '../lib/text'
import { useBook } from '../store'
import type { Task } from '../types'
import { Seal } from './Seal'

type Place = 'page' | 'shelf' | 'overlay'

export function TaskCard({ task, place }: { task: Task; place: Place }) {
  const data = useBook((s) => s.data)
  const today = useBook((s) => s.today)
  const openSheet = useBook((s) => s.openSheet)
  const toggleDone = useBook((s) => s.toggleDone)
  const decipher = useBook((s) => s.decipher)
  const markSeen = useBook((s) => s.markSeen)
  const removeTask = useBook((s) => s.removeTask)
  const [deciphering, setDeciphering] = useState(false)

  const t = dictionaries[data.lang]
  const { kind, due, round, gone } = task.given
  const trial = isTrial(kind)
  const mystery = isMystery(task)
  const done = isDone(task)
  const fresh = task.origin === 'magister' && !task.own.seen && !done && !gone
  const teams = !gone && pointsElsewhere(task.given.text)
  const subject = data.subjects.find((s) => s.id === task.given.subjectId)
  const parent = task.parentId ? data.tasks.find((p) => p.id === task.parentId) : undefined

  const { listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, disabled: trial || gone || place === 'overlay' })

  // Teacher texts can run to paragraphs; the card shows the first line, the sheet the rest.
  const text = round
    ? [t.round(round.n, round.of), parent && firstLine(wording(parent))].filter(Boolean).join(' · ')
    : mystery && !task.given.text
      ? t.mysteryText
      : firstLine(wording(task))

  let when = ''
  if (trial) when = due >= today ? t.inDays(daysBetween(today, due)) : ''
  else if (place === 'shelf') when = due < today ? t.wasDue(shortDay(due, data.lang)) : t.wasPlanned(shortDay(shownOn(task), data.lang))
  else if (shownOn(task) !== due) when = dueWhen(due, today, data.lang)

  const edit = (): void => {
    markSeen(task.id)
    openSheet({ mode: 'edit', id: task.parentId ?? task.id })
  }

  const save = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const note = new FormData(event.currentTarget).get('note')?.toString().trim()
    if (note) decipher(task.id, note)
    setDeciphering(false)
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      style={{ '--subject': subject?.color ?? '#7a8594' } as CSSProperties}
      className={`flex min-h-[50px] touch-manipulation items-center gap-3 rounded-md ${done ? 'is-done' : ''} ${
        isDragging || gone ? 'opacity-40' : ''
      } ${place === 'overlay' ? 'bg-paper px-3 shadow-xl' : ''}`}
    >
      <span className="blot size-3.5 shrink-0 bg-[var(--subject)] opacity-90" />

      {deciphering ? (
        <form onSubmit={save} className="flex min-w-0 flex-1 items-center gap-2">
          <input
            name="note"
            autoFocus
            aria-label={t.decipherPrompt}
            placeholder={t.decipherPrompt}
            onKeyDown={(e) => e.key === 'Escape' && setDeciphering(false)}
            onPointerDown={(e) => e.stopPropagation()}
            className="min-w-0 flex-1 border-b-2 border-quill bg-transparent font-hand text-[23px] text-quill outline-none placeholder:text-quill/40"
          />
          <button type="submit" aria-label={t.decipher} className="grid size-11 shrink-0 place-items-center rounded-sm border-[1.5px] border-ink bg-paper-deep">
            <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-quill stroke-[2.5]" aria-hidden="true">
              <path d="M4 13 L9 18 L20 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      ) : (
        <button type="button" onClick={edit} className="flex min-w-0 flex-1 flex-col items-start text-left">
          <span className="flex max-w-full items-baseline gap-2 overflow-hidden whitespace-nowrap">
            <span className="subject-ink text-[11.5px] font-bold uppercase tracking-[0.1em]">{subject?.name}</span>
            <span className="text-[13.5px] italic text-ink-soft">{t.kinds[kind]}</span>
            {when && !gone && <span className="text-[13.5px] italic text-wax">{when}</span>}
            {gone && <span className="text-[13.5px] italic text-ink-soft">{t.gone}</span>}
            {fresh && <span className="rounded-sm bg-gold px-1.5 text-[12px] font-bold uppercase tracking-wide text-ink">{t.fresh}</span>}
            {teams && <span className="text-[13.5px] italic text-quill">{t.seeTeams}</span>}
            {task.own.note && <span className="text-[13.5px] italic text-quill">{t.mine}</span>}
          </span>
          <span
            className={`block max-w-full leading-tight ${place === 'shelf' ? '' : 'truncate'} ${
              task.own.note
                ? 'font-hand text-[23px] leading-none text-quill'
                : mystery
                  ? 'text-[16.5px] italic text-[#8a6a3a]'
                  : 'text-[16.5px]'
            } ${trial ? 'font-bold' : ''} ${done || gone ? 'text-[#8a7a64] line-through' : ''}`}
          >
            {text}
          </span>
        </button>
      )}

      {mystery && !deciphering && (
        <button
          type="button"
          onClick={() => setDeciphering(true)}
          aria-label={t.decipher}
          className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-sm border-[1.5px] border-ink bg-paper-deep font-fell text-[17px] ${
            place === 'shelf' ? 'w-11' : 'px-3.5'
          }`}
        >
          <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-ink stroke-[1.6]" aria-hidden="true">
            <path d="M5 20 C 9 12, 14 6, 22 2 C 19 10, 13 16, 7 19 Z M5 20 L3 23" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          {place !== 'shelf' && t.decipher}
        </button>
      )}

      {gone && !done && (
        <button type="button" onClick={() => removeTask(task.id)} aria-label={t.dismiss} title={t.dismiss} className="grid size-11 shrink-0 place-items-center text-ink-soft">
          <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2" aria-hidden="true">
            <path d="M6 6 L18 18 M18 6 L6 18" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {!trial && !mystery && !deciphering && !(gone && !done) && (
        <button
          type="button"
          onClick={() => toggleDone(task.id)}
          aria-label={`${done ? t.markOpen : t.markDone}: ${subject?.name ?? ''}, ${text}`}
          aria-pressed={done}
          className="size-11 shrink-0"
        >
          <svg viewBox="0 0 42 42" className="size-11" aria-hidden="true">
            <path
              d="M8 9 C 14 7.5, 26 8, 34 8.5 C 35.5 16, 35 26, 34.5 34 C 26 35.5, 15 35, 8.5 34.5 C 7.5 26, 8 16, 8 9 Z"
              className="fill-none stroke-ink stroke-2"
              strokeLinejoin="round"
            />
            <path d="M13 22 L19 29 L35 8" className="tick fill-none stroke-quill stroke-[3.5]" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {trial && !gone && (
        <span className="grid size-11 shrink-0 place-items-center">
          <Seal kind={kind === 'test' ? 'test' : 'quiz'} />
        </span>
      )}
    </div>
  )
}
