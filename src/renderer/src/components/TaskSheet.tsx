import { useState, type CSSProperties, type FormEvent } from 'react'
import { dictionaries, dueWhen, shortDay } from '../i18n'
import { addDays, daysBetween, nextSchoolDay, windowStart } from '../lib/dates'
import { nextLesson } from '../lib/lessons'
import { isTrial, TRAINING_ROUNDS, trainingDays, wording } from '../lib/tasks'
import { useBook, type Sheet } from '../store'
import type { IsoDate, Kind, Task } from '../types'
import { Modal, SheetHeader } from './Modal'

const KINDS: Kind[] = ['homework', 'learn', 'read', 'handin', 'bring', 'test', 'quiz']

export function TaskSheet() {
  const sheet = useBook((s) => s.sheet)
  const openSheet = useBook((s) => s.openSheet)
  const tasks = useBook((s) => s.data.tasks)
  const t = dictionaries[useBook((s) => s.data.lang)]
  const magisterTask = sheet?.mode === 'edit' ? tasks.find((task) => task.id === sheet.id && task.origin === 'magister') : undefined

  return (
    <Modal open={sheet !== null} onClose={() => openSheet(null)} label={sheet?.mode === 'edit' ? t.sheet.editTitle : t.sheet.newTitle} width={680}>
      {magisterTask ? (
        <MagisterTask key={magisterTask.id} task={magisterTask} />
      ) : (
        sheet && <TaskForm key={sheet.mode === 'edit' ? sheet.id : `new-${sheet.due ?? ''}`} sheet={sheet} />
      )}
    </Modal>
  )
}

/** Work from Magister: the teacher's words as they are, plus room for the student's own. */
function MagisterTask({ task }: { task: Task }) {
  const data = useBook((s) => s.data)
  const today = useBook((s) => s.today)
  const { setNote, openSheet } = useBook.getState()
  const t = dictionaries[data.lang]
  const [note, setNoteText] = useState(task.own.note ?? '')
  const subject = data.subjects.find((s) => s.id === task.given.subjectId)
  const { kind, due, text } = task.given

  const save = (event: FormEvent): void => {
    event.preventDefault()
    setNote(task.id, note)
    openSheet(null)
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5 px-8 pb-6">
      <SheetHeader closeLabel={t.close} onClose={() => openSheet(null)}>
        <h2 className="subject-ink m-0 font-fell text-[30px] font-normal" style={{ '--subject': subject?.color } as CSSProperties}>
          {subject?.name} · {t.kinds[kind]}
        </h2>
        <p className="m-0 text-[15px] italic text-ink-soft">
          {t.magister.fromMagister} · {isTrial(kind) ? `${shortDay(due, data.lang)}, ${t.inDays(daysBetween(today, due))}` : dueWhen(due, today, data.lang)}
        </p>
      </SheetHeader>

      <section>
        <h3 className={label}>{t.magister.teacherWrote}</h3>
        <div className="max-h-64 select-text overflow-y-auto whitespace-pre-line rounded-sm bg-paper-deep/70 px-4 py-3 text-[17px] leading-relaxed">
          {text || t.mysteryText}
        </div>
      </section>

      <label className="block">
        <span className={label}>{t.magister.ownWords}</span>
        <input
          value={note}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={t.magister.ownWordsHint}
          className="h-12 w-full border-0 border-b-[1.5px] border-ink bg-transparent px-1 font-hand text-[24px] text-quill outline-none placeholder:font-sans placeholder:text-[16px] placeholder:italic placeholder:text-ink-soft/60"
        />
      </label>

      <div className="flex items-center justify-end gap-3 border-t border-ink/20 pt-4">
        <button type="submit" className="h-12 rounded-sm bg-ink px-6 font-fell text-[20px] text-paper">
          {t.sheet.save}
        </button>
      </div>
    </form>
  )
}

const label = 'mb-2 block font-fell text-[19px]'
const chip = 'flex h-11 items-center gap-2 rounded-sm border-[1.5px] px-3 text-[16px]'
const chipOn = 'border-ink bg-paper-deep'
const chipOff = 'border-ink/25'

