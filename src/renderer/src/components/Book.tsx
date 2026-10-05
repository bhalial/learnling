import type { CSSProperties, ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { range, shortDay, weekdayName } from '../i18n'
import { addDays, isoWeek, weekday, windowStart } from '../lib/dates'
import { fromMagister, lessonRuns, lessonsOn } from '../lib/lessons'
import { shortName } from '../lib/subjects'
import { dayOrder, shownOn } from '../lib/tasks'
import { useBook, useWords } from '../store'
import { subjectInkFor } from '../themes'
import type { IsoDate } from '../types'
import { TaskCard } from './TaskCard'

/** Two pages, one week each: this week and next, or the two coming weeks at the weekend. */
export function Book() {
  const today = useBook((s) => s.today)
  const t = useWords()
  const start = windowStart(today)
  const titles = weekday(today) >= 6 ? [t.comingWeek, t.weekAfter] : [t.thisWeek, t.nextWeek]

  return (
    <div className="book-cover min-w-0 flex-1 px-3.5 pb-[18px] pt-3">
      <div className="book-pages flex h-full">
        <span className="ribbon absolute -top-3.5 left-1.5 z-10 h-[150px] w-[22px] bg-wax" aria-hidden="true" />
        <Page monday={start} title={titles[0]} className="pl-9 pr-8" />
        <Page monday={addDays(start, 7)} title={titles[1]} className="pl-8 pr-6" />
      </div>
    </div>
  )
}

function Page({ monday, title, className }: { monday: IsoDate; title: string; className: string }) {
  const lang = useBook((s) => s.data.lang)
  const t = useWords()

  return (
    <section className={`page flex min-w-0 flex-1 flex-col pb-3 pt-4 ${className}`}>
      <header className="page-rule flex items-baseline justify-between gap-3 px-2 pb-2.5">
        <h2 className="m-0 whitespace-nowrap font-fell text-[26px] font-normal">{title}</h2>
        <span className="whitespace-nowrap text-[14px] italic text-ink-soft">
          {t.week(isoWeek(monday))} · {range(monday, addDays(monday, 4), lang)}
        </span>
      </header>
      <div className="-mx-2 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 pt-3">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <DayRow key={i} date={addDays(monday, i)} weekend={i >= 5} />
        ))}
      </div>
    </section>
  )
}

function DayRow({ date, weekend = false }: { date: IsoDate; weekend?: boolean }) {
  const data = useBook((s) => s.data)
  const today = useBook((s) => s.today)
  const openSheet = useBook((s) => s.openSheet)
  const { setNodeRef, isOver } = useDroppable({ id: `day:${date}` })

  const t = useWords()
  const tasks = data.tasks.filter((task) => shownOn(task) === date).sort(dayOrder)
  const lessons = lessonsOn(data, date)
  // A school day Magister knows to have no lessons: a holiday or a study day.
  const dayOff = !weekend && lessons.length === 0 && fromMagister(data, date)
  const isToday = date === today
  const isPast = date < today

  // Weekend days are quieter: a smaller date and no lessons. The column is 60px wide: room for
  // the widest of its words in any theme's font ("Vandaag" in the questlog's).
  const label: ReactNode = (
    <>
      <span className="text-[13px] uppercase tracking-[0.15em] text-ink-soft">
        {weekdayName(date, data.lang)}
        {!isPast && <span className="ml-1 font-bold opacity-40">+</span>}
      </span>
      <span className={`self-start font-fell leading-none ${weekend ? 'text-[20px]' : 'text-[26px]'} ${isToday ? 'ink-circle' : ''}`}>
        {Number(date.slice(8))}
      </span>
      {isToday && <span className="mt-1 text-sm italic text-wax">{t.today}</span>}
    </>
  )

  return (
    <div
      ref={setNodeRef}
      className={`day-row flex gap-3 rounded-md border-t border-ink/20 px-2 py-1.5 first:border-t-0 ${isOver ? 'drop-target' : ''}`}
    >
      {isPast ? (
        <div className="flex w-[60px] shrink-0 flex-col gap-0.5 pt-1 opacity-60">{label}</div>
      ) : (
        <button
          type="button"
          onClick={() => openSheet({ mode: 'new', due: date })}
          aria-label={t.addOn(shortDay(date, data.lang))}
          className="flex min-h-11 w-[60px] shrink-0 flex-col items-start gap-0.5 rounded-sm pt-1 text-left"
        >
          {label}
        </button>
      )}

      <div className={`flex min-w-0 flex-1 flex-col gap-0.5 ${isPast && !isOver ? 'opacity-70' : ''}`}>
        {/* The day's lessons in order, like a line in a timetable, by their short names (the
            whole name on hover): a double period once with ×2, a cancelled one struck through. */}
        {dayOff && <p className="m-0 pb-1 pt-1 text-[14px] italic text-ink-soft">{t.noLessons}</p>}
        {lessons.length > 0 && (
          <ol aria-label={t.lessons} className="m-0 flex list-none flex-wrap items-baseline gap-x-1.5 p-0 pb-1 pt-1 text-[13px] font-semibold tracking-wide">
            {lessonRuns(lessons).map((run, i) => {
              const subject = data.subjects.find((s) => s.id === run.subjectId)
              return (
                <li key={i} className="flex items-baseline gap-1.5">
                  {i > 0 && (
                    <span aria-hidden="true" className="text-ink/30">
                      ·
                    </span>
                  )}
                  <span
                    className={`subject-ink ${run.cancelled ? 'line-through opacity-50' : ''}`}
                    style={{ '--subject-ink': subject && subjectInkFor(subject.color, data.theme) } as CSSProperties}
                  >
                    <abbr title={subject?.name} className="no-underline">
                      {subject && shortName(subject)}
                    </abbr>
                    {run.count > 1 && <span className="ml-0.5 text-[12px]">×{run.count}</span>}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} place="page" />
        ))}
      </div>
    </div>
  )
}
