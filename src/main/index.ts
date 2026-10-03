import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { app, BrowserWindow, ipcMain, Menu, Notification, Tray } from 'electron'
import { appIcon, notificationIcon } from './icon'
import * as magister from './magister'
import { adoptSpellbook } from './migrate'
import { readData, writeData } from './store'
import { installIfReady, keepUpToDate } from './updater'

// Development switches, all optional:
//   SPELLBOOK_DEMO=1           fill the book with sample homework (own data folder)
//   SPELLBOOK_DEMO=empty       start with an empty book (own data folder)
//   SPELLBOOK_TODAY=2026-09-30 pretend it is that day, to check the week rules
//   SPELLBOOK_THEME=garden     open the book in that theme (see src/renderer/src/themes.ts)
//   SPELLBOOK_LANG=nl          open the book in that language
//   SPELLBOOK_SHOT=<file.png>  save a screenshot of the window and quit
//   SPELLBOOK_SIZE=1280x945    the window's inside at that size, e.g. a small laptop maximised
//   SPELLBOOK_SHOT_JS=<code>   run this in the page first, e.g. to open a dialog
//   SPELLBOOK_LAB=1            open the companion lab: every animal in every mood
const demo = process.env.SPELLBOOK_DEMO === '1'
const today = process.env.SPELLBOOK_TODAY ?? null
const theme = process.env.SPELLBOOK_THEME ?? null
const lang = process.env.SPELLBOOK_LANG ?? null
const shot = process.env.SPELLBOOK_SHOT
const [width, height] = (process.env.SPELLBOOK_SIZE ?? '1440x960').split('x').map(Number)

// Started by Windows at login, or restarted after an update that installed while the book was
// put away: stay in the tray until it is opened.
const startHidden = process.argv.includes('--hidden') || process.argv.includes('--updated')

const DATA_FILE = 'learnling.json'

// A demo run keeps its own data folder so it can never touch the real book.
if (process.env.SPELLBOOK_DEMO) app.setPath('userData', join(tmpdir(), `spellbook-demo-${process.env.SPELLBOOK_DEMO}`))
else {
  // The app used to be called Spellbook: the first start under the new name brings the book over.
  try {
    if (adoptSpellbook(join(app.getPath('appData'), 'spellbook'), app.getPath('userData'), DATA_FILE)) {
      console.log('brought the book over from the Spellbook folder')
    }
  } catch (error) {
    console.error('could not bring the Spellbook folder over:', error)
  }
}

// Windows ties notifications to the installed shortcut's id; a dev run keeps Electron's own.
if (app.isPackaged) app.setAppUserModelId('nl.jeroenstengs.learnling')

const dataFile = (): string => join(app.getPath('userData'), DATA_FILE)

let win: BrowserWindow | null = null
let tray: Tray | null = null
let keepInTray = false
let quitting = false

function createWindow(): void {
  win = new BrowserWindow({
    width,
    height,
    minWidth: 1100,
    minHeight: 700,
    useContentSize: true,
    show: false,
    title: 'Learnling',
    icon: appIcon(),
    backgroundColor: '#241911',
    autoHideMenuBar: true,
    // Reminders run on renderer timers, which must keep ticking while the window is hidden.
    webPreferences: { preload: join(__dirname, '../preload/index.js'), backgroundThrottling: false }
  })

  win.once('ready-to-show', () => {
    if (shot) win?.show()
    else if (!startHidden) showWindow()
  })

  // With the tray on, closing the window only puts the book away; reminders keep working.
  win.on('close', (event) => {
    if (keepInTray && !quitting && !shot) {
      event.preventDefault()
      win?.hide()
      // A good moment for a waiting update: nobody is looking.
      installIfReady()
    }
  })

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') {
      win?.webContents.toggleDevTools()
      event.preventDefault()
    }
  })

  if (shot) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(() => void capture(shot), Number(process.env.SPELLBOOK_SHOT_DELAY ?? 1500))
    })
  }

  // SPELLBOOK_LAB=1 shows every animal; SPELLBOOK_LAB=shark shows one, large.
  const lab = process.env.SPELLBOOK_LAB
  const hash = lab ? (lab === '1' ? 'lab' : `lab=${lab}`) : undefined
  const devServer = process.env.ELECTRON_RENDERER_URL
  if (devServer) void win.loadURL(hash ? `${devServer}#${hash}` : devServer)
  else void win.loadFile(join(__dirname, '../renderer/index.html'), { hash })
}

function showWindow(): void {
  if (!win) return
  if (!win.isVisible()) win.maximize()
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

function setTray(on: boolean): void {
  keepInTray = on
  if (!on) {
    tray?.destroy()
    tray = null
    // Nothing to reopen it from, so a hidden start must show itself.
    if (startHidden && win && !win.isVisible()) showWindow()
    return
  }
  if (tray) return
  tray = new Tray(appIcon())
  tray.setToolTip('Learnling')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Learnling', click: showWindow },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ])
  )
  tray.on('click', showWindow)
}

async function capture(file: string): Promise<void> {
  const script = process.env.SPELLBOOK_SHOT_JS
  if (script) {
    await win!.webContents.executeJavaScript(script).catch((error) => console.error('SPELLBOOK_SHOT_JS failed:', error))
    await new Promise((resolve) => setTimeout(resolve, 800))
  }
  const image = await win!.webContents.capturePage()
  writeFileSync(file, image.toPNG())
  app.quit()
}

ipcMain.handle('boot', () => ({ data: readData(dataFile()), demo, today, theme, lang }))
ipcMain.handle('save', (_event, data: unknown) => writeData(dataFile(), data))
ipcMain.on('save-now', (event, data: unknown) => {
  writeData(dataFile(), data)
  event.returnValue = true
})

ipcMain.handle('app:settings', (_event, settings: { tray: boolean; autostart: boolean }) => {
  setTray(settings.tray && !shot)
  // Only an installed app can start with Windows; a dev run would register electron.exe.
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: settings.autostart, args: ['--hidden'] })
})

ipcMain.handle('notify', (_event, message: { title: string; body: string }) => {
  if (!Notification.isSupported()) return
  const notification = new Notification({ title: message.title, body: message.body, icon: notificationIcon() })
  notification.on('click', showWindow)
  notification.show()
})

ipcMain.handle('magister:connect', (_event, school?: string) => (win ? magister.connect(win, school) : null))
ipcMain.handle('magister:sync', (_event, school: string, from: string, to: string) => magister.sync(school, from, to))
ipcMain.handle('magister:disconnect', () => magister.disconnect())

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', showWindow)
  app.on('before-quit', () => {
    quitting = true
  })
  void app.whenReady().then(() => {
    createWindow()
    // Demo and screenshot runs leave the installed app alone.
    if (!process.env.SPELLBOOK_DEMO && !shot) keepUpToDate(() => !win?.isVisible())
  })
  app.on('window-all-closed', () => app.quit())
}
