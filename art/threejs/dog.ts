import * as THREE from 'three'
import type { SpeciesDefinition } from './types'
import { blush, eyes } from './face'
import { at, bellCollar, disposeTree, ease, ellipsoid, flat, hop, INK, lathe, part, shadow, turn, wizardHat } from './toon'

const COATS: Record<string, { fur: string; light: string; ear: string; name: { en: string; nl: string } }> = {
  golden: { fur: '#d9a35a', light: '#f6e3bd', ear: '#b97f3e', name: { en: 'Golden', nl: 'Goud' } },
  chocolate: { fur: '#7a4c2e', light: '#c79d76', ear: '#5c3720', name: { en: 'Chocolate', nl: 'Chocolade' } },
  husky: { fur: '#7f8893', light: '#f3f3ef', ear: '#5d6570', name: { en: 'Husky', nl: 'Husky' } },
  snow: { fur: '#f2ede4', light: '#ffffff', ear: '#d9c7ab', name: { en: 'Snow', nl: 'Sneeuw' } }
}

const POSE = -0.4

export const dog: SpeciesDefinition = {
  id: 'dog',
  name: { en: 'Dog', nl: 'Hond' },
  coats: Object.entries(COATS).map(([id, c]) => ({ id, name: c.name, swatch: c.fur })),
  neckwear: { en: 'Collar', nl: 'Halsband' },

  build(coatId, accessory) {
    const c = COATS[coatId] ?? COATS.golden
    const root = new THREE.Group()
    root.add(shadow(1.05))
    const figure = turn(new THREE.Group(), 0, POSE, 0)
    root.add(figure)

    const body = new THREE.Group()
    figure.add(body)
    body.add(part(lathe([[0, 0], [0.6, 0.04], [0.76, 0.28], [0.74, 0.58], [0.58, 0.88], [0.38, 1.04], [0, 1.1]], 1, 0.88), c.fur))
    body.add(at(part(ellipsoid(0.38, 0.46, 0.2), c.light, { outline: 0.03 }), 0, 0.56, 0.5))
    for (const side of [-1, 1]) body.add(at(part(ellipsoid(0.2, 0.14, 0.28), c.light), side * 0.28, 0.1, 0.52))

    // A short tail that wags from its base.
    const tailBase = turn(at(new THREE.Group(), 0.08, 0.32, -0.55), -0.55, 0, -0.35)
    body.add(tailBase)
    const tail: THREE.Group[] = []
    let link: THREE.Object3D = tailBase
    for (let i = 0; i < 5; i++) {
      const segment = new THREE.Group()
      segment.position.y = i === 0 ? 0 : 0.17
      segment.add(at(part(new THREE.CapsuleGeometry(0.11 - i * 0.012, 0.12, 6, 16), i === 4 ? c.light : c.fur, { outline: 0.032 }), 0, 0.09, 0))
      link.add(segment)
      tail.push(segment)
      link = segment
    }

    const neck = at(new THREE.Group(), 0, 1.0, 0.05)
    body.add(neck)
    const head = at(new THREE.Group(), 0, 0.48, 0)
    neck.add(head)
    head.add(part(ellipsoid(0.68, 0.6, 0.62), c.fur))
    head.add(at(part(ellipsoid(0.34, 0.25, 0.32), c.light, { outline: 0.03 }), 0, -0.2, 0.5))
    head.add(at(part(ellipsoid(0.13, 0.09, 0.085), INK, { outline: 0.02 }), 0, -0.09, 0.8))
    head.add(at(new THREE.Mesh(ellipsoid(0.04, 0.025, 0.02, 10), flat('#ffffff')), -0.04, -0.06, 0.88))
    const smile = at(new THREE.Group(), 0, -0.3, 0.75)
    for (const side of [-1, 1]) {
      smile.add(turn(at(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 6, 16, Math.PI), flat(INK)), side * 0.06, 0, 0), -0.4, 0, Math.PI))
    }
    head.add(smile)
    const tongue = turn(at(part(ellipsoid(0.1, 0.035, 0.14), '#e8788a', { outline: 0.02 }), 0, -0.39, 0.7), 0.5, 0, 0)
    head.add(tongue)

    const face = eyes(head, { head: 0.68, y: 0.1, z: 0.5, iris: '#5a3520', spacing: 0.4, blinkEvery: 3.9, blinkOffset: 1.1 })
    blush(head, 0.68, -0.12, 0.5)
    // Little eyebrow dots make the face expressive.
    for (const side of [-1, 1]) head.add(at(part(ellipsoid(0.07, 0.04, 0.03), c.light, { outline: false }), side * 0.25, 0.32, 0.53))

    // Floppy ears hang from a pivot at the top of the head.
    const ears = [-1, 1].map((side) => {
      const ear = turn(at(new THREE.Group(), side * 0.5, 0.34, -0.02), 0, 0, side * 0.18)
      ear.add(at(part(ellipsoid(0.17, 0.36, 0.09), c.ear), 0, -0.3, 0))
      head.add(ear)
      return ear
    })

    if (accessory === 'hat') head.add(turn(at(wizardHat(1.1), 0, 0.5, -0.08), -0.12, 0, 0.08))
    if (accessory === 'collar') body.add(at(bellCollar(0.5), 0, 0.96, 0.03))

    let tilt = 0
    let look = 0
    let nod = 0
    let earLift = 0

    return {
      root,
      animate(mood, t, moodTime, dt) {
        const sleeping = mood === 'sleep'
        const happy = mood === 'happy'
        const pant = happy || mood === 'proud'
        const breath = Math.sin(t * (sleeping ? 1.3 : pant ? 7 : 2.2))
        body.scale.set(1 + breath * 0.008, 1 + breath * (sleeping ? 0.03 : 0.016), 1 + breath * 0.008)
        root.position.y = happy ? hop(moodTime, 0.32) : 0

        let wantTilt = 0.06 * Math.sin(t * 0.6)
        let wantLook = -POSE * 0.8 + 0.2 * Math.sin(t * 0.33)
        let wantNod = 0
        let wantEars = 0
        if (mood === 'curious') [wantTilt, wantLook, wantEars] = [0.45, -POSE + 0.25, 0.5]
        if (sleeping) [wantTilt, wantLook, wantNod, wantEars] = [0.1, -POSE * 0.5, 0.34, -0.15]
        if (mood === 'proud') [wantNod, wantEars] = [-0.16, 0.15]
        if (mood === 'talk') [wantNod, wantEars] = [0.07 * Math.sin(t * 10), 0.2]
        if (happy) [wantNod, wantEars] = [-0.1, 0.35]
        tilt = ease(tilt, wantTilt, dt, 5)
        look = ease(look, wantLook, dt, 4)
        nod = ease(nod, wantNod, dt, 8)
        earLift = ease(earLift, wantEars, dt, 7)
        head.rotation.set(nod, look, tilt)

        face.update(mood, t)

        // Ears swing a little behind the head's movement, and lift when excited.
        const swing = 0.08 * Math.sin(t * 2.1) - tilt * 0.4
        ears[0].rotation.z = -0.18 - earLift + swing
        ears[1].rotation.z = 0.18 + earLift + swing

        const speed = happy ? 16 : sleeping ? 0.6 : mood === 'curious' ? 3 : 5
        const wag = happy ? 0.45 : sleeping ? 0.03 : 0.2
        tail.forEach((segment, i) => {
          segment.rotation.x = i === 0 ? 0 : 0.18
          segment.rotation.z = wag * Math.sin(t * speed - i * 0.4)
        })

        tongue.visible = pant || mood === 'talk'
        tongue.scale.y = mood === 'talk' ? 0.6 + 0.4 * Math.abs(Math.sin(t * 9)) : 1
      },
      dispose: () => disposeTree(root)
    }
  }
}
