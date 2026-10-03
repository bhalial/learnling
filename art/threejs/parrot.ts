import * as THREE from 'three'
import type { SpeciesDefinition } from './types'
import { blush, eyes } from './face'
import { at, bowTie, cone, disposeTree, ease, ellipsoid, hop, lathe, part, shadow, turn, wizardHat } from './toon'

interface ParrotCoat {
  body: string
  chest: string
  wing: string
  band: string
  face?: string
  forehead?: string
  crest?: string
  beak: string
  lower: string
  name: { en: string; nl: string }
}

const COATS: Record<string, ParrotCoat> = {
  scarlet: { body: '#d93a2b', chest: '#e0473a', wing: '#2f6fcf', band: '#f2c230', face: '#f6efe6', beak: '#efe6d6', lower: '#2b2118', name: { en: 'Scarlet', nl: 'Ara rood' } },
  bluegold: { body: '#2f80d4', chest: '#f2b632', wing: '#2f80d4', band: '#1f5aa6', face: '#f6efe6', beak: '#2b2118', lower: '#2b2118', name: { en: 'Blue & gold', nl: 'Blauw-geel' } },
  green: { body: '#5aa83f', chest: '#8cc85a', wing: '#3c8a2c', band: '#2f6fcf', forehead: '#d93a2b', beak: '#e8c96a', lower: '#c9a548', name: { en: 'Green', nl: 'Groen' } },
  cockatoo: { body: '#f7f4ee', chest: '#fffdf8', wing: '#ece6da', band: '#f5d04a', crest: '#f5d04a', beak: '#3a3a3a', lower: '#3a3a3a', name: { en: 'Cockatoo', nl: 'Kaketoe' } }
}

const POSE = -0.32

