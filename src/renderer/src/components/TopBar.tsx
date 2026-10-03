import { clock, dictionaries } from '../i18n'
import { addDays, isoWeek, windowStart } from '../lib/dates'
import { progress } from '../lib/tasks'
import { useBook } from '../store'
import type { Lang } from '../types'

export function TopBar() {
  const data = useBook((s) => s.data)
  const today = useBook((s) => s.today)
  const setLang = useBook((s) => s.setLang)
  const openSheet = useBook((s) => s.openSheet)
  const openSettings = useBook((s) => s.openSettings)
  const t = dictionaries[data.lang]

  const start = windowStart(today)
  const { done, total } = progress(data.tasks, start)
  // One seal per spell, scaled down once a busy week would overflow the header.
  const seals = Math.min(total, 16)
  const sealed = total ? Math.round((done / total) * seals) : 0

  return (
    <header className="flex h-[88px] shrink-0 items-center gap-7 px-8 text-cream">
      <h1 className="m-0 font-fell text-[36px] font-normal tracking-[0.01em]">{t.title}</h1>
      <span className="text-[17px] italic text-cream-soft">{t.weeks(isoWeek(start), isoWeek(addDays(start, 7)))}</span>
      <MagisterStatus />

      <div className="ml-auto flex flex-col items-end gap-1.5">
        <div className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: seals }, (_, i) => (
            <span key={i} className={`size-4 rounded-full ${i < sealed ? 'seal-on' : 'seal'}`} />
          ))}
        </div>
        <span className="text-[15px] italic text-cream-soft">{total ? t.progress(done, total) : t.progressEmpty}</span>
      </div>

      <button
        type="button"
        onClick={() => openSheet({ mode: 'new' })}
        className="flex h-12 items-center gap-2.5 rounded-sm bg-cream px-5 font-fell text-[20px] text-ink shadow-[0_4px_0_#a8916a]"
      >
        <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-ink stroke-[1.6]" aria-hidden="true">
          <path d="M5 20 C 9 12, 14 6, 22 2 C 19 10, 13 16, 7 19 Z M5 20 L3 23" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        {t.newSpell}
      </button>

      <div className="flex gap-1.5" role="group" aria-label="Language">
        {(['en', 'nl'] as Lang[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setLang(lang)}
            aria-pressed={data.lang === lang}
            className={`h-11 min-w-[52px] rounded-[4px] border-[1.5px] font-fell text-[18px] uppercase ${
              data.lang === lang ? 'border-cream bg-cream text-ink' : 'border-cream/45 text-cream'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      <button type="button" onClick={() => openSettings(true)} aria-label={t.settings} className="grid size-11 place-items-center rounded-full text-cream-soft">
        <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-current stroke-[1.6]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </header>
  )
}

/** Where Magister stands, and the one thing to do about it. Hidden until Magister is linked. */
function MagisterStatus() {
  const link = useBook((s) => s.data.magister)
  const lang = useBook((s) => s.data.lang)
  const sync = useBook((s) => s.sync)
  const { syncMagister, connectMagister } = useBook.getState()
  const t = dictionaries[lang]
  if (!link) return null

  const refresh = (
    <svg viewBox="0 0 24 24" className={`size-4 fill-none stroke-current stroke-2 ${sync.state === 'busy' ? 'animate-spin' : ''}`} aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  if (sync.state === 'login') {
    return (
      <button type="button" onClick={() => void connectMagister()} className="h-11 rounded-sm bg-wax px-4 font-fell text-[17px] text-note">
        {t.magister.login}
      </button>
    )
  }

  const label =
    sync.state === 'busy'
      ? t.magister.syncing
      : sync.state === 'error'
        ? `${t.magister.error} · ${t.magister.retry}`
        : link.lastSync
          ? t.magister.status(clock(link.lastSync, lang))
          : t.magister.syncNow

  return (
    <button
      type="button"
      onClick={() => void syncMagister()}
      disabled={sync.state === 'busy'}
      title={sync.message}
      className={`flex h-11 items-center gap-2 rounded-sm px-2 text-[15px] italic ${sync.state === 'error' ? 'text-[#f0a090]' : 'text-cream-soft'}`}
    >
      {refresh}
      {label}
    </button>
  )
}
