import { useEffect, useRef, useState } from 'react'
import { ACCESSORIES, SPECIES, swatchOf } from '../companions'
import { REACTION_MOOD, restingMood } from '../companions/mood'
import type { Mood } from '../companions/types'
import { dictionaries, shortDay } from '../i18n'
import { catLine } from '../lib/cat'
import { addDays, windowStart } from '../lib/dates'
import { isTrial, needsAttention, wording } from '../lib/tasks'
import { useBook } from '../store'
import { Companion } from './Companion'
import { Seal } from './Seal'
import { TaskCard } from './TaskCard'

const REACTION_MS = 4500
const TALK_MS = 2500

export function Side() {
  return (
    <aside className="-ml-2 flex w-[312px] shrink-0 flex-col gap-6 overflow-y-auto px-2 pb-4 pt-1.5 text-cream">
      <CatPanel />
      <Shelf />
      <FurtherAhead />
    </aside>
  )
}

function CatPanel() {
  const data = useBook((s) => s.data)
  const today = useBook((s) => s.today)
  const reaction = useBook((s) => s.reaction)
  const sync = useBook((s) => s.sync)
  const clearReaction = useBook((s) => s.clearReaction)
  const setCompanion = useBook((s) => s.setCompanion)
  const openSettings = useBook((s) => s.openSettings)
  const t = dictionaries[data.lang]
  const { companion } = data
  const species = SPECIES[companion.species]

  useEffect(() => {
    if (!reaction) return
    const timer = setTimeout(() => clearReaction(reaction.at), REACTION_MS)
    return () => clearTimeout(timer)
  }, [reaction, clearReaction])

  const line = catLine(data, today, reaction, sync, t)

  // It talks for a moment whenever its note says something new.
  const [talking, setTalking] = useState(false)
  const said = useRef(line.text)
  useEffect(() => {
    if (line.text === said.current) return
    said.current = line.text
    setTalking(true)
    const timer = setTimeout(() => setTalking(false), TALK_MS)
    return () => clearTimeout(timer)
  }, [line.text])

  // The hour decides when it falls asleep; check it every minute.
  const [hour, setHour] = useState(() => new Date().getHours())
  useEffect(() => {
    const timer = setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const mood: Mood = reaction ? REACTION_MOOD[reaction.kind] : talking ? 'talk' : restingMood(data, today, hour)

  return (
    <section className="flex flex-col gap-3">
      <div className="pinned-note mx-1.5 mt-1.5 bg-note px-4 pb-3 pt-4 text-[16px] leading-snug text-ink" aria-live="polite">
        <p className="m-0">{line.text}</p>
        {line.setup && (
          <button type="button" onClick={() => openSettings(true)} className="mt-2 h-11 rounded-sm border-[1.5px] border-ink bg-paper-deep px-3.5 font-fell text-[17px]">
            {t.cat.setupButton}
          </button>
        )}
        {companion.name && <p className="m-0 mt-1 text-right font-hand text-[22px] leading-none text-quill">— {companion.name}</p>}
      </div>

      <div className="flex flex-col items-center justify-end">
        {/* Sits on the books: its paws overlap the top one by two art pixels. */}
        <div className="z-10 -mb-3">
          <Companion look={companion} mood={mood} pulse={reaction?.at ?? 0} scale={6} />
        </div>
        <div className="flex flex-col items-center" aria-hidden="true">
          <span className="stack-book block h-[17px] w-[206px] rounded-[3px] bg-[#6b2b2b]" />
          <span className="stack-book block h-[17px] w-[234px] rounded-[3px] bg-[#2f4a6b]" />
          <span className="stack-book block h-[17px] w-[220px] rounded-[3px] bg-[#56622c]" />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="font-fell text-[19px] italic">{t.dress(companion.name, species.name[data.lang])}</span>
        <div className="flex gap-3.5 pl-1">
          {species.coats.map((coat) => (
            <button
              key={coat.id}
              type="button"
              onClick={() => setCompanion({ coat: coat.id })}
              aria-label={coat.name[data.lang]}
              title={coat.name[data.lang]}
              aria-pressed={companion.coat === coat.id}
              className={`blot-lg size-11 shadow-[inset_-4px_-5px_0_rgb(0_0_0/0.18)] ${
                companion.coat === coat.id ? 'outline-[2.5px] outline-offset-4 outline-gold outline-solid' : ''
              }`}
              style={{ background: swatchOf(companion.species, coat.id) }}
            />
          ))}
        </div>
        <div className="flex gap-1">
          {ACCESSORIES.map((accessory) => (
            <button
              key={accessory}
              type="button"
              onClick={() => setCompanion({ accessory })}
              aria-pressed={companion.accessory === accessory}
              className={`h-11 border-b-2 px-2.5 text-[15px] ${
                companion.accessory === accessory ? 'border-gold text-note' : 'border-transparent text-cream-soft'
              }`}
            >
              {accessory === 'hat' ? t.hat : accessory === 'collar' ? species.neckwear[data.lang] : t.nothing}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function Shelf() {
  const tasks = useBook((s) => s.data.tasks)
  const lang = useBook((s) => s.data.lang)
  const today = useBook((s) => s.today)
  const t = dictionaries[lang]
  const late = needsAttention(tasks, today)
  if (!late.length) return null

  return (
    <section className="loose-page bg-paper px-[18px] pb-3 pt-4 text-ink">
      <h2 className="m-0 font-fell text-[21px] font-normal text-wax">{t.attention}</h2>
      <p className="m-0 mb-1 text-[14px] italic text-ink-soft">{t.attentionHint}</p>
      {late.map((task) => (
        <TaskCard key={task.id} task={task} place="shelf" />
      ))}
    </section>
  )
}

function FurtherAhead() {
  const data = useBook((s) => s.data)
  const today = useBook((s) => s.today)
  const openSheet = useBook((s) => s.openSheet)
  const t = dictionaries[data.lang]
  const end = addDays(windowStart(today), 13)
  const ahead = data.tasks
    .filter((task) => isTrial(task.given.kind) && !task.given.gone && task.given.due > end)
    .sort((a, b) => a.given.due.localeCompare(b.given.due))
    .slice(0, 4)
  if (!ahead.length) return null

  return (
    <section className="flex flex-col gap-1">
      <h2 className="m-0 font-fell text-[19px] font-normal italic">{t.further}</h2>
      {ahead.map((task) => {
        const subject = data.subjects.find((s) => s.id === task.given.subjectId)
        return (
          <button
            key={task.id}
            type="button"
            onClick={() => openSheet({ mode: 'edit', id: task.id })}
            className="flex min-h-11 items-center gap-3 text-left"
          >
            <Seal kind={task.given.kind === 'test' ? 'test' : 'quiz'} size={30} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] italic text-cream-soft">
                {shortDay(task.given.due, data.lang)} · {subject?.name} · {t.kinds[task.given.kind]}
              </span>
              <span className="block truncate text-[15.5px]">{wording(task)}</span>
            </span>
          </button>
        )
      })}
    </section>
  )
}
