# Study buddies: the style guide

Every companion in Learnling looks like it came out of the same box of pixel stickers: a
cat, a dog, a parrot, a whale and a robot. This page is the rulebook for them and for every
one added later. Where a rule can live in code, it does: the face and the hat are shared
(`src/renderer/src/companions/pixel/face.ts`), the moods are shared (`animate.ts`). An
animal file only decides its shape, its colours and what it wiggles.

## The look in one sentence

A chunky, round, chibi sticker in pixel art, a big head on a small body, soft outlines, big
dark eyes that shine, that always looks at her and never looks scary.

The direction was chosen by the person it is for (October 2026): pixel art "but with better
cat eyes". The 3D figures and the Blender plush before it are shelved in `art/threejs/` and
`art/blender/`.

## Frame and layers

- **One frame for everyone**: 36 × 46 pixels (`species.ts`), the top 6 rows kept free for
  the hat. Heads start at row 7 (`TOP + 1`); a hop lifts the whole frame (4 rows of margin
  above it in the canvas).
- **Grids are text** (`sprite.ts`): one character per pixel, `.` is see-through, a palette
  says what each character is. Symmetric shapes are drawn as their left half, 18 wide, and
  mirrored. Details that break the symmetry are separate layers.
- **Layers, back to front**: whatever sits behind (tail, tuft, fin, antenna), body, head,
  the shared face, nose or beak or mouth, then gear. A pose only swaps or moves layers.
- **Coats are palettes**: the same grid in other colours. Coat ids match the coats in
  `companions/index.ts`; the test in `companions.test.ts` fails if a pose uses a character
  a coat has no colour for.

## Colours

- Warm, friendly, slightly muted, readable on the dark desk.
- **Outlines are a deep shade of the main colour, never black** (`o`). Black outlines
  made the first pixel cat look harsh.
- Every animal uses the same letters for the same jobs: `o` outline, `b` main colour,
  `d` shade, `l` light, `w`/`v` the pale part (chest, belly, snout) and its shade. The
  swatch for a coat is its `b`.
- Shared colours (`SHARED` in `face.ts`): `p` blush, `k` eye dark, `h` shine, `m`/`t`
  mouth and tongue, `q`/`U`/`u`/`Y`/`y` the hat, `r`/`R` red gear. Don't reuse these
  letters for anything else.

## Faces (the part that goes creepy first)

All of this is `face()` in `face.ts`; never draw eyes in an animal file.

- **Big dark eyes with two shines**, a big one upper left and a small one lower right, the
  same on both eyes. The dark part reads as one big pupil.
- **The eye colour is a glow along the bottom** of the eye (deep, rich, light), chosen in
  Settings, the same for every animal. It was her pick out of three.
- **Never a coloured iris around a small pupil, never a slit pupil**: both stare. That was
  the "too creepy" version. No eye whites, no lashes, no brows.
- **Low on the face**: the bottom of the eyes on row 21 of the head, level with the nose,
  14 pixels apart. The lower the eyes, the younger and sweeter the face.
- **Closed eyes are arcs**: a relaxed curve for blinking and sleep, `^ ^` for happy.
- **Looking aside moves the whole eye** one pixel; the shines go with it.
- **Blush on every animal**: three pink pixels under the outer corner of each eye.
- **Mouths are small**: a little smile, open with a tongue when happy or talking, a small
  "o" when curious. Teeth only if the animal is not cute without them (so far: none).

## What read wrong (and was fixed)

- A coloured iris with a small pupil: creepy. Now: dark eyes, colour glow.
- White face patches around a parrot's eyes: glasses. Now: none.
- A single feather on a round red head: an apple with a stem. Now: three feathers.
- A shark's tail next to its side fin: the handle of a mug. And a round shark with a pale
  belly is a whale, so it became one.

## Moods

Every animal plays all six; the timing is shared (`animate.ts`) so they feel like one
family. Each animal decides what "tail" means: the cat and dog sway their tails, the parrot
its tail feathers, the whale paddles its flippers, the robot swings its arms and wobbles
its antenna.

| Mood | When | What it does |
| --- | --- | --- |
| `idle` | nothing special | breathes, blinks, sways, now and then looks left or right |
| `happy` | she ticks off, deciphers, dresses it up, new spells arrive | `^ ^` eyes, mouth open, a hop, sparkles |
| `talk` | the note says something new, or she moves a spell | mouth opens and closes, small nods |
| `curious` | a mystery scroll is waiting | looks towards the book, small "o" mouth, a `?` |
| `sleep` | 21:00–07:00 | eyes closed, slow breathing, floating z's |
| `proud` | today's page is done | chin up, `^ ^` eyes, twinkling sparkles |

With reduced motion each mood is a single still picture.

## Gear

- **Head slot**: the wizard hat, `hat(crown)` with the row the head's top is on. Whatever
  makes the animal itself up there (a whale's tail, the robot's antenna) stands to the
  right of the hat so it stays visible.
- **Neck slot**: one item per animal, named in its definition (`neckwear`): bell collar,
  collar with tag, bow tie, scarf. Pick a colour that shows on every coat (the parrot's bow
  tie is purple because red vanished on the scarlet macaw).

## Adding an animal

1. Draw `companions/pixel/<animal>.ts` exporting a `PixelAnimal`: its layers, four coats
   and a `frame(pose, accessory)` that uses `face()` and `hat()`.
2. Add the id to `Species` in `types.ts`, and the animal to `SPECIES` (names, coats,
   neckwear) and `ALL_SPECIES` in `companions/index.ts`.
3. `npm test`: the companion tests check every pose, coat, eye colour and gear for missing
   colours.
4. Look at it:
   - `npx vite-node art/pixel/preview.ts` writes `art/pixel/preview.html` (every animal,
     mood, coat, eye colour and gear, animated by the app's own code) and contact sheets
     in `art/pixel/renders/`, including `family.png`: same size, same family?
   - `SPELLBOOK_LAB=1 npm run dev` shows every animal in every mood; `SPELLBOOK_LAB=<animal>`
     one animal large.
   - In the app at its real size: the side panel (6× scale) and the picker in Settings (3×).
5. Ask the person it is for. If it looks even slightly off to her, it is off.
