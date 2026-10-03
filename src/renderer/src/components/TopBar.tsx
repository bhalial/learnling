import { clock } from '../i18n'
import { windowStart } from '../lib/dates'
import { progress } from '../lib/tasks'
import { useBook, useWords } from '../store'
import { NewIcon, ProgressMarks } from './ThemeParts'

/**
 * The bar over the book, kept to what is used every day: the title, Magister, the week's
 * progress, the button for new homework and the way into Settings. Language and the week
 * numbers live in Settings and on the pages, so this still fits a small laptop.
 */
export function TopBar() {
  const data = useBook((s) => s.data)
  const today = useBook((s) => s.today)
  const openSheet = useBook((s) => s.openSheet)
  const openSettings = useBook((s) => s.openSettings)
  const t = useWords()

  const start = windowStart(today)
  const { done, total } = progress(data.tasks, start)
  // One mark per task, scaled down once a busy week would overflow the header.
  const marks = Math.min(total, 16)
  const filled = total ? Math.round((done / total) * marks) : 0

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-5 px-6 text-cream">
      <h1 className="app-title m-0 whitespace-nowrap font-fell text-[30px] font-normal tracking-[0.01em]">{t.title}</h1>
      <MagisterStatus />

      <div className="ml-auto flex flex-col items-end gap-1">
        <ProgressMarks marks={marks} filled={filled} />
        <span className="whitespace-nowrap text-[14px] italic text-cream-soft">{total ? t.progress(done, total) : t.progressEmpty}</span>
      </div>

      <button
        type="button"
        onClick={() => openSheet({ mode: 'new' })}
        className="btn-new flex h-11 shrink-0 items-center gap-2 whitespace-nowrap px-4 font-fell text-[18px]"
      >
        <NewIcon />
        {t.newTask}
      </button>

      <button
        type="button"
        onClick={() => openSettings(true)}
        aria-label={t.settings}
        title={t.settings}
        className="grid size-11 shrink-0 place-items-center rounded-full text-cream-soft"
      >
        <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-current stroke-[1.6]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </header>
  )
}

/**
 * Where Magister stands, small: the time it was last read, the whole story on hover, and
 * words only when something needs doing. Hidden until Magister is linked.
 */
function MagisterStatus() {
  const link = useBook((s) => s.data.magister)
  const lang = useBook((s) => s.data.lang)
  const sync = useBook((s) => s.sync)
  const { syncMagister, connectMagister } = useBook.getState()
  const t = useWords()
  if (!link) return null

  if (sync.state === 'login') {
    return (
      <button type="button" onClick={() => void connectMagister()} className="h-11 shrink-0 whitespace-nowrap rounded-sm bg-wax px-4 font-fell text-[17px] text-on-wax">
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
          ? `${t.magister.status(clock(link.lastSync, lang))} · ${t.magister.syncNow}`
          : t.magister.syncNow
  const shown = sync.state === 'error' ? t.magister.error : sync.state === 'idle' && link.lastSync ? clock(link.lastSync, lang) : ''

  return (
    <button
      type="button"
      onClick={() => void syncMagister()}
      disabled={sync.state === 'busy'}
      aria-label={label}
      title={sync.message ? `${label} (${sync.message})` : label}
      className={`flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm px-2 text-[15px] italic ${sync.state === 'error' ? 'text-desk-alert' : 'text-cream-soft'}`}
    >
      <svg viewBox="0 0 24 24" className={`size-4 fill-none stroke-current stroke-2 ${sync.state === 'busy' ? 'animate-spin' : ''}`} aria-hidden="true">
        <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {shown}
    </button>
  )
}
