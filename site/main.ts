/**
 * The product page's script. The buddies here are the app's own: the same pixel art and
 * the same moods (src/renderer/src/companions), bundled by site/build.ts. So are the themes:
 * picking one dresses the page in it (themes.css) and the buddies in its headwear.
 */
import { ACCESSORIES, ALL_EYE_COLORS, ALL_SPECIES, EYE_COLOR_NAMES, SPECIES, coatFor, eyeSwatch, swatchOf } from '../src/renderer/src/companions'
import { momentOf } from '../src/renderer/src/companions/pixel/animate'
import { CANVAS_HEIGHT, CANVAS_WIDTH, momentKey, paint, type Look } from '../src/renderer/src/companions/pixel/draw'
import type { Headwear } from '../src/renderer/src/companions/pixel/face'
import { rgba, type Grid, type Palette } from '../src/renderer/src/companions/pixel/sprite'
import type { AccessoryId, CompanionLook, Mood, Species } from '../src/renderer/src/companions/types'
import { wordsFor } from '../src/renderer/src/i18n'
import { ALL_THEMES, THEMES, themeFor, type ThemeId } from '../src/renderer/src/themes'

type Lang = 'nl' | 'en'
const lang = (): Lang => (document.documentElement.dataset.lang === 'en' ? 'en' : 'nl')

const TEXT = {
  nl: {
    hero: [
      'Nog 2 taken voor vandaag!',
      'Toets over 3 dagen. Oefenronde?',
      'Er staat alleen "zie Teams"... Zoek uit wat het is!',
      'Alles af! Ik ben trots op je.',
      'Wiskunde morgen, niet vergeten!',
      'Zullen we je rooster invullen?'
    ],
    poke: ['Hihi, dat kietelt!', 'Hoi!', 'Nog een keer!', 'Ik help je onthouden.'],
    hello: (name: string): string => (name ? `Hoi! Ik ben ${name}.` : 'Hoi! Hoe heet ik?'),
    moods: { happy: 'Blij', curious: 'Nieuwsgierig', sleep: 'Slapen', proud: 'Trots' } as Record<string, string>,
    moodLines: { happy: 'Joepie!', curious: 'Hm? Geheim huiswerk!', sleep: 'Zzz...', proud: 'Alles af voor vandaag!' } as Record<string, string>,
    nothing: 'Niets',
    name: 'Naam?',
    version: (v: string): string => `versie ${v}`
  },
  en: {
    hero: [
      'Two more tasks for today!',
      'Test in 3 days. Training round?',
      'It just says "see Teams"... Find out what it is!',
      'All done! I am proud of you.',
      "Maths tomorrow, don't forget!",
      'Shall we fill in your timetable?'
    ],
    poke: ['Hehe, that tickles!', 'Hi!', 'Again!', "I'll help you remember."],
    hello: (name: string): string => (name ? `Hi! I'm ${name}.` : "Hi! What's my name?"),
    moods: { happy: 'Happy', curious: 'Curious', sleep: 'Sleep', proud: 'Proud' } as Record<string, string>,
    moodLines: { happy: 'Yay!', curious: 'Hm? Mystery homework!', sleep: 'Zzz...', proud: 'All done for today!' } as Record<string, string>,
    nothing: 'Nothing',
    name: 'Name?',
    version: (v: string): string => `version ${v}`
  }
}
const text = (): (typeof TEXT)['nl'] => TEXT[lang()]

/** The theme the page is dressed in; the head script already put it on <html>. */
let theme: ThemeId = themeFor(document.documentElement.dataset.theme)

/** The hero's last words, per theme: "Your homework, but make it …". */
const HERO_WORD: Record<ThemeId, Record<Lang, string>> = {
  magic: { nl: 'magisch', en: 'magic' },
  garden: { nl: 'in je moestuin', en: 'a garden' },
  ocean: { nl: 'onder water', en: 'an ocean dive' },
  space: { nl: 'in de ruimte', en: 'a space mission' },
  quest: { nl: 'als game', en: 'a game' },
  notebook: { nl: 'netjes', en: 'neat' }
}

const still = matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * One living buddy on a canvas, drawn by the app's own code. Its hat is the page's theme's,
 * unless it was given one of its own (the buddies on the theme buttons).
 */
