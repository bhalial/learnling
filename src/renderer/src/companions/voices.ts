import type { Lang } from '../types'
import type { Species } from './types'

/**
 * How each animal talks. The theme says what happened (a spell cast, a seed sown); the
 * animal adds its own sound and manner: the cat purrs, the dog woofs, the parrot says
 * things twice, the whale is a slow and patient punster, the robot reports in status lines.
 * lib/cat.ts takes turns between the theme's line and these, so the note stays fresh.
 *
 * Every line must fit any theme: no spells, seeds or missions here.
 */
export interface Voice {
  /** Cheers for a ticked-off task; "… left for today" is added after them. */
  yay: string[]
  decoded: string[]
  dress: string[]
  added: string[]
  moved: string[]
  undo: string[]
  /** When today's page is done. */
  clear: string[]
}

export const VOICES: Record<Species, Record<Lang, Voice>> = {
  cat: {
    en: {
      yay: ['Purr-fect!', 'Mrrrow, nicely done!'],
      decoded: ['Mrow! Now we know what it is.'],
      dress: ['Purrr… I look fabulous.'],
      added: ['Noted. *swishes tail*'],
      moved: ['Moved. I’ll keep one eye open for it.'],
      undo: ['No worries. I’ll curl up next to it until it’s done.'],
      clear: ['All done. Time for a nap in the sun!']
    },
    nl: {
      yay: ['Spinnend goed!', 'Mrrrauw, goed gedaan!'],
      decoded: ['Mrauw! Nu weten we wat het is.'],
      dress: ['Prrr… ik zie er prachtig uit.'],
      added: ['Genoteerd. *zwiept met staart*'],
      moved: ['Verplaatst. Ik hou er één oog op.'],
      undo: ['Geen zorgen. Ik ga er wel even naast liggen tot het af is.'],
      clear: ['Alles af. Tijd voor een dutje in de zon!']
    }
  },
  dog: {
    en: {
      yay: ['Woof! Good job!', 'Paw-some!'],
      decoded: ['Woof! Sniffed it out!'],
      dress: ['*wags tail* Do I look good? I look good!'],
      added: ['Got it! I’ll fetch it when it’s time.'],
      moved: ['Moved! I’ll come and get you on the day.'],
      undo: ['No problem, we’ll try again later. Woof!'],
      clear: ['All done! Walk time? Walk time!']
    },
    nl: {
      yay: ['Waf! Goed zo!', 'Poot-astisch!'],
      decoded: ['Waf! Uitgesnuffeld!'],
      dress: ['*kwispelt* Sta ik leuk? Ik sta leuk!'],
      added: ['Hebbes! Ik apporteer het als het tijd is.'],
      moved: ['Verplaatst! Ik kom je die dag halen.'],
      undo: ['Geeft niks, we proberen het straks weer. Waf!'],
      clear: ['Alles af! Wandelen? Wandelen!']
    }
  },
  parrot: {
    en: {
      yay: ['Squawk! Well done, well done!', 'Brilliant! Brilliant!'],
      decoded: ['Squawk! Now I can say it back to you!'],
      dress: ['Pretty bird! Pretty bird!'],
      added: ['Squawk! Written down, written down!'],
      moved: ['Moved! Moved! I’ll remind you.'],
      undo: ['Not done yet? Squawk, no problem.'],
      clear: ['All done! All done! Time to play!']
    },
    nl: {
      yay: ['Krraa! Goed gedaan, goed gedaan!', 'Knap! Knap!'],
      decoded: ['Krraa! Nu kan ik het je nazeggen!'],
      dress: ['Mooie vogel! Mooie vogel!'],
      added: ['Krraa! Opgeschreven, opgeschreven!'],
      moved: ['Verplaatst! Verplaatst! Ik herinner je eraan.'],
      undo: ['Nog niet af? Krraa, geen probleem.'],
      clear: ['Alles af! Alles af! Tijd om te spelen!']
    }
  },
  whale: {
    en: {
      yay: ['Whale done!', 'Splash! Fin-tastic!'],
      decoded: ['Blub blub! Mystery solved.'],
      dress: ['Ooh, the best-dressed whale in the whole sea.'],
      added: ['Noted! A whale never forgets.'],
      moved: ['Moved. I’ll swim by on the day to remind you.'],
      undo: ['No worries. The sea is patient, and so am I.'],
      clear: ['All done! Time to float around.']
    },
    nl: {
      yay: ['Plons! Goed gedaan!', 'Vin-tastisch!'],
      decoded: ['Blub blub! Raadsel opgelost.'],
      dress: ['Ooh, de best geklede walvis van de hele zee.'],
      added: ['Genoteerd! Een walvis vergeet nooit iets.'],
      moved: ['Verplaatst. Ik zwem die dag even langs om je te herinneren.'],
      undo: ['Geen zorgen. De zee heeft geduld, en ik ook.'],
      clear: ['Alles af! Tijd om lekker te dobberen.']
    }
  },
  robot: {
    en: {
      yay: ['Beep boop! Task complete.', 'Excellent. Happiness level: 100%.'],
      decoded: ['Beep! Data decoded.'],
      dress: ['New look installed. Status: excellent.'],
      added: ['Beep! Saved to memory.'],
      moved: ['Rescheduled. Reminder set.'],
      undo: ['Undo complete. No errors found.'],
      clear: ['All tasks complete. Switching to play mode.']
    },
    nl: {
      yay: ['Biep boep! Taak voltooid.', 'Uitstekend. Blijheid: 100%.'],
      decoded: ['Biep! Gegevens ontcijferd.'],
      dress: ['Nieuwe look geïnstalleerd. Status: geweldig.'],
      added: ['Biep! Opgeslagen in mijn geheugen.'],
      moved: ['Verplaatst. Herinnering ingesteld.'],
      undo: ['Ongedaan gemaakt. Geen fouten gevonden.'],
      clear: ['Alle taken klaar. Speelmodus aan.']
    }
  }
}
