import * as THREE from 'three'
import type { SpeciesDefinition } from './types'
import { blush, eyes } from './face'
import { at, disposeTree, ease, ellipsoid, flat, hop, INK, lathe, part, scarf, shade, shadow, slab, turn, twoTone, wizardHat } from './toon'

const COATS: Record<string, { body: string; belly: string; name: { en: string; nl: string } }> = {
  ocean: { body: '#5d7fa3', belly: '#eef2f5', name: { en: 'Ocean', nl: 'Oceaan' } },
  reef: { body: '#8f9aa5', belly: '#f2f4f6', name: { en: 'Reef', nl: 'Rif' } },
  coral: { body: '#e88aa8', belly: '#fff1f4', name: { en: 'Coral', nl: 'Koraal' } },
  deep: { body: '#2f4064', belly: '#cdd8ea', name: { en: 'Deep sea', nl: 'Diepzee' } }
}

/**
 * A magic shark swims through the air, turned enough to show its fins but not
 * so far that the far eye slips behind the snout.
 */
const POSE = 0.42
const FLOAT = 1.05

/** Fin outlines as [x, y] points: start, then control/end pairs (see slab()). x runs towards the tail. */
const DORSAL: Array<[number, number]> = [[-0.28, 0], [-0.18, 0.42], [0.14, 0.62], [0.06, 0.28], [0.26, 0.02], [0, -0.04]]
const TAIL_UPPER: Array<[number, number]> = [[0, 0.04], [0.12, 0.38], [0.48, 0.8], [0.3, 0.36], [0.34, 0.02], [0.16, -0.02]]
const TAIL_LOWER: Array<[number, number]> = [[0, -0.03], [0.1, -0.22], [0.32, -0.46], [0.24, -0.18], [0.3, -0.02], [0.14, 0.02]]
/** A pectoral fin, x outward and y backward. */
const PECTORAL: Array<[number, number]> = [[0, 0.03], [0.18, 0.02], [0.4, 0.29], [0.16, 0.22], [0.02, 0.22], [-0.02, 0.12]]