class Buddy {
  private source: CompanionLook
  private look: Look
  private mood: Mood = 'idle'
  private since = 0
  private shown = ''
  private settle = 0

  constructor(
    readonly canvas: HTMLCanvasElement,
    look: CompanionLook,
    private readonly seed: number,
    private readonly wears?: Headwear
  ) {
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    this.source = look
    this.look = toLook(look, this.headwear())
  }

  private headwear(): Headwear {
    return this.wears ?? THEMES[theme].headwear
  }

  /** Whole device pixels per art pixel, so every pixel is the same size. */
  scale(scale: number): void {
    const unit = Math.max(1, Math.round(scale * devicePixelRatio)) / devicePixelRatio
    this.canvas.style.width = `${CANVAS_WIDTH * unit}px`
    this.canvas.style.height = `${CANVAS_HEIGHT * unit}px`
  }

  dress(look: CompanionLook = this.source): void {
    this.source = look
    this.look = toLook(look, this.headwear())
  }

  /** A mood; happy and talk are reactions that settle back to idle. */
  feel(mood: Mood): void {
    this.mood = mood
    this.since = performance.now()
    clearTimeout(this.settle)
    if (mood === 'happy' || mood === 'talk') this.settle = window.setTimeout(() => this.feel('idle'), mood === 'happy' ? 2200 : 2600)
  }

  draw(now: number): void {
    const moment = still ? momentOf(this.mood, 0, 0, this.seed) : momentOf(this.mood, now, now - this.since, this.seed)
    const key = momentKey(moment, this.look)
    if (key === this.shown) return
    paint(this.canvas.getContext('2d')!, this.look, moment)
    this.shown = key
  }
}

function toLook(look: CompanionLook, headwear: Headwear): Look {
  return { animal: SPECIES[look.species].art, coat: coatFor(look.species, look.coat), eyes: look.eyes, accessory: look.accessory, headwear }
}

const buddies: Buddy[] = []
function loop(now: number): void {
  for (const buddy of buddies) buddy.draw(now)
  requestAnimationFrame(loop)
}

/** Places a speech bubble over a canvas inside `stage`. */
function say(bubble: HTMLElement, over: HTMLElement, line: string): void {
  const stage = bubble.parentElement!.getBoundingClientRect()
  const box = over.getBoundingClientRect()
  const centre = box.left + box.width / 2 - stage.left
  const half = Math.min(130, stage.width / 2)
  bubble.style.left = `${Math.min(Math.max(centre, half), stage.width - half)}px`
  bubble.textContent = line
}

// The hero: all five on the books, taking turns to say something.

const HERO: CompanionLook[] = [
  { species: 'dog', coat: 'golden', accessory: 'collar', eyes: 'amber' },
  { species: 'parrot', coat: 'scarlet', accessory: 'none', eyes: 'blue' },
  { species: 'cat', coat: 'ginger', accessory: 'hat', eyes: 'green' },
  { species: 'whale', coat: 'ocean', accessory: 'hat', eyes: 'violet' },
  { species: 'robot', coat: 'mint', accessory: 'collar', eyes: 'hazel' }
]

function hero(): void {
  const row = document.getElementById('hero-buddies')!
  const bubble = document.getElementById('hero-bubble')!
  const stage = document.getElementById('hero-stage')!
  const cast = HERO.map((look, i) => {
    const canvas = document.createElement('canvas')
    canvas.setAttribute('role', 'img')
    canvas.setAttribute('aria-label', SPECIES[look.species].name[lang()])
    row.append(canvas)
    const buddy = new Buddy(canvas, look, i)
    buddies.push(buddy)
    return buddy
  })
  const fit = (): void => {
    // Each buddy takes about 30 art pixels of the row (they overlap a little).
    const scale = Math.max(2, Math.min(4, Math.floor(stage.clientWidth / 150)))
    cast.forEach((buddy) => buddy.scale(scale))
  }
  fit()
  addEventListener('resize', fit)

  let line = 0
  let last = 2
  const speak = (who: number, words: string, mood: Mood = 'talk'): void => {
    cast[who].feel(mood)
    say(bubble, cast[who].canvas, words)
    last = who
  }
  speak(2, text().hero[0])
  setInterval(() => {
    let who = Math.floor(Math.random() * cast.length)
    if (who === last) who = (who + 1) % cast.length
    line = (line + 1) % text().hero.length
    speak(who, text().hero[line], Math.random() < 0.4 ? 'happy' : 'talk')
  }, 4200)
  cast.forEach((buddy, i) =>
    buddy.canvas.addEventListener('click', () => speak(i, text().poke[Math.floor(Math.random() * text().poke.length)], 'happy'))
  )

  // A few pixel sparkles around them.
  for (let i = 0; i < 9; i++) {
    const sparkle = document.createElement('i')
    sparkle.className = 'sparkle'
    sparkle.style.left = `${5 + Math.random() * 90}%`
    sparkle.style.top = `${Math.random() * 55}%`
    sparkle.style.animationDelay = `${(Math.random() * 2.8).toFixed(2)}s`
    stage.append(sparkle)
  }
}

