import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { wordsFor } from './i18n'
import { reminderDue, reminderMessage } from './lib/reminder'
import { useBook } from './store'
import { applyTheme } from './themes'
import { zoomFor } from './lib/zoom'
import './styles.css'

const MINUTE = 60_000

async function start(): Promise<void> {
  const book = useBook.getState()
  book.boot(await window.spellbook.boot())
  // Dressed in its theme before the first paint; App keeps it in step after that.
  applyTheme(useBook.getState().data.theme)
  window.spellbook.zoom(zoomFor(useBook.getState().data.zoom))
  window.spellbook.onZoomKey((step) => useBook.getState().zoomBy(step))
  void window.spellbook.applySettings(useBook.getState().data.app)

  // Save shortly after each change, and once more, blocking, when the window closes.
  let timer: ReturnType<typeof setTimeout> | undefined
  useBook.subscribe((state, previous) => {
    if (state.data === previous.data) return
    clearTimeout(timer)
    timer = setTimeout(() => void window.spellbook.save(state.data), 300)
  })
  window.addEventListener('beforeunload', () => {
    clearTimeout(timer)
    window.spellbook.saveNow(useBook.getState().data)
  })

  // Read Magister at start, every half hour, and when the window comes back after a while.
  // Once Magister wants a fresh login, wait for the login instead of asking again and again.
  const syncIfStale = (minutes: number): void => {
    const { data, sync } = useBook.getState()
    const { magister } = data
    if (!magister || sync.state === 'login') return
    if (!magister.lastSync || Date.now() - Date.parse(magister.lastSync) > minutes * MINUTE) void useBook.getState().syncMagister()
  }
  syncIfStale(0)
  setInterval(() => syncIfStale(30), 5 * MINUTE)
  window.addEventListener('focus', () => syncIfStale(10))

  // Every minute: turn the page at midnight, and send the after-school reminder.
  const tick = (): void => {
    useBook.getState().refreshToday()
    void remind()
  }
  setInterval(tick, MINUTE)
  window.addEventListener('focus', () => useBook.getState().refreshToday())

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

let reminding = false

/**
 * Once per school day, at the chosen time or the first moment after it, the cat
 * reads Magister and says what is waiting. Nothing waiting, no message.
 */
async function remind(): Promise<void> {
  const { data, today, setReminder, syncMagister } = useBook.getState()
  if (reminding || !reminderDue(data.reminder, today, new Date())) return

  reminding = true
  try {
    setReminder({ lastSent: today })
    if (data.magister && useBook.getState().sync.state !== 'login') await syncMagister()
    const fresh = useBook.getState()
    const message = reminderMessage(fresh.data, fresh.today, fresh.sync, wordsFor(fresh.data.lang, fresh.data.theme))
    if (message) await window.spellbook.notify(message.title, message.body)
  } finally {
    reminding = false
  }
}

void start()
