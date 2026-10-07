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
