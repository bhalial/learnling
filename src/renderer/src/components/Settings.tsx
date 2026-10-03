import { useState, type CSSProperties, type ReactNode } from 'react'
import { ALL_EYE_COLORS, EYE_COLOR_NAMES, eyeSwatch, eyesFor } from '../companions'
import { clock, dictionaries, weekdayName } from '../i18n'
import { addDays, mondayOf } from '../lib/dates'
import { reminderMessage } from '../lib/reminder'
import { PALETTE } from '../lib/seed'
import { subjectInUse } from '../lib/subjects'
import { useBook } from '../store'
import type { Lang, Weekday } from '../types'
import { Modal, SheetHeader } from './Modal'
import { SpeciesPicker } from './SpeciesPicker'

export function Settings() {
  const open = useBook((s) => s.settingsOpen)
  const openSettings = useBook((s) => s.openSettings)
  const t = dictionaries[useBook((s) => s.data.lang)]

  return (
    <Modal open={open} onClose={() => openSettings(false)} label={t.setup.title} width={860}>
      <SettingsForm />
    </Modal>
  )
}

const heading = 'm-0 mb-3 font-fell text-[24px] font-normal'
const primary = 'h-11 rounded-sm bg-ink px-5 font-fell text-[18px] text-paper disabled:opacity-40'
const secondary = 'h-11 rounded-sm border-[1.5px] border-ink px-4 text-[16px] disabled:opacity-50'
const DAYS: Weekday[] = [1, 2, 3, 4, 5]

/** An on/off switch with its words next to it; the whole row is the tap target. */
function Toggle({ on, onChange, label, children }: { on: boolean; onChange: (on: boolean) => void; label: string; children: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="flex min-h-11 items-center gap-3 text-left text-[16px]">
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-quill' : 'bg-ink/25'}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-paper shadow transition-[left] ${on ? 'left-6' : 'left-1'}`} />
      </span>
      {children}
    </button>
  )
}

