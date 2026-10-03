/**
 * Renders resources/icon.svg to the app icon: a multi-size .ico (exe, installer,
 * window, tray) and a 256px .png (notifications, and a preview to look at).
 * Electron is the rasterizer, offscreen: a hidden normal window never gets
 * composited on Windows, so capturePage would wait forever there.
 *
 * The window is resized through the sizes instead of reloaded per size; captures
 * come back at the display's scale and are resized to the exact pixel size.
 *
 *   npx electron scripts/make-icon.js
 */
const { readFileSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')
const { app, BrowserWindow } = require('electron')

const SIZES = [16, 24, 32, 48, 64, 128, 256]
const resources = join(__dirname, '..', 'resources')

app.disableHardwareAcceleration()

// Electron quits when the last window closes, which here is the render window,
// torn down right before the files get written.
app.on('window-all-closed', () => {})

async function renderAll(svg) {
  const largest = Math.max(...SIZES)
  const window = new BrowserWindow({
    width: largest,
    height: largest,
    show: false,
    frame: false,
    transparent: true,
    useContentSize: true,
    webPreferences: { offscreen: true }
  })
  const page =
    '<!doctype html><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}svg{display:block}</style>' + svg
  await window.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(page))

  const results = new Map()
  for (const size of SIZES) {
    window.setContentSize(size, size)
    await window.webContents.executeJavaScript(
      `document.querySelector('svg').style.width = '${size}px'; document.querySelector('svg').style.height = '${size}px'; true`
    )
    await new Promise((resolve) => setTimeout(resolve, 300))
    let image = await window.webContents.capturePage()
    if (image.isEmpty()) throw new Error(`empty capture at ${size}px`)
    if (image.getSize().width !== size) image = image.resize({ width: size, height: size, quality: 'best' })
    results.set(size, image.toPNG())
    console.log(`rendered ${size}x${size}`)
  }
  window.destroy()
  return results
}

app
  .whenReady()
  .then(async () => {
    // png-to-ico is pure ESM; a top-level require would throw while loading.
    const pngToIco = (await import('png-to-ico')).default
    const rendered = await renderAll(readFileSync(join(resources, 'icon.svg'), 'utf8'))
    writeFileSync(join(resources, 'icon.ico'), await pngToIco(SIZES.map((size) => rendered.get(size))))
    writeFileSync(join(resources, 'icon.png'), rendered.get(256))
    console.log('wrote resources/icon.ico and resources/icon.png')
    app.quit()
  })
  .catch((error) => {
    console.error(error)
    app.exit(1)
  })
