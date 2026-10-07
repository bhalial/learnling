import { describe, expect, it } from 'vitest'
import { stepZoom, ZOOMS, zoomFor } from './zoom'

describe('zoom', () => {
  it('steps up and down, and stops at the ends', () => {
    expect(stepZoom(1, 1)).toBe(1.1)
    expect(stepZoom(1, -1)).toBe(0.9)
    expect(stepZoom(ZOOMS[ZOOMS.length - 1], 1)).toBe(ZOOMS[ZOOMS.length - 1])
    expect(stepZoom(ZOOMS[0], -1)).toBe(ZOOMS[0])
  })

  it('goes back to normal on step 0', () => {
    expect(stepZoom(1.25, 0)).toBe(1)
  })

  it('keeps a saved zoom only when it is one of the steps', () => {
    expect(zoomFor(1.1)).toBe(1.1)
    expect(zoomFor(3)).toBe(1)
    expect(zoomFor(undefined)).toBe(1)
  })
})
