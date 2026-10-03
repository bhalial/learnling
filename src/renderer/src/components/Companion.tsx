import { useEffect, useRef } from 'react'
import { coatFor, eyesFor, SPECIES } from '../companions'
import { momentOf } from '../companions/pixel/animate'
import { CANVAS_HEIGHT, CANVAS_WIDTH, momentKey, paint, type Look } from '../companions/pixel/draw'
import type { Headwear } from '../companions/pixel/face'
import type { CompanionLook, Mood } from '../companions/types'

/**
 * A companion in pixel art, animated. `scale` is how many screen pixels one art pixel
 * gets (whole numbers keep the pixels crisp). `pulse` changes on every event, so a second
 * celebration in a row plays again; `seed` keeps animals side by side from blinking in
 * unison. `headwear` is what the hat slot holds, which the theme decides.
 */
export function Companion({
  look,
  mood,
  pulse = 0,
  scale,
  seed = 0,
  headwear
}: {
  look: CompanionLook
  mood: Mood
  pulse?: number
  scale: number
  seed?: number
  headwear?: Headwear
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const art: Look = {
    animal: SPECIES[look.species].art,
    coat: coatFor(look.species, look.coat),
    eyes: eyesFor(look.eyes),
    accessory: look.accessory,
    headwear
  }

  // The drawing loop reads these, so a new look or mood never restarts it.
  const latest = useRef({ art, mood })
  const since = useRef(0)
  useEffect(() => {
    latest.current = { art, mood }
  })
  useEffect(() => {
    since.current = performance.now()
  }, [mood, pulse])

  useEffect(() => {
    const ctx = canvas.current!.getContext('2d')!
    // With reduced motion each mood is one still picture.
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let shown = ''
    const tick = (now: number): void => {
      const { art: look, mood } = latest.current
      const moment = still ? momentOf(mood, 0, 0, seed) : momentOf(mood, now, now - since.current, seed)
      const key = momentKey(moment, look)
      if (key !== shown) {
        paint(ctx, look, moment)
        shown = key
      }
      frame = requestAnimationFrame(tick)
    }
    const start = (): void => {
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const stop = (): void => {
      cancelAnimationFrame(frame)
      frame = 0
    }
    // Nothing to animate while the book is put away.
    const onVisibility = (): void => (document.hidden ? stop() : start())
    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [seed])

  // Whole device pixels per art pixel, also on a 125% display, so every pixel is the same size.
  const unit = Math.max(1, Math.round(scale * devicePixelRatio)) / devicePixelRatio

  return (
    <canvas
      ref={canvas}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      aria-hidden="true"
      className="block [image-rendering:pixelated]"
      style={{ width: CANVAS_WIDTH * unit, height: CANVAS_HEIGHT * unit }}
    />
  )
}