export const shark: SpeciesDefinition = {
  id: 'shark',
  name: { en: 'Shark', nl: 'Haai' },
  coats: Object.entries(COATS).map(([id, c]) => ({ id, name: c.name, swatch: c.body })),
  neckwear: { en: 'Scarf', nl: 'Sjaal' },

  build(coatId, accessory) {
    const c = COATS[coatId] ?? COATS.ocean
    const fin = shade(c.body, -0.06)
    const root = new THREE.Group()
    const ground = shadow(0.95)
    root.add(ground)

    const figure = turn(at(new THREE.Group(), 0, FLOAT, 0), 0, POSE, 0)
    root.add(figure)
    const body = new THREE.Group()
    figure.add(body)

    // A torpedo with a pointed snout (front, +z), dark on top and pale underneath.
    const torso = lathe([[0, 0], [0.1, 0.03], [0.24, 0.12], [0.38, 0.28], [0.48, 0.5], [0.52, 0.78], [0.48, 1.1], [0.38, 1.42], [0.26, 1.7], [0.15, 1.92], [0.08, 2.08], [0, 2.15]])
    torso.rotateX(-Math.PI / 2).translate(0, 0, 0.95).scale(0.9, 0.8, 1)
    body.add(part(torso, c.body, { material: twoTone(c.body, c.belly, -0.07) }))

    // The classic tall dorsal fin, raked back, and a small second one near the tail.
    const dorsal = slab(DORSAL, 0.08)
    dorsal.rotateY(Math.PI / 2)
    body.add(at(part(dorsal, fin), 0, 0.33, -0.1))
    const second = slab(DORSAL, 0.05)
    second.scale(0.35, 0.35, 1).rotateY(Math.PI / 2)
    body.add(at(part(second, fin, { outline: 0.03 }), 0, 0.13, -0.86))

    // Pectoral fins stick out low on both sides and paddle gently.
    const fins = [-1, 1].map((side) => {
      const shape = slab(PECTORAL.map(([x, y]) => [x * side, y] as [number, number]), 0.06)
      shape.rotateX(-Math.PI / 2)
      const pivot = turn(at(new THREE.Group(), side * 0.34, -0.2, 0.22), 0, 0, -side * 0.4)
      pivot.add(part(shape, fin, { outline: 0.03 }))
      body.add(pivot)
      return pivot
    })

    // The crescent tail: a big upper lobe and a smaller lower one, swishing from the hips.
    const tail = at(new THREE.Group(), 0, 0, -0.78)
    body.add(tail)
    for (const lobe of [TAIL_UPPER, TAIL_LOWER]) {
      const shape = slab(lobe, 0.07)
      shape.rotateY(Math.PI / 2)
      tail.add(at(part(shape, fin), 0, 0.02, -0.36))
    }

    // Five gill slits on each side, the way real sharks have them.
    for (const side of [-1, 1]) {
      for (let k = 0; k < 5; k++) {
        const slit = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.13 - k * 0.012, 4, 8), flat(INK))
        body.add(turn(at(slit, side * (0.425 + k * 0.006), -0.02, 0.4 - k * 0.07), 0, 0, side * 0.12))
      }
    }

    // The face sits on the front of the snout so both eyes look at her.
    const face = eyes(body, { head: 0.5, y: 0.16, z: 0.73, iris: '#2f3a52', spacing: 0.38, yaw: 0.3, blinkEvery: 4.6, blinkOffset: 2 })
    blush(body, 0.4, 0.03, 0.75)

    // The grin wraps around the underside of the snout, like a plush shark's: a
    // ring hugging the snout, open at the top, centred underneath. Two little
    // teeth hang from its middle; it opens to talk and cheer.
    const MOUTH_Z = 0.8
    const [mouthX, mouthY] = [0.25, 0.222]
    const span = 2.1
    const grin = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.024, 8, 40, span), flat(INK))
    grin.scale.set(mouthX / 0.27, mouthY / 0.27, 1)
    grin.rotation.z = -Math.PI / 2 - span / 2
    body.add(at(grin, 0, 0, MOUTH_Z))
    for (const side of [-1, 1]) {
      const angle = -Math.PI / 2 + side * 0.32
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.042, 8), flat('#ffffff'))
      body.add(turn(at(tooth, Math.cos(angle) * mouthX, Math.sin(angle) * mouthY - 0.022, MOUTH_Z + 0.01), Math.PI, 0, side * 0.3))
    }
    const open = at(new THREE.Group(), 0, -mouthY - 0.01, MOUTH_Z - 0.02)
    open.add(part(ellipsoid(0.15, 0.045, 0.09), '#6b1f2a', { outline: 0.018 }))
    for (const x of [-0.09, -0.045, 0, 0.045, 0.09]) open.add(turn(at(new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.04, 8), flat('#ffffff')), x, 0.02, 0.06), Math.PI, 0, 0))
    body.add(open)

    if (accessory === 'hat') body.add(turn(at(wizardHat(0.85), 0, 0.31, 0.42), -0.22, 0, 0.1))
    if (accessory === 'collar') {
      // The scarf hugs the body just behind the gills, squeezed to its oval.
      const wrap = turn(at(scarf(0.46), 0, -0.04, 0.02), -Math.PI / 2 + 0.12, 0, 0)
      wrap.scale.set(1, 1, 0.86)
      body.add(wrap)
    }

    root.scale.setScalar(1.12)

    let heading = POSE
    let pitch = 0
    let height = FLOAT

    return {
      root,
      animate(mood, t, moodTime, dt) {
        const sleeping = mood === 'sleep'
        const happy = mood === 'happy'

        height = ease(height, sleeping ? FLOAT - 0.3 : FLOAT, dt, 2)
        figure.position.y = height + 0.08 * Math.sin(t * (sleeping ? 0.8 : 1.6)) + (happy ? hop(moodTime, 0.3) : 0)
        ground.scale.setScalar(1 - (figure.position.y - FLOAT) * 0.4)

        let wantHeading = POSE + 0.12 * Math.sin(t * 0.4)
        let wantPitch = 0.04 * Math.sin(t * 0.9)
        if (mood === 'curious') [wantHeading, wantPitch] = [POSE + 0.3, -0.18]
        if (mood === 'proud') wantPitch = -0.2
        if (sleeping) [wantHeading, wantPitch] = [POSE - 0.15, 0.12]
        if (mood === 'talk') wantPitch = 0.06 * Math.sin(t * 10)
        heading = ease(heading, wantHeading, dt, 3)
        pitch = ease(pitch, wantPitch, dt, 6)
        // A happy shark does a barrel roll.
        const roll = happy && moodTime < 0.9 ? (moodTime / 0.9) * Math.PI * 2 : 0
        figure.rotation.set(pitch, heading, 0.06 * Math.sin(t * 1.1) + roll)

        // Swimming: the tail swishes and the body answers it a little.
        const speed = happy ? 10 : sleeping ? 1.2 : 3.6
        tail.rotation.y = (sleeping ? 0.12 : 0.34) * Math.sin(t * speed)
        body.rotation.y = -0.06 * Math.sin(t * speed - 0.8)
        fins.forEach((pivot, i) => (pivot.rotation.z = (i ? -0.4 : 0.4) + 0.1 * Math.sin(t * 2.4 + i)))

        face.update(mood, t)
        open.visible = mood === 'talk' || happy
        open.scale.y = mood === 'talk' ? 0.3 + 0.7 * Math.abs(Math.sin(t * 9)) : 1
      },
      dispose: () => disposeTree(root)
    }
  }
}
