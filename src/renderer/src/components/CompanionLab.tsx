import { ALL_SPECIES, SPECIES } from '../companions'
import { ALL_HEADWEAR } from '../companions/pixel/face'
import type { AccessoryId, Mood } from '../companions/types'
import { Companion } from './Companion'

const MOODS: Mood[] = ['idle', 'happy', 'talk', 'curious', 'sleep', 'proud']
const GEAR: AccessoryId[] = ['hat', 'collar', 'none']

/**
 * A development page for judging the pixel art. `#lab` shows every animal in every mood
 * side by side, in turns of coat, gear and the themes' headwear; `#lab=whale` shows one animal large.
 */
export function CompanionLab() {
  const only = ALL_SPECIES.find((species) => location.hash === `#lab=${species}`)
  const rows = only ? [only] : ALL_SPECIES
  const scale = only ? 6 : 3

  return (
    <div className="desk h-full overflow-auto p-4 text-cream">
      <div className="grid gap-x-4 gap-y-2" style={{ gridTemplateColumns: `80px repeat(${MOODS.length}, max-content)` }}>
        <span />
        {MOODS.map((mood) => (
          <span key={mood} className="text-center font-fell text-[18px]">
            {mood}
          </span>
        ))}
        {rows.map((species) => [
          <span key={species} className="self-center font-fell text-[18px]">
            {species}
          </span>,
          ...MOODS.map((mood, i) => {
            const coats = SPECIES[species].coats
            const look = { species, coat: coats[i % coats.length].id, accessory: GEAR[i % GEAR.length], eyes: 'green' }
            return <Companion key={`${species}-${mood}`} look={look} mood={mood} scale={scale} seed={i} headwear={ALL_HEADWEAR[i % ALL_HEADWEAR.length]} />
          })
        ])}
      </div>
    </div>
  )
}
