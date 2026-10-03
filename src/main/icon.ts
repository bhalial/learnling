import { nativeImage, type NativeImage } from 'electron'
import ico from '../../resources/icon.ico?asset'
import png from '../../resources/icon.png?asset'

// Both drawn from resources/icon.svg by scripts/make-icon.js.

/** Every size in one file: Windows picks the right one for the window, taskbar and tray. */
export const appIcon = (): NativeImage => nativeImage.createFromPath(ico)

/** One large picture, for notifications. */
export const notificationIcon = (): NativeImage => nativeImage.createFromPath(png)
