/**
 * How big the whole app is drawn, for a small laptop screen or eyes that like it larger.
 * The steps are the same whether you use the buttons or Ctrl + / Ctrl - (Ctrl 0 resets).
 */
export const ZOOMS = [0.75, 0.85, 0.9, 1, 1.1, 1.25, 1.4]

/** The zoom one step bigger (+1) or smaller (-1) than `current`; step 0 is back to normal. */
export function stepZoom(current: number, step: number): number {
  if (step === 0) return 1
  const nearest = ZOOMS.reduce((best, zoom, i) => (Math.abs(zoom - current) < Math.abs(ZOOMS[best] - current) ? i : best), 0)
  return ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, nearest + Math.sign(step)))]
}

/** A zoom from a saved book, kept to the steps there are. */
export const zoomFor = (zoom: unknown): number => (typeof zoom === 'number' && ZOOMS.includes(zoom) ? zoom : 1)

/** Screens shorter than this (a 1366 × 768 Chromebook, say) cut off the bottom of the book at 100 %. */
const SHORT_SCREEN = 800

/**
 * The size a book starts at before anyone has picked one: 90 % on a short screen, so it all
 * fits. Null when a size was picked (even 100 %) or the screen is tall enough.
 */
export const firstZoom = (zoom: unknown, screenHeight: number): number | null =>
  zoom === undefined && screenHeight < SHORT_SCREEN ? 0.9 : null
