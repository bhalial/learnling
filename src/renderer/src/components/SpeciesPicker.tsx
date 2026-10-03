import { ALL_SPECIES, SPECIES } from '../companions'
import type { CompanionLook, Species } from '../companions/types'
import type { Lang } from '../types'
import { Companion } from './Companion'

/** Every animal alive side by side, in her colours; tap one to make it hers. The chosen one cheers. */
export function SpeciesPicker({ look, lang, onPick }: { look: CompanionLook; lang: Lang; onPick: (species: Species) => void }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {ALL_SPECIES.map((species, i) => {
        const chosen = look.species === species
        return (
          <button
            key={species}
            type="button"
            onClick={() => onPick(species)}
            aria-pressed={chosen}
            className={`flex flex-col items-center rounded-md pb-1.5 pt-1 font-fell text-[19px] ${chosen ? 'ring-[1.5px] ring-ink' : 'text-ink-soft'}`}
          >
            <Companion look={{ ...look, species }} mood={chosen ? 'happy' : 'idle'} scale={3} seed={i} />
            {SPECIES[species].name[lang]}
          </button>
        )
      })}
    </div>
  )
}
