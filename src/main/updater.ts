import { appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import { autoUpdater } from 'electron-updater'

const HOUR = 3_600_000

let ready = false

/** A line in `updates.log` next to her book, so a failed update can be looked into later. */
function log(...parts: unknown[]): void {
  try {
    appendFileSync(join(app.getPath('userData'), 'updates.log'), `${new Date().toISOString()} ${parts.map(String).join(' ')}\n`)
  } catch {
    // Logging must never break the app.
  }
}

/**
 * Keeps the installed app up to date from the GitHub releases of bhalial/learnling: checks
 * at start and every few hours, downloads quietly, and installs when nobody is looking
 * (the window is put away in the tray) or else when the app quits. Offline, it just tries
 * again later. A dev run never updates.
 */
export function keepUpToDate(isPutAway: () => boolean): void {
  if (!app.isPackaged) return
  autoUpdater.logger = { info: log, warn: log, error: log, debug: () => undefined }
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('update-downloaded', (info) => {
    ready = true
    if (isPutAway()) installNow()
  })
  const check = (): void => void autoUpdater.checkForUpdates().catch((error) => log('check failed:', error))
  check()
  setInterval(check, 4 * HOUR)
}

/** Restarts into a downloaded update, if there is one. Call when the window is put away. */
export function installIfReady(): void {
  if (ready) installNow()
}

function installNow(): void {
  log('installing and restarting')
  // Silent, and start again afterwards; it comes back in the tray (see --updated).
  autoUpdater.quitAndInstall(true, true)
}
