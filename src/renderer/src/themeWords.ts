import type { ThemeWords } from './i18n'
import type { ThemeId } from './themes'
import type { Lang } from './types'

/**
 * Each theme's own words, laid over the plain ones in i18n.ts. Only what a theme makes
 * its own is here; the rest (dates, Magister, settings) is the same everywhere. The words
 * for a test and a quiz always stay: a theme adds its own name next to them, so it is
 * never in doubt that a test is a test.
 */
export const THEME_WORDS: Record<ThemeId, Record<Lang, ThemeWords>> = {
  magic: {
    en: {
      title: 'My Spellbook',
      newTask: 'New spell',
      progress: (done, total) => `${done} of ${total} spells cast this week`,
      progressEmpty: 'No spells yet this week',
      kinds: { study: 'Training' },
      decipher: 'Decipher',
      attention: 'Needs attention',
      hat: 'Wizard hat',
      sheet: {
        newTitle: 'A new spell',
        editTitle: 'Change this spell',
        emptyHint: 'Don’t know yet? Leave it empty and decipher it later.',
        training: (n) => `I’ll plan ${n} training rounds before it.`,
        add: 'Write it in the book'
      },
      cat: {
        mystery: (subject) => `${subject} set homework, but nobody wrote down what. Decipher it before you forget!`,
        late: (n) => (n === 1 ? 'One spell slipped past its day. Drag it to a new one?' : `${n} spells slipped past their day. Drag them to a new one?`),
        trialSoon: (subject, kind, when) => `${subject} ${kind.toLowerCase()} ${when}. A training round today?`,
        left: (n) => (n === 1 ? 'One spell left for today.' : `${n} spells left for today.`),
        empty: 'Nothing in the book yet. Tap “New spell” when a teacher gives homework.',
        yay: (n) => (n === 0 ? 'Spell cast! That was the last one for today.' : `Spell cast! ${n} left for today.`),
        decoded: 'Scroll deciphered! Now it can’t sneak away.',
        dress: 'Ooh. Very magical.',
        added: 'Written in the book!',
        synced: (n) => (n === 1 ? 'Magister brought one new spell.' : `Magister brought ${n} new spells.`)
      }
    },
    nl: {
      title: 'Mijn spreukenboek',
      newTask: 'Nieuwe spreuk',
      progress: (done, total) => `${done} van ${total} spreuken gelukt deze week`,
      progressEmpty: 'Nog geen spreuken deze week',
      kinds: { study: 'Training' },
      decipher: 'Ontcijfer',
      attention: 'Aandacht nodig',
      hat: 'Tovenaarshoed',
      sheet: {
        newTitle: 'Een nieuwe spreuk',
        editTitle: 'Deze spreuk aanpassen',
        emptyHint: 'Weet je het nog niet? Laat het leeg en ontcijfer het later.',
        training: (n) => `Ik plan er ${n} trainingsrondes voor in.`,
        add: 'Schrijf in het boek'
      },
      cat: {
        mystery: (subject) => `${subject} gaf huiswerk, maar er staat niet bij wát. Ontcijfer het voor je het vergeet!`,
        late: (n) => (n === 1 ? 'Er is één spreuk over zijn dag heen geglipt. Naar een nieuwe dag slepen?' : `Er zijn ${n} spreuken over hun dag heen geglipt. Naar een nieuwe dag slepen?`),
        trialSoon: (subject, kind, when) => `${kind} ${subject.toLowerCase()} ${when}. Vandaag een trainingsronde?`,
        left: (n) => (n === 1 ? 'Nog één spreuk voor vandaag.' : `Nog ${n} spreuken voor vandaag.`),
        empty: 'Er staat nog niks in het boek. Tik op “Nieuwe spreuk” als je huiswerk krijgt.',
        yay: (n) => (n === 0 ? 'Spreuk gelukt! Dat was de laatste voor vandaag.' : `Spreuk gelukt! Nog ${n} voor vandaag.`),
        decoded: 'Rol ontcijferd! Nu kan hij niet meer wegsluipen.',
        dress: 'Ooh. Heel magisch.',
        added: 'Staat in het boek!',
        synced: (n) => (n === 1 ? 'Magister bracht één nieuwe spreuk.' : `Magister bracht ${n} nieuwe spreuken.`)
      }
    }
  },

  garden: {
    en: {
      title: 'My garden',
      newTask: 'New seed',
      progress: (done, total) => `${done} of ${total} seeds sprouted this week`,
      progressEmpty: 'Nothing sown yet this week',
      kinds: { study: 'Watering' },
      testName: 'Harvest',
      quizName: 'Small harvest',
      mysteryText: 'What will this seed grow?',
      decipher: 'Find out',
      attention: 'Nearly wilted',
      hat: 'Straw hat',
      sheet: {
        newTitle: 'A new seed',
        editTitle: 'Change this seed',
        emptyHint: 'Don’t know yet? Leave it empty and find out later.',
        training: (n) => `I’ll plan ${n} waterings before it.`,
        add: 'Sow it'
      },
      cat: {
        mystery: (subject) => `${subject} set homework, but nobody wrote down what. An unknown seed! Find out what it is before you forget.`,
        late: (n) => (n === 1 ? 'One seed is nearly wilting. Drag it to a new day?' : `${n} seeds are nearly wilting. Drag them to a new day?`),
        trialSoon: (subject, kind, when) => `${subject} ${kind.toLowerCase()} ${when}. Some watering today?`,
        left: (n) => (n === 1 ? 'One seed left for today.' : `${n} seeds left for today.`),
        clear: 'The whole garden is done for today. Go play some Minecraft!',
        empty: 'Nothing sown yet. Tap “New seed” when a teacher gives homework.',
        yay: (n) => (n === 0 ? 'It’s growing! That was the last one for today.' : `It’s growing! ${n} left for today.`),
        decoded: 'Now you know what will grow! It can’t hide any more.',
        dress: 'Ready for the garden.',
        added: 'Sown!',
        synced: (n) => (n === 1 ? 'Magister brought one new seed.' : `Magister brought ${n} new seeds.`)
      }
    },
    nl: {
      title: 'Mijn moestuin',
      newTask: 'Nieuw zaadje',
      progress: (done, total) => `${done} van ${total} zaadjes ontkiemd deze week`,
      progressEmpty: 'Nog niks gezaaid deze week',
      kinds: { study: 'Water geven' },
      testName: 'Oogst',
      quizName: 'Kleine oogst',
      mysteryText: 'Wat wordt dit zaadje?',
      decipher: 'Ontdek',
      attention: 'Bijna verwelkt',
      hat: 'Strohoed',
      sheet: {
        newTitle: 'Een nieuw zaadje',
        editTitle: 'Dit zaadje aanpassen',
        emptyHint: 'Weet je het nog niet? Laat het leeg en ontdek het later.',
        training: (n) => `Ik plan er ${n} keer water geven voor in.`,
        add: 'Zaai het'
      },
      cat: {
        mystery: (subject) => `${subject} gaf huiswerk, maar er staat niet bij wát. Een onbekend zaadje! Ontdek wat het is voor je het vergeet.`,
        late: (n) => (n === 1 ? 'Er is één zaadje bijna verwelkt. Naar een nieuwe dag slepen?' : `Er zijn ${n} zaadjes bijna verwelkt. Naar een nieuwe dag slepen?`),
        trialSoon: (subject, kind, when) => `${kind} ${subject.toLowerCase()} ${when}. Vandaag even water geven?`,
        left: (n) => (n === 1 ? 'Nog één zaadje voor vandaag.' : `Nog ${n} zaadjes voor vandaag.`),
        clear: 'De hele tuin is klaar voor vandaag. Ga lekker Minecraften!',
        empty: 'Er is nog niks gezaaid. Tik op “Nieuw zaadje” als je huiswerk krijgt.',
        yay: (n) => (n === 0 ? 'Het groeit! Dat was de laatste voor vandaag.' : `Het groeit! Nog ${n} voor vandaag.`),
        decoded: 'Nu weet je wat er groeit! Het kan zich niet meer verstoppen.',
        dress: 'Klaar voor de tuin.',
        added: 'Gezaaid!',
        synced: (n) => (n === 1 ? 'Magister bracht één nieuw zaadje.' : `Magister bracht ${n} nieuwe zaadjes.`)
      }
    }
  },

  ocean: {
    en: {
      title: 'Dive log',
      newTask: 'New dive',
      progress: (done, total) => `${done} of ${total} pearls found this week`,
      progressEmpty: 'No dives yet this week',
      kinds: { study: 'Practice dive' },
      testName: 'Deep dive',
      quizName: 'Snorkel trip',
      round: (n, of) => `Dive ${n} of ${of}`,
      mysteryText: 'A message in a bottle!',
      decipher: 'Open',
      attention: 'Washed ashore',
      hat: 'Goggles',
      sheet: {
        newTitle: 'A new dive',
        editTitle: 'Change this dive',
        emptyHint: 'Don’t know yet? Leave it empty and open it later.',
        training: (n) => `I’ll plan ${n} practice dives before it.`,
        add: 'Add to the dive log'
      },
      cat: {
        mystery: (subject) => `A message in a bottle from ${subject}: homework, but nobody wrote down what. Open it before you forget!`,
        late: (n) => (n === 1 ? 'One dive washed ashore. Drag it to a new day?' : `${n} dives washed ashore. Drag them to a new day?`),
        trialSoon: (subject, kind, when) => `${subject} ${kind.toLowerCase()} ${when}. A practice dive today?`,
        left: (n) => (n === 1 ? 'One dive left for today.' : `${n} dives left for today.`),
        clear: 'Every pearl of today is found. Go play some Minecraft!',
        empty: 'Your dive log is empty. Tap “New dive” when a teacher gives homework.',
        yay: (n) => (n === 0 ? 'A pearl! That was the last one for today.' : `A pearl! ${n} left for today.`),
        decoded: 'Bottle opened! Now it can’t float away.',
        dress: 'Ready to dive.',
        added: 'In the dive log!',
        synced: (n) => (n === 1 ? 'Magister brought one new dive.' : `Magister brought ${n} new dives.`)
      }
    },
    nl: {
      title: 'Duiklogboek',
      newTask: 'Nieuwe duik',
      progress: (done, total) => `${done} van ${total} parels gevonden deze week`,
      progressEmpty: 'Nog geen duiken deze week',
      kinds: { study: 'Proefduik' },
      testName: 'Diepzeeduik',
      quizName: 'Snorkeltocht',
      round: (n, of) => `Duik ${n} van ${of}`,
      mysteryText: 'Een briefje in een fles!',
      decipher: 'Openen',
      attention: 'Aangespoeld',
      hat: 'Duikbril',
      sheet: {
        newTitle: 'Een nieuwe duik',
        editTitle: 'Deze duik aanpassen',
        emptyHint: 'Weet je het nog niet? Laat het leeg en maak het later open.',
        training: (n) => `Ik plan er ${n} proefduiken voor in.`,
        add: 'Zet in het duiklogboek'
      },
      cat: {
        mystery: (subject) => `Een fles met een briefje van ${subject}: huiswerk, maar er staat niet bij wát. Maak hem open voor je het vergeet!`,
        late: (n) => (n === 1 ? 'Er is één duik aangespoeld. Naar een nieuwe dag slepen?' : `Er zijn ${n} duiken aangespoeld. Naar een nieuwe dag slepen?`),
        trialSoon: (subject, kind, when) => `${kind} ${subject.toLowerCase()} ${when}. Vandaag een proefduik?`,
        left: (n) => (n === 1 ? 'Nog één duik voor vandaag.' : `Nog ${n} duiken voor vandaag.`),
        clear: 'Alle parels van vandaag gevonden. Ga lekker Minecraften!',
        empty: 'Je duiklogboek is nog leeg. Tik op “Nieuwe duik” als je huiswerk krijgt.',
        yay: (n) => (n === 0 ? 'Een parel! Dat was de laatste voor vandaag.' : `Een parel! Nog ${n} voor vandaag.`),
        decoded: 'Fles geopend! Nu kan hij niet meer wegdrijven.',
        dress: 'Klaar om te duiken.',
        added: 'Staat in je duiklogboek!',
        synced: (n) => (n === 1 ? 'Magister bracht één nieuwe duik.' : `Magister bracht ${n} nieuwe duiken.`)
      }
    }
  },

  space: {
    en: {
      title: 'Mission log',
      newTask: 'New mission',
      progress: (done, total) => `${done} of ${total} missions complete this week`,
      progressEmpty: 'No missions yet this week',
      kinds: { study: 'Simulation' },
      testName: 'Launch',
      quizName: 'Test flight',
      mysteryText: 'An unknown signal!',
      decipher: 'Decode',
      attention: 'Distress signal',
      hat: 'Space cap',
      sheet: {
        newTitle: 'A new mission',
        editTitle: 'Change this mission',
        emptyHint: 'Don’t know yet? Leave it empty and decode it later.',
        training: (n) => `I’ll plan ${n} simulations before it.`,
        add: 'Add to the log'
      },
      cat: {
        mystery: (subject) => `${subject} sent an unknown signal: homework, but nobody said what. Decode it before you forget!`,
        late: (n) => (n === 1 ? 'One mission drifted past its day. Drag it to a new one?' : `${n} missions drifted past their day. Drag them to a new one?`),
        trialSoon: (subject, kind, when) => `${subject} ${kind.toLowerCase()} ${when}. A simulation today?`,
        left: (n) => (n === 1 ? 'One mission left for today.' : `${n} missions left for today.`),
        clear: 'All of today’s missions are done. Free time, commander!',
        empty: 'The log is still empty. Tap “New mission” when a teacher gives homework.',
        yay: (n) => (n === 0 ? 'Mission accomplished! That was the last one for today.' : `Mission accomplished! ${n} left for today.`),
        decoded: 'Signal decoded! Now it can’t drift away.',
        dress: 'Ready for launch.',
        added: 'Added to the log!',
        synced: (n) => (n === 1 ? 'Magister sent one new mission.' : `Magister sent ${n} new missions.`)
      }
    },
    nl: {
      title: 'Missielog',
      newTask: 'Nieuwe missie',
      progress: (done, total) => `${done} van ${total} missies voltooid deze week`,
      progressEmpty: 'Nog geen missies deze week',
      kinds: { study: 'Simulatie' },
      testName: 'Lancering',
      quizName: 'Testvlucht',
      mysteryText: 'Een onbekend signaal!',
      decipher: 'Ontcijfer',
      attention: 'Noodsignaal',
      hat: 'Ruimtepet',
      sheet: {
        newTitle: 'Een nieuwe missie',
        editTitle: 'Deze missie aanpassen',
        emptyHint: 'Weet je het nog niet? Laat het leeg en ontcijfer het later.',
        training: (n) => `Ik plan er ${n} simulaties voor in.`,
        add: 'Zet in het logboek'
      },
      cat: {
        mystery: (subject) => `${subject} stuurde een onbekend signaal: huiswerk, maar er staat niet bij wát. Ontcijfer het voor je het vergeet!`,
        late: (n) => (n === 1 ? 'Er is één missie uit koers geraakt. Naar een nieuwe dag slepen?' : `Er zijn ${n} missies uit koers geraakt. Naar een nieuwe dag slepen?`),
        trialSoon: (subject, kind, when) => `${kind} ${subject.toLowerCase()} ${when}. Vandaag een simulatie?`,
        left: (n) => (n === 1 ? 'Nog één missie voor vandaag.' : `Nog ${n} missies voor vandaag.`),
        clear: 'Alle missies van vandaag zijn klaar. Vrije tijd, commandant!',
        empty: 'Het logboek is nog leeg. Tik op “Nieuwe missie” als je huiswerk krijgt.',
        yay: (n) => (n === 0 ? 'Missie geslaagd! Dat was de laatste voor vandaag.' : `Missie geslaagd! Nog ${n} voor vandaag.`),
        decoded: 'Signaal ontcijferd! Nu kan het niet meer wegdrijven.',
        dress: 'Klaar voor de lancering.',
        added: 'Staat in het logboek!',
        synced: (n) => (n === 1 ? 'Magister stuurde één nieuwe missie.' : `Magister stuurde ${n} nieuwe missies.`)
      }
    }
  },

  quest: {
    en: {
      title: 'Questlog',
      newTask: 'New quest',
      progress: (done, total) => `${done} of ${total} quests cleared this week`,
      progressEmpty: 'No quests yet this week',
      kinds: { study: 'Training' },
      testName: 'Boss fight',
      quizName: 'Mini-boss',
      round: (n, of) => `Level ${n}/${of}`,
      mysteryText: 'A secret quest!',
      decipher: 'Reveal',
      attention: 'Missed quests',
      hat: 'Crown',
      sheet: {
        newTitle: 'A new quest',
        editTitle: 'Change this quest',
        emptyHint: 'Don’t know yet? Leave it empty and reveal it later.',
        training: (n) => `I’ll plan ${n} training levels before it.`,
        add: 'Add to the questlog'
      },
      cat: {
        mystery: (subject) => `${subject} gave a secret quest: homework, but nobody said what. Reveal it before you forget!`,
        late: (n) => (n === 1 ? 'One quest slipped past its day. Drag it to a new one?' : `${n} quests slipped past their day. Drag them to a new one?`),
        trialSoon: (subject, kind, when) => `${subject} ${kind.toLowerCase()} ${when}. Some training today?`,
        left: (n) => (n === 1 ? 'One quest left for today.' : `${n} quests left for today.`),
        clear: 'Every quest for today is cleared. Go play some Minecraft!',
        empty: 'Your questlog is empty. Tap “New quest” when a teacher gives homework.',
        yay: (n) => (n === 0 ? 'Quest cleared! That was the last one for today.' : `Quest cleared! ${n} left for today.`),
        decoded: 'Secret quest revealed! Now it can’t hide.',
        dress: 'Royal. Level up!',
        added: 'Quest accepted!',
        synced: (n) => (n === 1 ? 'Magister brought one new quest.' : `Magister brought ${n} new quests.`)
      }
    },
    nl: {
      title: 'Questlog',
      newTask: 'Nieuwe quest',
      progress: (done, total) => `${done} van ${total} quests gehaald deze week`,
      progressEmpty: 'Nog geen quests deze week',
      kinds: { study: 'Training' },
      testName: 'Boss fight',
      quizName: 'Mini-boss',
      round: (n, of) => `Level ${n}/${of}`,
      mysteryText: 'Een geheime quest!',
      decipher: 'Onthul',
      attention: 'Gemiste quests',
      hat: 'Kroon',
      sheet: {
        newTitle: 'Een nieuwe quest',
        editTitle: 'Deze quest aanpassen',
        emptyHint: 'Weet je het nog niet? Laat het leeg en onthul het later.',
        training: (n) => `Ik plan er ${n} trainingslevels voor in.`,
        add: 'Zet in de questlog'
      },
      cat: {
        mystery: (subject) => `${subject} gaf een geheime quest: huiswerk, maar er staat niet bij wát. Onthul hem voor je het vergeet!`,
        late: (n) => (n === 1 ? 'Er is één quest over zijn dag heen geglipt. Naar een nieuwe dag slepen?' : `Er zijn ${n} quests over hun dag heen geglipt. Naar een nieuwe dag slepen?`),
        trialSoon: (subject, kind, when) => `${kind} ${subject.toLowerCase()} ${when}. Vandaag even trainen?`,
        left: (n) => (n === 1 ? 'Nog één quest voor vandaag.' : `Nog ${n} quests voor vandaag.`),
        clear: 'Alle quests van vandaag gehaald. Ga lekker Minecraften!',
        empty: 'Je questlog is nog leeg. Tik op “Nieuwe quest” als je huiswerk krijgt.',
        yay: (n) => (n === 0 ? 'Quest gehaald! Dat was de laatste voor vandaag.' : `Quest gehaald! Nog ${n} voor vandaag.`),
        decoded: 'Geheime quest onthuld! Nu kan hij zich niet meer verstoppen.',
        dress: 'Koninklijk. Level up!',
        added: 'Quest aangenomen!',
        synced: (n) => (n === 1 ? 'Magister bracht één nieuwe quest.' : `Magister bracht ${n} nieuwe quests.`)
      }
    }
  },

  // The notebook is the plain planner: its words are i18n.ts's own.
  notebook: { en: {}, nl: {} }
}