function SettingsForm() {
  const data = useBook((s) => s.data)
  const today = useBook((s) => s.today)
  const sync = useBook((s) => s.sync)
  const {
    setCompanion,
    setLang,
    addSubject,
    renameSubject,
    recolorSubject,
    removeSubject,
    addLesson,
    removeLesson,
    openSettings,
    setReminder,
    setApp,
    connectMagister,
    syncMagister,
    disconnectMagister
  } = useBook.getState()
  const t = dictionaries[data.lang]
  const [colorFor, setColorFor] = useState<string | null>(null)
  const [day, setDay] = useState<Weekday>(1)
  const [testSent, setTestSent] = useState(false)
  const monday = mondayOf(today)

  // The real message if something is waiting, otherwise a sample, to show what it looks like.
  const sendTest = (): void => {
    const message = reminderMessage(data, today, sync, t) ?? { title: data.companion.name || 'Learnling', body: t.reminder.sample }
    void window.spellbook.notify(message.title, message.body)
    setTestSent(true)
  }
  const subjectOf = (id: string) => data.subjects.find((s) => s.id === id)

  return (
    <div className="flex flex-col gap-7 px-8 pb-8">
      <SheetHeader closeLabel={t.close} onClose={() => openSettings(false)}>
        <h2 className="m-0 font-fell text-[30px] font-normal">{t.setup.title}</h2>
      </SheetHeader>

      <section>
        <h3 className={heading}>{t.magister.title}</h3>
        {data.magister ? (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-[17px]">{t.magister.connected(data.magister.studentName ?? '', data.magister.school)}</p>
            {data.magister.lastSync && <p className="m-0 text-[15px] italic text-ink-soft">{t.magister.lastSync(clock(data.magister.lastSync, data.lang))}</p>}
            {sync.state === 'error' && <p className="m-0 text-[15px] italic text-wax">{t.magister.error}{sync.message ? ` (${sync.message})` : ''}</p>}
            <div className="flex gap-2">
              {sync.state === 'login' ? (
                <button type="button" onClick={() => void connectMagister()} className={primary}>
                  {t.magister.login}
                </button>
              ) : (
                <button type="button" onClick={() => void syncMagister()} disabled={sync.state === 'busy'} className={secondary}>
                  {sync.state === 'busy' ? t.magister.syncing : t.magister.syncNow}
                </button>
              )}
              <button type="button" onClick={() => void disconnectMagister()} className="h-11 px-3 text-[16px] text-wax underline-offset-4 hover:underline">
                {t.magister.disconnect}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="m-0 max-w-[60ch] text-[16px] leading-snug text-ink-soft">{t.magister.intro}</p>
            <button type="button" onClick={() => void connectMagister()} disabled={sync.state === 'busy'} className={primary}>
              {t.magister.connect}
            </button>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-8">
        <div>
          <h3 className={heading}>{t.reminder.title}</h3>
          <p className="m-0 mb-3 text-[15px] italic text-ink-soft">{t.reminder.hint}</p>
          <div className="flex items-center gap-3">
            <Toggle on={data.reminder.enabled} onChange={(enabled) => setReminder({ enabled })} label={t.reminder.title}>
              {data.reminder.enabled ? t.on : t.off}
            </Toggle>
            <label className={`flex items-center gap-2 text-[16px] ${data.reminder.enabled ? '' : 'opacity-40'}`}>
              {t.reminder.at}
              <input
                type="time"
                value={data.reminder.time}
                disabled={!data.reminder.enabled}
                onChange={(e) => e.target.value && setReminder({ time: e.target.value, lastSent: undefined })}
                className="h-11 rounded-sm border-[1.5px] border-ink/25 bg-transparent px-2"
              />
            </label>
          </div>
          <button type="button" onClick={sendTest} className="mt-2 h-11 px-1 text-[16px] italic text-quill underline-offset-4 hover:underline">
            {t.reminder.test}
          </button>
          {testSent && <p className="m-0 text-[14px] italic text-ink-soft">{t.reminder.sent}</p>}
        </div>
        <div>
          <h3 className={heading}>{t.background.title}</h3>
          <div className="flex flex-col gap-2">
            <Toggle on={data.app.tray} onChange={(tray) => setApp({ tray })} label={t.background.tray}>
              {t.background.tray}
            </Toggle>
            <Toggle on={data.app.autostart} onChange={(autostart) => setApp({ autostart })} label={t.background.autostart}>
              {t.background.autostart}
            </Toggle>
            {import.meta.env.DEV && <p className="m-0 text-[14px] italic text-ink-soft">{t.background.autostartDev}</p>}
          </div>
        </div>
      </section>

      <section>
        <h3 className={heading}>{t.setup.companion}</h3>
        <p className="m-0 mb-2 text-[15px] italic text-ink-soft">{t.setup.companionHint}</p>
        <SpeciesPicker look={data.companion} lang={data.lang} onPick={(species) => setCompanion({ species })} />
        <div className="mt-3 flex items-center gap-4">
          <span className="text-[17px]">{t.setup.eyeColor}</span>
          <div className="flex gap-2.5">
            {ALL_EYE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setCompanion({ eyes: color })}
                aria-label={EYE_COLOR_NAMES[color][data.lang]}
                title={EYE_COLOR_NAMES[color][data.lang]}
                aria-pressed={eyesFor(data.companion.eyes) === color}
                className={`blot-lg size-9 ${eyesFor(data.companion.eyes) === color ? 'outline-2 outline-offset-2 outline-ink outline-solid' : ''}`}
                style={{ background: eyeSwatch(color) }}
              />
            ))}
          </div>
        </div>
        <label className="mt-3 flex items-center gap-4">
          <span className="text-[17px]">{t.setup.catName}</span>
          <input
            value={data.companion.name}
            onChange={(e) => setCompanion({ name: e.target.value })}
            placeholder={t.setup.catNamePlaceholder}
            maxLength={24}
            spellCheck={false}
            className="h-12 w-72 border-0 border-b-[1.5px] border-ink bg-transparent px-1 font-hand text-[26px] text-quill outline-none placeholder:font-sans placeholder:text-[16px] placeholder:italic placeholder:text-ink-soft/60"
          />
        </label>
      </section>

      <section>
        <h3 className={heading}>{t.setup.subjects}</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {data.subjects.map((subject) => {
            const inUse = subjectInUse(data, subject.id)
            return (
              <div key={subject.id} className="flex flex-col">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setColorFor(colorFor === subject.id ? null : subject.id)}
                    aria-label={t.setup.color}
                    aria-expanded={colorFor === subject.id}
                    className="grid size-11 shrink-0 place-items-center"
                  >
                    <span className="blot-lg block size-7" style={{ background: subject.color }} />
                  </button>
                  <input
                    value={subject.name}
                    onChange={(e) => renameSubject(subject.id, e.target.value)}
                    aria-label={t.setup.subjectName}
                    placeholder={t.setup.subjectName}
                    spellCheck={false}
                    className="h-11 min-w-0 flex-1 border-0 border-b border-ink/25 bg-transparent px-1 text-[17px] outline-none focus:border-ink"
                  />
                  <button
                    type="button"
                    onClick={() => removeSubject(subject.id)}
                    disabled={inUse}
                    title={inUse ? t.setup.inUse : t.setup.removeSubject}
                    aria-label={t.setup.removeSubject}
                    className="grid size-11 shrink-0 place-items-center text-ink-soft disabled:opacity-25"
                  >
                    <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2" aria-hidden="true">
                      <path d="M6 6 L18 18 M18 6 L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                {colorFor === subject.id && (
                  <div className="mb-2 ml-12">
                    <div className="flex flex-wrap gap-1.5">
                      {PALETTE.map((color) => {
                        // A colour another subject has shows whose it is; picking it swaps the two.
                        const owner = data.subjects.find((s) => s.color === color && s.id !== subject.id)
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              recolorSubject(subject.id, color)
                              setColorFor(null)
                            }}
                            aria-label={owner ? `${color} (${owner.name})` : color}
                            title={owner?.name}
                            aria-pressed={subject.color === color}
                            className={`blot-lg grid size-9 place-items-center text-[11px] font-bold uppercase text-paper ${subject.color === color ? 'outline-2 outline-offset-2 outline-ink outline-solid' : ''}`}
                            style={{ background: color }}
                          >
                            {owner?.name.slice(0, 2)}
                          </button>
                        )
                      })}
                    </div>
                    <p className="m-0 mt-1.5 text-[14px] italic text-ink-soft">{t.setup.colorSwap}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <button type="button" onClick={addSubject} className="mt-2 h-11 px-1 text-[16px] italic text-quill underline-offset-4 hover:underline">
          + {t.setup.addSubject}
        </button>
      </section>

      <section>
        <h3 className={heading}>{t.setup.timetable}</h3>
        <p className="m-0 mb-3 text-[15px] italic text-ink-soft">{data.magister ? t.setup.timetableMagister : t.setup.timetableHint}</p>
        <div className="grid grid-cols-5 gap-2">
          {DAYS.map((d) => (
            <div key={d} className={`flex flex-col gap-1 rounded-md p-1.5 ${day === d ? 'bg-paper-deep ring-[1.5px] ring-ink' : ''}`}>
              <button type="button" onClick={() => setDay(d)} aria-pressed={day === d} className="h-11 font-fell text-[19px]">
                {weekdayName(addDays(monday, d - 1), data.lang)}
              </button>
              {data.timetable[d].map((id, i) => {
                const subject = subjectOf(id)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => removeLesson(d, i)}
                    style={{ '--subject': subject?.color } as CSSProperties}
                    className="flex h-10 items-center gap-2 rounded-sm bg-paper px-2 text-left text-[15px] shadow-[0_1px_0_rgb(43_33_24/0.2)]"
                  >
                    <span className="w-4 text-[12px] text-ink-soft">{i + 1}</span>
                    <span className="blot size-3 shrink-0 bg-[var(--subject)]" />
                    <span className="truncate">{subject?.name}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.subjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => addLesson(day, subject.id)}
              style={{ '--subject': subject.color } as CSSProperties}
              className="flex h-11 items-center gap-2 rounded-sm border-[1.5px] border-ink/25 px-3 text-[16px]"
            >
              <span className="blot size-3.5 bg-[var(--subject)]" />
              {subject.name || '…'}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className={heading}>{t.setup.language}</h3>
        <div className="flex gap-2">
          {(
            [
              ['en', 'English'],
              ['nl', 'Nederlands']
            ] as Array<[Lang, string]>
          ).map(([lang, name]) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLang(lang)}
              aria-pressed={data.lang === lang}
              className={`h-11 rounded-sm border-[1.5px] px-4 text-[16px] ${data.lang === lang ? 'border-ink bg-paper-deep' : 'border-ink/25'}`}
            >
              {name}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
