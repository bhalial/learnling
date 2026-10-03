import type { AccessoryId } from '../companions/types'

const FUR: Record<string, { fur: string; shade: string; light: string; eye: string }> = {
  midnight: { fur: '#34303f', shade: '#24212d', light: '#575166', eye: '#c9e265' },
  ginger: { fur: '#df8a3e', shade: '#b96722', light: '#f7dcb8', eye: '#7bbf4a' },
  silver: { fur: '#a6acb9', shade: '#80879a', light: '#e6e8ee', eye: '#e2b93c' },
  cream: { fur: '#f1e6d2', shade: '#d2c1a3', light: '#fffaf0', eye: '#5aa7e0' }
}

const INK = '#2b2118'
const ink = { stroke: INK, strokeWidth: 3.5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
const thin = { stroke: INK, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round', fill: 'none' } as const

interface CatProps {
  /** A cat coat id; any other animal's coat falls back to ginger. */
  fur: string
  accessory: AccessoryId
  /** Changes on every celebration; odd and even swap animations so each one replays. */
  celebration: number | null
}

/** The flat drawn cat from the style sketch: the fallback where WebGL is missing. */
export function Cat({ fur, accessory, celebration }: CatProps) {
  const c = FUR[fur] ?? FUR.ginger
  const tail = 'M146 196 C 186 198, 204 160, 186 130 C 178 116, 184 102, 198 98'

  return (
    <div className={`cat relative h-[220px] w-[220px] ${celebration === null ? '' : `is-happy-${celebration % 2}`}`}>
      <svg viewBox="0 0 220 220" className="block h-full w-full overflow-visible" aria-hidden="true">
        <ellipse cx="110" cy="212" rx="66" ry="6" fill="#000" opacity="0.22" />

        <g className="cat-tail">
          <path d={tail} fill="none" stroke={INK} strokeWidth="17" strokeLinecap="round" />
          <path d={tail} fill="none" stroke={c.fur} strokeWidth="10" strokeLinecap="round" />
        </g>

        <g className="cat-body">
          <path {...ink} fill={c.fur} d="M68 206 C 56 174, 62 138, 86 122 L 134 122 C 158 138, 164 174, 152 206 Z" />
          <path fill={c.shade} opacity="0.75" d="M134 124 C 156 140, 161 174, 150 204 L 140 204 C 147 176, 145 148, 128 128 Z" />
          <path fill={c.light} d="M94 128 C 100 146, 120 146, 126 128 C 124 158, 118 186, 110 198 C 102 186, 96 158, 94 128 Z" />
          <ellipse {...ink} fill={c.fur} cx="92" cy="205" rx="15" ry="9" />
          <ellipse {...ink} fill={c.fur} cx="128" cy="205" rx="15" ry="9" />
          <path {...thin} d="M88 202 L 88 208 M96 202 L 96 208 M124 202 L 124 208 M132 202 L 132 208" />
        </g>

        <g className="cat-head">
          <path {...ink} fill={c.fur} d="M68 80 L72 34 L104 58 Z" />
          <path {...ink} fill={c.fur} d="M152 80 L148 34 L116 58 Z" />
          <path fill="#e3a0a6" d="M77 70 L79 47 L96 60 Z" />
          <path fill="#e3a0a6" d="M143 70 L141 47 L124 60 Z" />
          <ellipse {...ink} fill={c.fur} cx="110" cy="88" rx="47" ry="40" />
          <path fill="none" stroke={c.shade} strokeWidth="4" strokeLinecap="round" d="M100 52 L102 63 M110 49 L110 61 M120 52 L118 63" />
          <ellipse fill={c.light} cx="110" cy="104" rx="18" ry="11" />
          <g className="cat-eyes">
            {[91, 129].map((x) => (
              <g key={x}>
                <ellipse stroke={INK} strokeWidth="2" fill={c.eye} cx={x} cy="86" rx="8.5" ry="10" />
                <ellipse fill={INK} cx={x} cy="87" rx="2.6" ry="7" />
                <circle fill="#fff" cx={x + 2.5} cy="82" r="2.2" />
              </g>
            ))}
          </g>
          <path stroke={INK} strokeWidth="2" strokeLinejoin="round" fill="#d97a8a" d="M105 97 L115 97 L110 103 Z" />
          <path {...thin} d="M110 103 C 110 109, 104 111, 101 108 M110 103 C 110 109, 116 111, 119 108" />
          <path fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" d="M86 102 L56 97 M86 107 L58 111 M134 102 L164 97 M134 107 L162 111" />
        </g>

        {accessory === 'collar' && (
          <g>
            <path d="M84 128 Q110 142 136 128" fill="none" stroke={INK} strokeWidth="10" strokeLinecap="round" />
            <path d="M84 128 Q110 142 136 128" fill="none" stroke="#a32c25" strokeWidth="6" strokeLinecap="round" />
            <circle stroke={INK} strokeWidth="2" fill="#e3b54a" cx="110" cy="140" r="6.5" />
          </g>
        )}

        {accessory === 'hat' && (
          <g>
            <path {...ink} fill="#4b3a8c" d="M88 56 C 95 38, 106 16, 132 2 C 125 20, 128 40, 133 56 Z" />
            <path fill="#c79a3a" d="M89 46 C 103 50, 119 50, 133 46 L 134 51 C 119 55, 103 55, 88 51 Z" />
            <path fill="#e8c35a" d="M113 22 L115 27 L120 29 L115 31 L113 36 L111 31 L106 29 L111 27 Z" />
            <ellipse {...ink} fill="#3c2d73" cx="110" cy="57" rx="30" ry="7" />
          </g>
        )}
      </svg>

      <svg viewBox="0 0 240 240" className="cat-sparkles pointer-events-none absolute -inset-2.5" aria-hidden="true">
        {[
          'M34 60 L38 70 L48 74 L38 78 L34 88 L30 78 L20 74 L30 70 Z',
          'M200 40 L203 48 L211 51 L203 54 L200 62 L197 54 L189 51 L197 48 Z',
          'M214 120 L216 126 L222 128 L216 130 L214 136 L212 130 L206 128 L212 126 Z'
        ].map((d) => (
          <path key={d} d={d} fill="#e3b54a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        ))}
      </svg>
    </div>
  )
}
