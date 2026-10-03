import { contextBridge, ipcRenderer } from 'electron'
import type { Boot, MagisterSync, SpellbookData } from '../renderer/src/types'

const spellbook = {
  boot(): Promise<Boot> {
    return ipcRenderer.invoke('boot')
  },

  save(data: SpellbookData): Promise<void> {
    return ipcRenderer.invoke('save', data)
  },

  /** Blocking save for when the window closes, so the last tick is never lost. */
  saveNow(data: SpellbookData): void {
    ipcRenderer.sendSync('save-now', data)
  },

  applySettings(settings: SpellbookData['app']): Promise<void> {
    return ipcRenderer.invoke('app:settings', settings)
  },

  notify(title: string, body: string): Promise<void> {
    return ipcRenderer.invoke('notify', { title, body })
  },

  magister: {
    /** Opens the real Magister login (at the school when known); resolves with the school's host, or null if it was closed. */
    connect(school?: string): Promise<string | null> {
      return ipcRenderer.invoke('magister:connect', school)
    },
    sync(school: string, from: string, to: string): Promise<MagisterSync> {
      return ipcRenderer.invoke('magister:sync', school, from, to)
    },
    disconnect(): Promise<void> {
      return ipcRenderer.invoke('magister:disconnect')
    }
  }
}

contextBridge.exposeInMainWorld('spellbook', spellbook)

export type SpellbookApi = typeof spellbook
