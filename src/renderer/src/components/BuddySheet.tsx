import type { ReactNode } from 'react'
import { ACCESSORIES, ALL_EYE_COLORS, EYE_COLOR_NAMES, SPECIES, eyeSwatch, eyesFor, swatchOf } from '../companions'
import { useBook, useWords } from '../store'
import { THEMES } from '../themes'
import { Companion } from './Companion'
import { Modal, SheetHeader } from './Modal'
import { SpeciesPicker } from './SpeciesPicker'
import { Platform } from './ThemeParts'

/**
 * The companion's own screen: which animal it is, its colour, eyes, what it wears and its
 * name, with the companion itself trying everything on. Dressing up is play, so it lives
 * here and not next to the homework; tap the companion (or Settings) to get here.
 */
export function BuddySheet() {
  const open = useBook((s) => s.buddyOpen)
  const openBuddy = useBook((s) => s.openBuddy)
  const t = useWords()

  return (
    <Modal open={open} onClose={() => openBuddy(false)} label={t.setup.companion} width={780}>
      <BuddyForm />
    </Modal>
  )
}

const chip = 'flex h-11 items-center rounded-sm border-[1.5px] px-3.5 text-[16px] whitespace-nowrap'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
      <span className="font-fell text-[18px]">{label}</span>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </div>
  )
}

function BuddyForm() {
  const data = useBook((s) => s.data)
  const reaction = useBook((s) => s.reaction)
  const { setCompanion, openBuddy } = useBook.getState()
  const t = useWords()
  const { companion } = data
  const species = SPECIES[companion.species]
  const headwear = THEMES[data.theme].headwear
  const eyes = eyesFor(companion.eyes)

  return (
    <div className="flex flex-col gap-6 px-8 pb-8">
      <SheetHeader closeLabel={t.close} onClose={() => openBuddy(false)}>
        <h2 className="m-0 font-fell text-[30px] font-normal">{t.setup.companion}</h2>
      </SheetHeader>

      <div>
        <p className="m-0 mb-3 text-[15px] italic text-ink-soft">{t.setup.companionHint}</p>
        <SpeciesPicker look={companion} lang={data.lang} headwear={headwear} onPick={(id) => setCompanion({ species: id })} />
      </div>

      <div className="grid grid-cols-[210px_1fr] items-center gap-8">
        {/* The companion at home: on the theme's ground and platform, cheering at every change. */}
        <div className="desk flex flex-col items-center rounded-md px-3 pb-5 pt-4" aria-hidden="true">
          <div className="z-10 -mb-2">
            <Companion look={companion} mood={reaction?.kind === 'dress' ? 'happy' : 'idle'} pulse={reaction?.at ?? 0} scale={4} headwear={headwear} />
          </div>
          <div className="[zoom:0.7]">
            <Platform />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Row label={t.setup.coat}>
            {species.coats.map((coat) => (
              <button
                key={coat.id}
                type="button"
                onClick={() => setCompanion({ coat: coat.id })}
                aria-label={coat.name[data.lang]}
                title={coat.name[data.lang]}
                aria-pressed={companion.coat === coat.id}
                className={`blot-lg size-11 shadow-[inset_-4px_-5px_0_rgb(0_0_0/0.18)] ${
                  companion.coat === coat.id ? 'outline-2 outline-offset-2 outline-ink outline-solid' : ''
                }`}
                style={{ background: swatchOf(companion.species, coat.id) }}
              />
            ))}
          </Row>
          <Row label={t.setup.eyeColor}>
            {ALL_EYE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setCompanion({ eyes: color })}
                aria-label={EYE_COLOR_NAMES[color][data.lang]}
                title={EYE_COLOR_NAMES[color][data.lang]}
                aria-pressed={eyes === color}
                className={`blot-lg size-9 ${eyes === color ? 'outline-2 outline-offset-2 outline-ink outline-solid' : ''}`}
                style={{ background: eyeSwatch(color) }}
              />
            ))}
          </Row>
          <Row label={t.setup.wearing}>
            {ACCESSORIES.map((accessory) => (
              <button
                key={accessory}
                type="button"
                onClick={() => setCompanion({ accessory })}
                aria-pressed={companion.accessory === accessory}
                className={`${chip} ${companion.accessory === accessory ? 'border-ink bg-paper-deep' : 'border-ink/25'}`}
              >
                {accessory === 'hat' ? t.hat : accessory === 'collar' ? species.neckwear[data.lang] : t.nothing}
              </button>
            ))}
          </Row>
          <label className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
            <span className="font-fell text-[18px]">{t.setup.catName}</span>
            <input
              value={companion.name}
              onChange={(e) => setCompanion({ name: e.target.value })}
              placeholder={t.setup.catNamePlaceholder}
              maxLength={24}
              spellCheck={false}
              className="h-12 w-full max-w-72 border-0 border-b-[1.5px] border-ink bg-transparent px-1 font-hand text-[26px] text-quill outline-none placeholder:font-sans placeholder:text-[16px] placeholder:italic placeholder:text-ink-soft/60"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