// Pick your buddy.

const choice: CompanionLook & { name: string } = { species: 'cat', coat: 'ginger', accessory: 'hat', eyes: 'green', name: '' }
let big: Buddy
const minis = new Map<Species, Buddy>()

function picker(): void {
  big = new Buddy(document.getElementById('pick-big') as HTMLCanvasElement, choice, 7)
  buddies.push(big)
  const fit = (): void => big.scale(innerWidth < 620 ? 5 : 6)
  fit()
  addEventListener('resize', fit)
  big.canvas.addEventListener('click', () => {
    big.feel('happy')
    say(bubble(), big.canvas, text().poke[Math.floor(Math.random() * text().poke.length)])
  })

  const species = document.getElementById('pick-species')!
  ALL_SPECIES.forEach((id, i) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.species = id
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    const mini = new Buddy(canvas, { ...choice, species: id }, i + 2)
    mini.scale(2)
    minis.set(id, mini)
    buddies.push(mini)
    const name = document.createElement('span')
    button.append(canvas, name)
    button.addEventListener('click', () => {
      choice.species = id
      choice.coat = coatFor(id, choice.coat)
      update(true)
    })
    species.append(button)
  })

  const input = document.getElementById('pick-name') as HTMLInputElement
  input.addEventListener('input', () => {
    choice.name = input.value.trim()
    say(bubble(), big.canvas, text().hello(choice.name))
  })
  update(false)
}

const bubble = (): HTMLElement => document.getElementById('pick-bubble')!

/** Redraws the picker's buttons for the chosen animal and language. */
function update(cheer: boolean): void {
  const t = text()
  const definition = SPECIES[choice.species]

  for (const button of document.querySelectorAll<HTMLButtonElement>('#pick-species button')) {
    const id = button.dataset.species as Species
    button.setAttribute('aria-pressed', String(id === choice.species))
    button.querySelector('span')!.textContent = SPECIES[id].name[lang()]
    minis.get(id)!.dress({ ...choice, species: id, coat: coatFor(id, choice.coat) })
  }
  // The buddies on the theme buttons are the one being picked here.
  for (const buddy of themeBuddies.values()) buddy.dress({ ...choice })

  buttons(
    'pick-coat',
    definition.coats.map((coat) => ({ id: coat.id, label: coat.name[lang()], swatch: swatchOf(choice.species, coat.id) })),
    choice.coat,
    (id) => (choice.coat = id)
  )
  buttons(
    'pick-eyes',
    ALL_EYE_COLORS.map((id) => ({ id, label: EYE_COLOR_NAMES[id][lang()], swatch: eyeSwatch(id) })),
    choice.eyes,
    (id) => (choice.eyes = id)
  )
  buttons(
    'pick-gear',
    ACCESSORIES.map((id) => ({ id, label: id === 'hat' ? wordsFor(lang(), theme).hat : id === 'collar' ? definition.neckwear[lang()] : t.nothing })),
    choice.accessory,
    (id) => (choice.accessory = id as AccessoryId)
  )
  buttons(
    'pick-mood',
    Object.keys(t.moods).map((id) => ({ id, label: t.moods[id] })),
    '',
    (id) => {
      big.feel(id as Mood)
      say(bubble(), big.canvas, t.moodLines[id])
    },
    false
  )

  const input = document.getElementById('pick-name') as HTMLInputElement
  input.placeholder = t.name
  big.canvas.setAttribute('aria-label', definition.name[lang()])
  big.dress(choice)
  if (cheer) big.feel('happy')
  say(bubble(), big.canvas, t.hello(choice.name))
}

