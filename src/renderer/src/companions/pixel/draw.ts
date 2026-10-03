import { EFFECT_PALETTE, overlays, type Moment } from './animate'
import { HEIGHT, paletteOf, WIDTH, type PixelAnimal } from './species'
import type { Grid, Palette } from './sprite'
import type { AccessoryId } from '../types'

/** Room above the frame, so a hop never leaves the canvas. */
export const MARGIN = 4
export const CANVAS_WIDTH = WIDTH
export const CANVAS_HEIGHT = HEIGHT + MARGIN

function drawGrid(ctx: CanvasRenderingContext2D, grid: Grid, palette: Palette, dx: number, dy: number, alpha = 1): void {
  ctx.globalAlpha = alpha
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const colour = palette[row[x]]
      if (row[x] === '.' || !colour) continue
      ctx.fillStyle = colour
      ctx.fillRect(x + dx, y + dy, 1, 1)
    }
  })
  ctx.globalAlpha = 1
}

export interface Look {
  animal: PixelAnimal
  coat: string
  eyes: string
  accessory: AccessoryId
}

/** Paints one moment of an animal onto a canvas of CANVAS_WIDTH × CANVAS_HEIGHT. */
export function paint(ctx: CanvasRenderingContext2D, look: Look, moment: Moment): void {
  const dy = MARGIN - moment.lift
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  drawGrid(ctx, look.animal.frame(moment.pose, look.accessory), paletteOf(look.animal, look.coat, look.eyes), 0, dy)
  for (const o of overlays(moment.effect, moment.phase, look.animal.anchor)) drawGrid(ctx, o.grid, EFFECT_PALETTE, o.x, o.y + dy, o.alpha)
}

/** A key that only changes when the picture does, so a canvas can skip identical frames. */
export function momentKey(moment: Moment, look: Look): string {
  const effects = overlays(moment.effect, moment.phase, look.animal.anchor).map((o) => `${o.x},${o.y},${o.alpha.toFixed(1)}`)
  return JSON.stringify([moment.pose, moment.lift, effects, look.coat, look.eyes, look.accessory])
}
