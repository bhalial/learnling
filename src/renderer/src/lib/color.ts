/**
 * Colour sums for readable text: contrast as WCAG measures it, and mixing in OKLab (the
 * way CSS color-mix does), so a subject's colour can be cut with ink until it reads well.
 */

type Rgb = [number, number, number]

const channels = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as Rgb
const linear = (v: number): number => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const gamma = (v: number): number => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
const toHex = (rgb: Rgb): string =>
  '#' + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('')

function toOklab(hex: string): Rgb {
  const [r, g, b] = channels(hex).map(linear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ]
}

function fromOklab([L, a, b]: Rgb): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return toHex(
    [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
    ].map(gamma) as Rgb
  )
}

/** `a` and `b` mixed in OKLab, `share` of `a`: color-mix(in oklab, a share%, b). */
export function mix(a: string, b: string, share: number): string {
  const A = toOklab(a)
  const B = toOklab(b)
  return fromOklab(A.map((v, i) => v * share + B[i] * (1 - share)) as Rgb)
}

const luminance = (hex: string): number => {
  const [r, g, b] = channels(hex).map(linear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** The WCAG contrast ratio of two colours, 1 to 21. Body text needs 4.5. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

export const READABLE = 4.5

const inks = new Map<string, string>()

/**
 * A subject's colour as text on a page: `most` of the colour cut with `ink`, and more ink
 * only where that is not yet readable (4.5:1). Deep colours keep their character; a pale
 * yellow gets the extra ink it needs.
 */
export function subjectInk(color: string, paper: string, ink: string, most = 0.72): string {
  const key = `${color}${paper}${ink}${most}`
  const known = inks.get(key)
  if (known) return known
  let share = most
  let out = mix(color, ink, share)
  while (contrast(out, paper) < READABLE + 0.1 && share > 0) {
    share -= 0.02
    out = mix(color, ink, Math.max(0, share))
  }
  inks.set(key, out)
  return out
}