function buttons(
  id: string,
  items: Array<{ id: string; label: string; swatch?: string }>,
  chosen: string,
  pick: (id: string) => void,
  redraw = true
): void {
  const box = document.getElementById(id)!
  box.replaceChildren(
    ...items.map((item) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.setAttribute('aria-pressed', String(item.id === chosen))
      if (item.swatch) {
        button.style.background = item.swatch
        button.setAttribute('aria-label', item.label)
        button.title = item.label
      } else {
        button.textContent = item.label
      }
      button.addEventListener('click', () => {
        pick(item.id)
        if (redraw) update(true)
      })
      return button
    })
  )
}

// Pick your theme: a button per theme, each with a buddy in that theme's headwear.

const themeBuddies = new Map<ThemeId, Buddy>()

function themePicker(): void {
  const box = document.getElementById('theme-picker')!
  ALL_THEMES.forEach((id, i) => {
    const { colors, fonts, headwear } = THEMES[id]
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'theme'
    button.dataset.theme = id

    const preview = document.createElement('span')
    preview.className = 'theme-preview'
    preview.style.background = colors.desk
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    const buddy = new Buddy(canvas, { ...choice }, i + 11, headwear)
    buddy.scale(2)
    buddies.push(buddy)
    themeBuddies.set(id, buddy)
    const page = document.createElement('span')
    page.className = 'theme-page'
    page.style.background = colors.paper
    const line = document.createElement('i')
    line.style.background = colors.ink
    const soft = document.createElement('i')
    soft.style.background = colors['ink-soft']
    page.append(line, soft)
    const dot = document.createElement('b')
    dot.style.background = colors.button
    preview.append(canvas, page, dot)

    const name = document.createElement('span')
    name.className = 'theme-name'
    // The spellbook's name in the page's own heading face; the others in their own.
    name.style.fontFamily = id === 'magic' ? 'var(--display)' : fonts.display
    name.style.fontWeight = String(id === 'magic' ? 600 : fonts.displayWeight)

    button.append(preview, name)
    button.addEventListener('click', () => {
      setTheme(id)
      buddy.feel('happy')
    })
    box.append(button)
  })
}

/** Dresses the page in a theme: colours, the hero's words, the screenshot and every buddy's hat. */
function setTheme(next: ThemeId): void {
  theme = next
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem('learnling-theme', next)
  } catch {
    // Remembering is a nicety.
  }
  for (const buddy of buddies) buddy.dress()
  showTheme()
  update(false)
}

/** Everything on the page that says which theme it is, in the current language. */
function showTheme(): void {
  for (const em of document.querySelectorAll<HTMLElement>('[data-word]')) em.textContent = HERO_WORD[theme][em.dataset.word as Lang]
  for (const l of ['nl', 'en'] as Lang[]) {
    const shot = document.getElementById(`shot-${l}`) as HTMLImageElement
    shot.src = `img/app-${theme}-${l}.png`
    shot.alt =
      l === 'nl'
        ? `Learnling in het thema ${THEMES[theme].name.nl}, met twee weken huiswerk`
        : `Learnling in the ${THEMES[theme].name.en} theme, with two weeks of homework`
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>('#theme-picker .theme')) {
    const id = button.dataset.theme as ThemeId
    button.setAttribute('aria-pressed', String(id === theme))
    button.querySelector('.theme-name')!.textContent = THEMES[id].name[lang()]
  }
}

// Little pixel icons for the feature cards, drawn like the buddies.

const ICON_COLOURS: Palette = {
  o: '#2b2118',
  r: '#7a3a2e',
  R: '#4f231c',
  y: '#e3b54a',
  w: '#fbf3df',
  p: '#f6ecd6',
  P: '#d9c39a',
  b: '#3a95d6',
  g: '#4fb34c',
  m: '#5b3f9a'
}

