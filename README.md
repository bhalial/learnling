# Learnling

A two-week homework planner with a study buddy, for secondary-school students in the
Netherlands. A Windows desktop app (Electron + React + Tailwind 4), touchscreen-friendly, in
English and Dutch.

**Website and download: <https://bhalial.github.io/learnling/>**

The book always shows two weeks: this week and next on school days, the two coming
weeks from Saturday on. Homework is a *spell* to tick off; homework without a description
is a *mystery scroll* to decipher; tests and quizzes get training
rounds planned before them. A companion does the talking: a cat, dog, parrot, whale or robot,
renamable and dressable.

The app was called **Spellbook** until 3 October 2026. That name now belongs to the storybook
theme ("My Spellbook" at the top of the page), so later themes can bring their own book. In the
code the old name lives on in internal names: `SPELLBOOK_*` switches, `window.spellbook`,
`SpellbookData` and this folder.

## Running

```bash
npm install
npm run dev        # development, with hot reload
npm run build      # production bundles in out/
npm run pack       # unpacked Windows app in dist/win-unpacked/
npm run dist       # the installer: dist/Learnling-Setup-<version>.exe
npm run icon       # redraw resources/icon.ico + icon.png from icon.svg
npm run site       # the product page, in site/out
npm test           # date and planning rules
npm run typecheck
```

The book lives in `%APPDATA%/learnling/learnling.json` (previous save next to it as
`.bak`). F12 opens the developer tools.

### Development switches

| Variable | Effect |
| --- | --- |
| `SPELLBOOK_DEMO=1` | A filled sample book, in its own data folder (`%TEMP%/spellbook-demo-1`). |
| `SPELLBOOK_DEMO=empty` | A fresh empty book, in its own data folder. |
| `SPELLBOOK_TODAY=2026-10-03` | Pretend it is that day, e.g. a Saturday to see the page turn. |
| `SPELLBOOK_SHOT=out.png` | Save a screenshot of the window and quit (`SPELLBOOK_SHOT_DELAY` ms, default 1500). |
| `SPELLBOOK_SHOT_JS=…` | Run this in the page before the screenshot, e.g. to open a dialog. |
| `SPELLBOOK_LAB=1` | Open the companion lab: every animal in every mood. |

Demo runs never touch the real book.

## Installing