function TaskForm({ sheet }: { sheet: NonNullable<Sheet> }) {
  const data = useBook((s) => s.data)
  const today = useBook((s) => s.today)
  const { addTask, updateTask, removeTask, openSheet } = useBook.getState()
  const t = dictionaries[data.lang]

  const existing = sheet.mode === 'edit' ? data.tasks.find((task) => task.id === sheet.id) : undefined
  const presetDue = existing?.given.due ?? (sheet.mode === 'new' ? sheet.due : undefined)

  const [subjectId, setSubjectId] = useState(existing?.given.subjectId ?? '')
  const [kind, setKind] = useState<Kind>(existing?.given.kind ?? 'homework')
  const [text, setText] = useState(existing ? wording(existing) : '')
  // Until a day is picked by hand, the due day follows the next lesson of the chosen subject.
  const [due, setDue] = useState<IsoDate | undefined>(presetDue)

  const suggested = subjectId ? nextLesson(data, subjectId, today) : null
  const dueDay = due ?? suggested ?? nextSchoolDay(today)
  const trial = isTrial(kind)
  const rounds = trial && !existing ? trainingDays(dueDay, today, TRAINING_ROUNDS[kind] ?? 0).length : 0

  const start = windowStart(today)
  const weeks = [0, 7].map((offset) => [0, 1, 2, 3, 4].map((i) => addDays(start, offset + i)))

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    if (!subjectId) return
    const draft = { subjectId, kind, text, due: dueDay }
    if (existing) updateTask(existing.id, draft)
    else addTask(draft)
    openSheet(null)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 px-8 pb-6">
      <SheetHeader closeLabel={t.close} onClose={() => openSheet(null)}>
        <h2 className="m-0 font-fell text-[30px] font-normal">{existing ? t.sheet.editTitle : t.sheet.newTitle}</h2>
      </SheetHeader>

      <fieldset className="m-0 border-0 p-0">
        <legend className={label}>{t.sheet.subject}</legend>
        {data.subjects.length === 0 && <p className="m-0 italic text-ink-soft">{t.sheet.noSubjects}</p>}
        <div className="flex flex-wrap gap-2">
          {data.subjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => setSubjectId(subject.id)}
              aria-pressed={subjectId === subject.id}
              style={{ '--subject': subject.color } as CSSProperties}
              className={`${chip} ${subjectId === subject.id ? chipOn : chipOff}`}
            >
              <span className="blot size-3.5 bg-[var(--subject)]" />
              {subject.name || '…'}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className={label}>{t.sheet.kind}</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={kind === k} className={`${chip} ${kind === k ? chipOn : chipOff}`}>
              {t.kinds[k]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className={label}>{trial ? t.sheet.whatTrial : t.sheet.what}</span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={trial ? t.sheet.placeholderTrial : t.sheet.placeholder}
          className="h-12 w-full border-0 border-b-[1.5px] border-ink bg-transparent px-1 text-[18px] outline-none placeholder:italic placeholder:text-ink-soft/60 focus:border-quill"
        />
        {!trial && <span className="mt-1.5 block text-[14px] italic text-ink-soft">{t.sheet.emptyHint}</span>}
      </label>

      <fieldset className="m-0 border-0 p-0">
        <legend className={label}>{t.sheet.due}</legend>
        <div className="flex flex-col gap-2">
          {weeks.map((week) => (
            <div key={week[0]} className="grid grid-cols-5 gap-2">
              {week.map((day) => (
                <button
                  key={day}
                  type="button"
                  disabled={day < today}
                  onClick={() => setDue(day)}
                  aria-pressed={dueDay === day}
                  className={`flex h-14 flex-col items-center justify-center rounded-sm border-[1.5px] text-[16px] disabled:opacity-30 ${
                    dueDay === day ? chipOn : chipOff
                  }`}
                >
                  {shortDay(day, data.lang)}
                  {day === suggested && <span className="text-[12px] italic leading-none text-wax">{t.sheet.nextLesson}</span>}
                </button>
              ))}
            </div>
          ))}
          <label className="mt-1 flex items-center gap-3 text-[16px] italic text-ink-soft">
            {t.sheet.otherDate}
            <input
              type="date"
              value={dueDay}
              min={today}
              onChange={(e) => e.target.value && setDue(e.target.value)}
              className="h-11 rounded-sm border-[1.5px] border-ink/25 bg-transparent px-2 not-italic text-ink"
            />
          </label>
        </div>
        {rounds > 0 && <p className="m-0 mt-2 text-[15px] italic text-quill">{t.sheet.training(rounds)}</p>}
      </fieldset>

      <div className="flex items-center gap-3 border-t border-ink/20 pt-4">
        {existing && (
          <button
            type="button"
            onClick={() => {
              removeTask(existing.id)
              openSheet(null)
            }}
            className="h-12 px-2 text-[16px] text-wax underline-offset-4 hover:underline"
          >
            {t.sheet.remove}
          </button>
        )}
        <button type="submit" disabled={!subjectId} className="ml-auto h-12 rounded-sm bg-ink px-6 font-fell text-[20px] text-paper disabled:opacity-40">
          {existing ? t.sheet.save : t.sheet.add}
        </button>
      </div>
    </form>
  )
}
