import * as THREE from 'three'
import type { SpeciesDefinition } from './types'
import { blush, eyes } from './face'
import { at, bellCollar, cone, disposeTree, ease, ellipsoid, flat, hop, INK, lathe, part, shade, shadow, turn, wizardHat } from './toon'

const COATS: Record<string, { fur: string; light: string; eye: string; name: { en: string; nl: string } }> = {
  ginger: { fur: '#e38a3c', light: '#fbe1c0', eye: '#7bbf4a', name: { en: 'Ginger', nl: 'Rood' } },
  midnight: { fur: '#3d3749', light: '#776f8c', eye: '#c9e265', name: { en: 'Midnight', nl: 'Middernacht' } },
  silver: { fur: '#a9afbc', light: '#eef0f4', eye: '#e2b93c', name: { en: 'Silver', nl: 'Zilver' } },
  cream: { fur: '#efe2cc', light: '#fffaf0', eye: '#5aa7e0', name: { en: 'Cream', nl: 'Room' } }
}

/** The pose turns a little to show the tail; the head turns back to look at you. */
const POSE = -0.42

export const cat: SpeciesDefinition = {
  id: 'cat',
  name: { en: 'Cat', nl: 'Kat' },
  coats: Object.entries(COATS).map(([id, c]) => ({ id, name: c.name, swatch: c.fur })),
  neckwear: { en: 'Bell collar', nl: 'Belletje' },

  build(coatId, accessory) {
    const c = COATS[coatId] ?? COATS.ginger
    const stripe = shade(c.fur, -0.13)
    const root = new THREE.Group()
    root.add(shadow(1))
    const figure = turn(new THREE.Group(), 0, POSE, 0)
    root.add(figure)

    // Sitting body: a pear, with a pale chest and two front paws.
    const body = new THREE.Group()
    figure.add(body)
    body.add(part(lathe([[0, 0], [0.56, 0.04], [0.72, 0.26], [0.71, 0.56], [0.57, 0.86], [0.36, 1.04], [0, 1.1]], 1, 0.86), c.fur))
    body.add(at(part(ellipsoid(0.36, 0.44, 0.2), c.light, { outline: 0.03 }), 0, 0.56, 0.47))
    for (const side of [-1, 1]) body.add(at(part(ellipsoid(0.19, 0.13, 0.26), c.light), side * 0.27, 0.09, 0.5))

    // The tail: a chain of segments that curls up behind it and sways.
    const tailBase = turn(at(new THREE.Group(), 0.12, 0.2, -0.5), -1.05, 0, -0.55)
    body.add(tailBase)
    const tail: THREE.Group[] = []
    let link: THREE.Object3D = tailBase
    for (let i = 0; i < 8; i++) {
      const segment = new THREE.Group()
      segment.position.y = i === 0 ? 0 : 0.19
      const tip = i >= 6
      segment.add(at(part(new THREE.CapsuleGeometry(0.115 - i * 0.006, 0.13, 6, 16), tip ? stripe : c.fur, { outline: 0.032 }), 0, 0.1, 0))
      link.add(segment)
      tail.push(segment)
      link = segment
    }

    // A big head on a neck pivot, so breathing gently bobs it.
    const neck = at(new THREE.Group(), 0, 1.0, 0.04)
    body.add(neck)
    const head = at(new THREE.Group(), 0, 0.5, 0)
    neck.add(head)
    head.add(part(ellipsoid(0.74, 0.62, 0.64), c.fur))
    // Tabby marks on the forehead.
    head.add(at(part(ellipsoid(0.045, 0.15, 0.04), stripe, { outline: false }), 0, 0.42, 0.42))
    for (const side of [-1, 1]) head.add(turn(at(part(ellipsoid(0.04, 0.12, 0.04), stripe, { outline: false }), side * 0.16, 0.38, 0.44), 0, 0, side * 0.3))
    // Muzzle, nose, blush, eyes.
    for (const side of [-1, 1]) head.add(at(part(ellipsoid(0.2, 0.15, 0.14), c.light, { outline: 0.028 }), side * 0.13, -0.2, 0.53))
    head.add(at(part(ellipsoid(0.08, 0.055, 0.05), '#e58a9a', { outline: 0.024 }), 0, -0.1, 0.65))
    blush(head, 0.74, -0.12, 0.47)
    const face = eyes(head, { head: 0.74, y: 0.06, z: 0.5, iris: c.eye })

    const mouth = at(new THREE.Group(), 0, -0.25, 0.64)
    for (const side of [-1, 1]) {
      mouth.add(turn(at(new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.016, 6, 16, Math.PI), flat(INK)), side * 0.055, 0, 0), 0, 0, Math.PI))
    }
    const open = at(part(ellipsoid(0.07, 0.06, 0.03), '#7a2a2a', { outline: 0.016 }), 0, -0.06, -0.01)
    mouth.add(open)
    head.add(mouth)

    const ears = [-1, 1].map((side) => {
      const ear = turn(at(new THREE.Group(), side * 0.4, 0.42, -0.04), 0, 0, -side * 0.34)
      ear.add(at(part(cone(0.25, 0.5, 1, 0.5), c.fur), 0, 0.17, 0))
      ear.add(at(part(cone(0.15, 0.32, 1, 0.3), '#f0a6ae', { outline: false }), 0, 0.12, 0.07))
      head.add(ear)
      return ear
    })

    for (const side of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.48, 6), flat(INK))
        head.add(turn(at(whisker, side * 0.5, -0.15 - k * 0.05, 0.46), 0, 0, Math.PI / 2 + side * (k - 1) * 0.13))
      }
    }

    if (accessory === 'hat') head.add(turn(at(wizardHat(1.15), 0.02, 0.5, -0.06), -0.12, 0, 0.1))
    if (accessory === 'collar') body.add(at(bellCollar(0.47), 0, 0.96, 0.03))

    let tilt = 0
    let look = 0
    let nod = 0

    return {
      root,
      animate(mood, t, moodTime, dt) {
        const sleeping = mood === 'sleep'
        const breath = Math.sin(t * (sleeping ? 1.3 : 2.2))
        body.scale.set(1 + breath * 0.008, 1 + breath * (sleeping ? 0.03 : 0.018), 1 + breath * 0.008)
        root.position.y = mood === 'happy' ? hop(moodTime) : 0

        // The head turns back against the pose so it keeps looking at you.
        let wantTilt = 0.05 * Math.sin(t * 0.7)
        let wantLook = -POSE * 0.8 + 0.18 * Math.sin(t * 0.37) + 0.06 * Math.sin(t * 1.3)
        let wantNod = 0
        if (mood === 'curious') [wantTilt, wantLook] = [0.3, -POSE + 0.35]
        if (mood === 'sleep') [wantTilt, wantLook, wantNod] = [0.12, -POSE * 0.5, 0.3]
        if (mood === 'proud') [wantLook, wantNod] = [-POSE * 0.8 + 0.1 * Math.sin(t * 0.8), -0.16]
        if (mood === 'talk') wantNod = 0.06 * Math.sin(t * 11)
        if (mood === 'happy') wantNod = -0.12
        tilt = ease(tilt, wantTilt, dt, 5)
        look = ease(look, wantLook, dt, 4)
        nod = ease(nod, wantNod, dt, 8)
        head.rotation.set(nod, look, tilt)

        face.update(mood, t)

        const twitch = t % 6.1 < 0.18 ? Math.sin(((t % 6.1) / 0.18) * Math.PI) * 0.25 : 0
        const perk = mood === 'curious' ? -0.12 : sleeping ? 0.2 : 0
        ears[0].rotation.z = 0.34 + perk + twitch
        ears[1].rotation.z = -0.34 - perk

        const speed = mood === 'happy' ? 9 : sleeping ? 0.8 : 2.4
        const swing = mood === 'happy' ? 0.32 : sleeping ? 0.04 : 0.13
        tail.forEach((segment, i) => {
          segment.rotation.x = i === 0 ? 0 : sleeping ? 0.34 : 0.24
          segment.rotation.z = swing * Math.sin(t * speed - i * 0.55)
        })

        open.visible = mood === 'talk' || mood === 'happy'
        open.scale.y = mood === 'talk' ? 0.3 + 0.7 * Math.abs(Math.sin(t * 9)) : 1
      },
      dispose: () => disposeTree(root)
    }
  }
}