`npm run dist` builds `dist/Learnling-Setup-<version>.exe`, one file to run. It is a
one-click, per-user install (no admin rights): it installs to `%LOCALAPPDATA%/Programs/learnling`,
puts Learnling on the desktop and in the Start menu, and opens the app. Uninstalling (Windows
Settings → Apps) keeps the book in `%APPDATA%/learnling`. The installer for a released version
is also on the [releases page](https://github.com/bhalial/learnling/releases).

The installer is not code-signed, so the first time Windows SmartScreen says it protected the PC:
*More info* → *Run anyway*. After installing, turn on *Start with Windows* in Settings, or the
afternoon reminder only comes on days the app was opened by hand.

**Coming from Spellbook** (0.1.0): Learnling is a new app to Windows, so the installer leaves
Spellbook in place. On its first start Learnling copies the old `%APPDATA%/spellbook` folder
over (the book, and the Magister login with it; caches stay behind and the old folder stays as
a backup; `src/main/migrate.ts`). Then remove Spellbook by hand in Windows Settings → Apps, or
both apps send the afternoon reminder.

## Releases and updates

From 0.3.1 on, an installed Learnling updates itself (`src/main/updater.ts`, electron-updater):
it checks the GitHub releases of [bhalial/learnling](https://github.com/bhalial/learnling) at
start and every four hours, downloads a newer version quietly, and installs it when the window
is put away in the tray (it restarts into the tray) or else when the app quits. What it did is
in `%APPDATA%/learnling/updates.log`. Dev, demo and screenshot runs never update.

To release a version:

```bash
npm version patch
git push --follow-tags
```

`npm version` bumps `version` in `package.json`, commits and tags it `v<version>`; pushing the
tag starts `.github/workflows/release.yml`, which tests, builds the installer on Windows and
publishes it with `latest.yml` as a GitHub release. The tag must match the version, because
electron-builder publishes to `v<version>`.

Building notes: electron-builder's own exe editing is off (it needs symlink rights Windows only
grants in Developer Mode); `scripts/brand.js` runs as the `afterPack` hook and puts the icon and
version into `Learnling.exe` with rcedit before the installer is built. The icon is drawn in
`resources/icon.svg` (the book with the test seal); `npm run icon` renders the .ico and .png.

## Website

The product page is one static page in `site/`: `index.html` (Dutch and English side by side,
picked with a toggle), `styles.css`, and `main.ts`, which brings the app's own pixel buddies to
life on the page and points the download button at the newest release. `npm run site` bundles it
into `site/out` with its fonts (no font CDN, no trackers) and draws `og.png` for shared links.
Every push to `main` that touches it is published on GitHub Pages by `.github/workflows/site.yml`.

## Magister

Settings → *Connect Magister* opens the real Magister login (student or parent account).
After that the app reads Magister at start, every half hour and when the window comes back,
always in a hidden Magister page that keeps its own login (`persist:magister` session). It only
reads; nothing is ever written back. When the login has expired the top bar asks to log in
again. What the data looks like, and why the sync works this way: [docs/magister.md](docs/magister.md).

Merge rules (`src/renderer/src/lib/magister.ts`, tested): subjects match on Magister's id;
lessons in the synced range come from Magister (empty school day = "No lessons"); homework lands
on the day it was set; tests get training rounds; changed text marks a task *new* again;
removed work is flagged, never deleted; work due before today is never imported.

## Reminder and tray

On school days at the reminder time (default 16:00) the app reads Magister and the cat sends a
Windows notification if something is waiting. *Send a test* under the reminder sends one right
away (the real message, or a sample when nothing is waiting); the timing rules are in
`src/renderer/src/lib/reminder.ts`. With *Keep running next to the clock* on, closing
the window hides it to the tray so reminders keep coming; *Start with Windows* only takes effect
in the installed app.

## Companions

The companion is a pixel-art cat, dog, parrot, whale or robot, drawn in code as text grids
and animated on a plain canvas: `src/renderer/src/companions/`.

- `types.ts` is the contract: species, mood, gear and the look (coat, eye colour).
  `index.ts` names the animals, their coats and neckwear, and brings older books along
  (the shark became the whale; eye colours came later).
- `pixel/` is the art: `sprite.ts` (grids, mirroring, layers), `face.ts` (the shared eyes,
  blush and hat), `animate.ts` (what every mood looks like, for every animal), one file per
  animal, and `draw.ts`, which `components/Companion.tsx` uses to paint it.
- Moods: `idle`, `happy`, `talk`, `curious`, `sleep`, `proud`. Which one shows comes from
  `mood.ts` (night → sleep, a mystery scroll → curious, today done → proud) and from
  reactions (ticking off → happy, moving → talk).
- **Style guide: [docs/companions.md](docs/companions.md).** Read it before changing or
  adding an animal; faces especially.
- `npx vite-node art/pixel/preview.ts` writes `art/pixel/preview.html`, a page with every
  animal, mood, coat and colour, animated by the app's own code.
- `SPELLBOOK_LAB=1` (or `#lab`) opens every animal in every mood side by side;
  `SPELLBOOK_LAB=whale` shows one animal large.
- Shelved earlier attempts: `art/threejs/` (3D in three.js) and `art/blender/` (plush renders).

## How the data is shaped

Every task has two halves (`src/renderer/src/types.ts`):

- `given` — what was set: subject, kind, text, due day. Typed in by hand or brought in by a
  Magister sync, which may overwrite this half.
- `own` — what the student does with it: the day it is planned for, when it was ticked off,
  the words it was deciphered with. A sync never touches this half.

That split is what lets Magister sync without ever undoing the student's own work.
Planning rules (training rounds, the attention shelf, where a task shows) live in
`src/renderer/src/lib/tasks.ts` and are covered by tests.

## Toolchain note

The development machine runs Node 20.11, so the toolchain is pinned to versions that install on
it: Electron 39, electron-vite 3, Vite 6, electron-builder 25 (26 pulls in an ESM-only hash
library that Node 20.11 cannot require). After moving to Node 22.12+ these can go to
Electron 44, electron-vite 5, Vite 7 and electron-builder 26 in one step.