export const parrot: SpeciesDefinition = {
  id: 'parrot',
  name: { en: 'Parrot', nl: 'Papegaai' },
  coats: Object.entries(COATS).map(([id, c]) => ({ id, name: c.name, swatch: c.body })),
  neckwear: { en: 'Bow tie', nl: 'Strikje' },

  build(coatId, accessory) {
    const c = COATS[coatId] ?? COATS.scarlet
    const root = new THREE.Group()
    root.add(shadow(0.85))

    // A little branch to sit on.
    const branch = turn(at(part(new THREE.CapsuleGeometry(0.075, 1.5, 6, 16), '#7a5232'), 0, 0.3, 0.05), 0, 0, Math.PI / 2 + 0.05)
    root.add(branch)
    root.add(turn(at(part(new THREE.CapsuleGeometry(0.04, 0.3, 6, 12), '#7a5232'), 0.55, 0.45, 0.05), 0, 0, -0.6))
    root.add(turn(at(part(ellipsoid(0.16, 0.06, 0.1), '#5f9a45'), 0.72, 0.62, 0.05), 0, 0, -0.5))

    const figure = turn(at(new THREE.Group(), 0, 0.34, 0), 0, POSE, 0)
    root.add(figure)
    for (const side of [-1, 1]) figure.add(at(part(ellipsoid(0.1, 0.06, 0.14), '#6b6b70', { outline: 0.025 }), side * 0.14, 0, 0.1))

    const body = turn(new THREE.Group(), 0.08, 0, 0)
    figure.add(body)
    body.add(part(lathe([[0, 0], [0.3, 0.06], [0.45, 0.34], [0.45, 0.7], [0.35, 1.0], [0, 1.1]], 1, 0.92), c.body))
    body.add(at(part(ellipsoid(0.33, 0.44, 0.2), c.chest, { outline: 0.028 }), 0, 0.52, 0.32))

    // Tail feathers fan out down and back.
    const tail = turn(at(new THREE.Group(), 0, 0.14, -0.28), 0.55, 0, 0)
    body.add(tail)
    for (const spread of [-0.2, 0, 0.2]) tail.add(turn(at(part(ellipsoid(0.08, 0.5, 0.035), c.wing, { outline: 0.028 }), 0, -0.42, 0), 0, 0, spread))

    // Wings hang from the shoulders and flap from there.
    const wings = [-1, 1].map((side) => {
      const wing = turn(at(new THREE.Group(), side * 0.4, 0.88, -0.02), 0, 0, side * 0.12)
      wing.add(at(part(ellipsoid(0.13, 0.48, 0.3), c.wing), 0, -0.38, 0))
      wing.add(at(part(ellipsoid(0.14, 0.15, 0.27), c.band, { outline: 0.028 }), 0, -0.2, 0.02))
      body.add(wing)
      return wing
    })

    const neck = at(new THREE.Group(), 0, 1.0, 0.05)
    body.add(neck)
    const head = at(new THREE.Group(), 0, 0.3, 0)
    neck.add(head)
    head.add(part(ellipsoid(0.44, 0.42, 0.44), c.body))
    // Macaws have a pale patch around each eye; it frames the eye, the eye itself stays dark.
    if (c.face) for (const side of [-1, 1]) head.add(turn(at(part(ellipsoid(0.15, 0.17, 0.08), c.face, { outline: 0.024 }), side * 0.2, 0.04, 0.33), 0, side * 0.35, 0))
    if (c.forehead) head.add(at(part(ellipsoid(0.18, 0.1, 0.14), c.forehead, { outline: false }), 0, 0.3, 0.28))
    const face = eyes(head, { head: 0.44, y: 0.06, z: 0.36, iris: '#3a2a1e', spacing: 0.45, yaw: 0.35, blinkEvery: 3.5, blinkOffset: 0.7 })
    blush(head, 0.44, -0.1, 0.36)

    // The beak: a hooked upper half and a lower half that opens to talk.
    const beak = at(new THREE.Group(), 0, -0.1, 0.36)
    head.add(beak)
    beak.add(part(ellipsoid(0.14, 0.13, 0.13), c.beak, { outline: 0.028 }))
    beak.add(turn(at(part(cone(0.12, 0.3), c.beak, { outline: 0.028 }), 0, -0.1, 0.1), 2.4, 0, 0))
    const jaw = at(new THREE.Group(), 0, -0.08, 0)
    jaw.add(at(part(ellipsoid(0.09, 0.06, 0.11), c.lower, { outline: 0.024 }), 0, -0.04, 0.04))
    beak.add(jaw)

    const crest = c.crest ? turn(at(new THREE.Group(), 0, 0.36, -0.06), -0.2, 0, 0) : null
    if (crest) {
      head.add(crest)
      for (let i = 0; i < 4; i++) crest.add(turn(at(part(ellipsoid(0.055, 0.3, 0.03), c.crest!, { outline: 0.024 }), 0, 0.22, -i * 0.05), -0.25 - i * 0.22, 0, 0))
    }

    if (accessory === 'hat') head.add(turn(at(wizardHat(0.9), 0, 0.36, -0.04), -0.15, 0, 0.1))
    if (accessory === 'collar') body.add(at(bowTie(1.1), 0, 0.96, 0.36))

    let tilt = 0
    let look = 0
    let nod = 0
    let fluff = 1
    let crestLift = 0

    return {
      root,
      animate(mood, t, moodTime, dt) {
        const sleeping = mood === 'sleep'
        const happy = mood === 'happy'
        fluff = ease(fluff, sleeping ? 1.07 : 1, dt, 2)
        const breath = Math.sin(t * (sleeping ? 1.4 : 2.6))
        body.scale.set(fluff + breath * 0.008, fluff + breath * 0.016, fluff + breath * 0.008)
        figure.position.y = 0.34 + (happy ? hop(moodTime, 0.22) : 0)

        // Parrots move their heads in quick little snaps between poses.
        const snap = Math.floor(t / 1.6)
        const pose = [0.15, -0.2, 0.3, -0.05, 0.25][snap % 5]
        let wantTilt = pose * 0.5
        let wantLook = -POSE * 0.8 + pose
        let wantNod = 0
        let wantCrest = 0
        if (mood === 'curious') [wantTilt, wantLook, wantCrest] = [0.55, -POSE + 0.3, 0.6]
        if (sleeping) [wantTilt, wantLook, wantNod] = [0.2, -POSE + 0.9, 0.45]
        if (mood === 'proud') [wantNod, wantCrest] = [-0.2, 0.8]
        if (mood === 'talk') [wantNod, wantTilt] = [0.1 * Math.sin(t * 12), 0.15]
        if (happy) [wantNod, wantCrest] = [-0.1, 1]
        tilt = ease(tilt, wantTilt, dt, 14)
        look = ease(look, wantLook, dt, 14)
        nod = ease(nod, wantNod, dt, 10)
        head.rotation.set(nod, look, tilt)

        face.update(mood, t)

        const flap = happy && moodTime < 1.4 ? 0.85 * Math.abs(Math.sin(t * 16)) : mood === 'proud' ? 0.25 : 0
        wings[0].rotation.z = -0.12 - flap
        wings[1].rotation.z = 0.12 + flap

        tail.rotation.x = 0.55 + 0.05 * Math.sin(t * 2)
        jaw.rotation.x = mood === 'talk' ? 0.35 * Math.abs(Math.sin(t * 10)) : happy ? 0.25 : 0

        if (crest) {
          crestLift = ease(crestLift, wantCrest, dt, 6)
          crest.rotation.x = -0.2 + crestLift * 0.7
        }
      },
      dispose: () => disposeTree(root)
    }
  }
}
