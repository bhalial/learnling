import { useState, type CSSProperties, type FormEvent } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { dueWhen, shortDay } from '../i18n'
import { daysBetween } from '../lib/dates'
import { isDone, isMystery, isTrial, shownOn, wording } from '../lib/tasks'
import { labelName } from '../lib/subjects'
import { firstLine, pointsElsewhere } from '../lib/text'
import { useBook, useWords } from '../store'
import { subjectInkFor } from '../themes'
import type { Task } from '../types'
import { DecipherIcon, Seal, TickBox } from './ThemeParts'

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

  const t = useWords()
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

  // On the shelf, a narrow card, the button sits in the top corner beside the label, so the
  // task's own words get the whole width of the card.
  const shelf = place === 'shelf'
  const corner = shelf ? 'absolute right-0 top-0' : ''
  // A done task on the page is one quiet line, and a lower row.
  const quiet = done && place === 'page'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      style={{ '--subject': subject?.color ?? '#7a8594', '--subject-ink': subjectInkFor(subject?.color ?? '#7a8594', data.theme) } as CSSProperties}
      className={`flex ${quiet ? 'min-h-9' : 'min-h-[46px]'} touch-manipulation gap-2.5 rounded-md ${shelf ? 'relative items-start' : 'items-center'} ${done ? 'is-done' : ''} ${
        isDragging || gone ? 'opacity-40' : ''
      } ${place === 'overlay' ? 'bg-paper px-3 shadow-xl' : ''}`}
    >
      <span className={`blot size-3.5 shrink-0 bg-[var(--subject)] opacity-90 ${shelf ? 'mt-[3px]' : ''}`} />

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
      ) : quiet ? (
        // Done is done: one quiet line, the subject and the struck-through words.
        <button type="button" onClick={edit} className="flex min-w-0 flex-1 items-baseline gap-2 overflow-hidden whitespace-nowrap text-left">
          <span className="subject-ink shrink-0 text-[11px] font-bold uppercase tracking-[0.1em]" title={subject?.name}>
            {subject && labelName(subject)}
          </span>
          <span className="truncate text-[15px] text-done line-through">{text}</span>
        </button>
      ) : (
        <button type="button" onClick={edit} className="flex min-w-0 flex-1 flex-col items-start text-left">
          {/* Subject, kind and what is special about it; too much for one line wraps rather than
              vanish. Homework is what nearly everything is, so only the other kinds are named. */}
          <span className={`flex max-w-full flex-wrap items-baseline gap-x-2 overflow-hidden whitespace-nowrap ${shelf ? 'min-h-11 pr-12' : ''}`}>
            <span className="subject-ink text-[11px] font-bold uppercase tracking-[0.1em]" title={subject?.name}>
              {subject && labelName(subject)}
            </span>
            {kind !== 'homework' && <span className="text-[13px] italic text-ink-soft">{t.kinds[kind]}</span>}
            {kind === 'test' && t.testName && <span className="trial-chip">{t.testName}</span>}
            {kind === 'quiz' && t.quizName && <span className="trial-chip">{t.quizName}</span>}
            {when && !gone && <span className="text-[13px] italic text-wax">{when}</span>}
            {gone && <span className="text-[13px] italic text-ink-soft">{t.gone}</span>}
            {fresh && <span className="rounded-sm bg-gold px-1.5 text-[12px] font-bold uppercase tracking-wide text-on-gold">{t.fresh}</span>}
            {teams && <span className="text-[13px] italic text-quill">{t.seeTeams}</span>}
            {task.own.note && <span className="text-[13px] italic text-quill">{t.mine}</span>}
          </span>
          <span
            className={`block max-w-full leading-tight ${shelf ? '[overflow-wrap:anywhere]' : 'truncate'} ${
              task.own.note
                ? 'font-hand text-[22px] leading-none text-quill'
                : mystery
                  ? 'text-[16px] italic text-mystery'
                  : 'text-[16px]'
            } ${trial ? 'font-bold' : ''} ${done || gone ? 'text-done line-through' : ''}`}
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
          className={`flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm border-[1.5px] border-ink bg-paper-deep font-fell text-[16px] ${
            shelf ? `w-11 ${corner}` : 'mr-[5px] px-3'
          }`}
        >
          <DecipherIcon />
          {!shelf && t.decipher}
        </button>
      )}

      {gone && !done && (
        <button type="button" onClick={() => removeTask(task.id)} aria-label={t.dismiss} title={t.dismiss} className={`grid size-11 shrink-0 place-items-center text-ink-soft ${corner}`}>
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
          className={`${quiet ? 'h-9 w-11' : 'size-11'} shrink-0 ${corner}`}
        >
          <TickBox small={quiet} />
        </button>
      )}

      {trial && !gone && (
        <span className={`grid size-11 shrink-0 place-items-center ${corner}`}>
          <Seal kind={kind === 'test' ? 'test' : 'quiz'} />
        </span>
      )}
    </div>
  )
}