const ICONS: Record<string, Grid> = {
  book: [
    '.oooooooooo.',
    'oRrrrrrrrrPo',
    'oRrrrrrrrrPo',
    'oRrrryyrrrPo',
    'oRrryyyyrrPo',
    'oRrrryyrrrPo',
    'oRrrrrrrrrPo',
    'oRrrrrrrrrPo',
    'oRrrrrrrrrPo',
    'oRooooooooPo',
    'oRPPPPPPPPPo',
    '.oooooooooo.'
  ],
  letter: [
    '............',
    '............',
    'oooooooooooo',
    'oowwwwwwwwoo',
    'owowwwwwwowo',
    'owwowwwwowwo',
    'owwwooooywwo',
    'owwwwwwwyywo',
    'owwwwwwwwwwo',
    'oooooooooooo',
    '............',
    '............'
  ],
  scroll: [
    '.oooooooooo.',
    'oPpppppppppo',
    '.oppppmmpppo',
    '.opppmppmppo',
    '.oppppppmppo',
    '.opppppmpppo',
    '.oppppmppppo',
    '.oppppppppo.',
    '.oppppmpppo.',
    'oppppppppppo',
    'oPPPPPPPPPPo',
    '.oooooooooo.'
  ],
  dumbbell: [
    '............',
    '............',
    '.oo......oo.',
    'obbo....obbo',
    'obboooooobbo',
    'obbowwwwobbo',
    'obboooooobbo',
    'obbo....obbo',
    '.oo......oo.',
    '............',
    '............',
    '............'
  ],
  bell: [
    '.....oo.....',
    '....oyyo....',
    '...oyyyyo...',
    '..oyyywyyo..',
    '..oyyywyyo..',
    '..oyyyyyyo..',
    '.oyyyyyyyyo.',
    'oyyyyyyyyyyo',
    'oooooooooooo',
    '....oyyo....',
    '.....oo.....',
    '............'
  ],
  tick: [
    '..........g.',
    'oooooooo.gg.',
    'owwwwwwoggo.',
    'owwwwwwggwo.',
    'owgwwwggwwo.',
    'owggwggwwwo.',
    'owwgggwwwwo.',
    'owwwgwwwwwo.',
    'owwwwwwwwwo.',
    'ooooooooooo.',
    '............',
    '............'
  ]
}

function icons(): void {
  for (const canvas of document.querySelectorAll<HTMLCanvasElement>('canvas[data-icon]')) {
    const grid = ICONS[canvas.dataset.icon!]
    if (!grid) continue
    canvas.width = grid[0].length
    canvas.height = grid.length
    canvas.style.width = `${grid[0].length * 4}px`
    canvas.style.height = `${grid.length * 4}px`
    canvas.getContext('2d')!.putImageData(new ImageData(rgba(grid, ICON_COLOURS), grid[0].length, grid.length), 0, 0)
  }
}

// Download: straight to the newest installer on GitHub, when GitHub tells us which it is.

let version = ''

async function download(): Promise<void> {
  if (!/Windows/i.test(navigator.userAgent)) document.getElementById('elsewhere')!.hidden = false
  try {
    const release = await (await fetch('https://api.github.com/repos/bhalial/learnling/releases/latest')).json()
    const installer = (release.assets ?? []).find((asset: { name: string }) => asset.name.endsWith('.exe'))
    if (installer) (document.getElementById('download') as HTMLAnchorElement).href = installer.browser_download_url
    version = String(release.tag_name ?? '').replace(/^v/, '')
    showVersion()
  } catch {
    // The link still goes to the releases page.
  }
}

const showVersion = (): void => {
  document.getElementById('version')!.textContent = version ? text().version(version) : ''
}

// Language.

function setLang(next: Lang): void {
  document.documentElement.dataset.lang = next
  document.documentElement.lang = next
  try {
    localStorage.setItem('learnling-lang', next)
  } catch {
    // Remembering is a nicety.
  }
  document.title = next === 'nl' ? 'Learnling · je huiswerk, maar dan leuk' : 'Learnling · your homework, but fun'
  update(false)
  showTheme()
  showVersion()
  say(document.getElementById('hero-bubble')!, document.querySelectorAll<HTMLCanvasElement>('#hero-buddies canvas')[2], text().hero[0])
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-set-lang]')) {
  button.addEventListener('click', () => setLang(button.dataset.setLang as Lang))
}

hero()
picker()
themePicker()
icons()
void download()
setLang(lang())
requestAnimationFrame(loop)
