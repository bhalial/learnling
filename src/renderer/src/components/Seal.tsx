const EDGE =
  'M20 3 C 26 2, 29 6, 33 8 C 37 11, 37 16, 37 20 C 38 25, 35 29, 32 33 C 28 37, 24 37, 20 37 C 15 38, 11 35, 8 32 C 4 28, 3 24, 3 20 C 2 15, 5 11, 8 8 C 11 5, 15 3, 20 3 Z'
const STAR = 'M20 13 L22 18 L27 18 L23 21.5 L24.5 27 L20 24 L15.5 27 L17 21.5 L13 18 L18 18 Z'
const BOLT = 'M22 11 L15 22 L20 22 L18 29 L25 18 L20 18 Z'

/** A wax seal: red with a star for a test, blue with a bolt for a quiz. */
export function Seal({ kind, size = 40 }: { kind: 'test' | 'quiz'; size?: number }) {
  const test = kind === 'test'
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="drop-shadow-[0_2px_1px_rgb(0_0_0/0.3)]">
      <path d={EDGE} fill={test ? '#a32c25' : '#2f4a7a'} />
      <circle cx="20" cy="20" r="11" fill={test ? '#8a2019' : '#253c66'} stroke={test ? '#c2463d' : '#4c6aa0'} strokeWidth="1" />
      <path d={test ? STAR : BOLT} fill={test ? '#efc4ad' : '#c7d6f2'} />
    </svg>
  )
}
