import * as THREE from 'three'
import type { Mood } from './types'
import { at, blink, ellipsoid, flat, INK, part, turn } from './toon'

/**
 * The face every companion shares. Faces are where 3D animals turn creepy, so
 * the rules live here in code rather than in each animal (docs/companions.md
 * explains them): eye size and spacing follow from the width of the head, all
 * eyes are dark with the same highlights from the upper left, and closed eyes
 * are drawn as arcs, never as squashed slits.
 */
export const FACE = {
  /** Eye height as a share of the head's half-width. */
  eyeSize: 0.25,
  /** Distance from the middle to each eye, as a share of the head's half-width. */
  spacing: { min: 0.36, normal: 0.38, max: 0.45 },
  /** How far each eye may turn outward, in radians; more and they stop looking at you. */
  maxYaw: 0.35
}

export interface EyeOptions {
  /** Half-width of the head (or snout) the eyes sit on. */
  head: number
  y: number
  z: number
  /** Iris colour: dark and warm, never pale. */
  iris: string
  spacing?: number
  yaw?: number
  blinkEvery?: number
  blinkOffset?: number
}

export interface Eyes {
  update(mood: Mood, t: number): void
}

/** A big glossy toy eye: a dark iris, a darker pupil, two highlights from the upper left. */
function eyeball(radius: number, iris: string): THREE.Group {
  const group = new THREE.Group()
  group.add(part(ellipsoid(radius * 0.8, radius, radius * 0.55), iris, { outline: 0.028 }))
  group.add(at(part(ellipsoid(radius * 0.52, radius * 0.68, radius * 0.3), '#1d1410', { outline: false }), 0, -radius * 0.05, radius * 0.32))
  group.add(at(new THREE.Mesh(ellipsoid(radius * 0.24, radius * 0.28, radius * 0.1, 12), flat('#ffffff')), -radius * 0.24, radius * 0.32, radius * 0.5))
  group.add(at(new THREE.Mesh(ellipsoid(radius * 0.1, radius * 0.1, radius * 0.06, 10), flat('#ffffff')), radius * 0.22, -radius * 0.22, radius * 0.5))
  return group
}

/** A closed eye: an ink arc curving up (happy, ^^) or down (asleep, relaxed). */
function lid(radius: number, way: 'happy' | 'asleep'): THREE.Mesh {
  const arc = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.6, radius * 0.14, 8, 24, Math.PI), flat(INK))
  arc.position.set(0, way === 'happy' ? -radius * 0.2 : radius * 0.2, radius * 0.42)
  if (way === 'asleep') arc.rotation.z = Math.PI
  return arc
}

export function eyes(parent: THREE.Object3D, options: EyeOptions): Eyes {
  const radius = options.head * FACE.eyeSize
  const share = Math.min(FACE.spacing.max, Math.max(FACE.spacing.min, options.spacing ?? FACE.spacing.normal))
  const yaw = Math.min(options.yaw ?? 0.28, FACE.maxYaw)

  const pairs = [-1, 1].map((side) => {
    const holder = turn(at(new THREE.Group(), side * options.head * share, options.y, options.z), 0, side * yaw, 0)
    const open = eyeball(radius, options.iris)
    const happy = lid(radius, 'happy')
    const asleep = lid(radius, 'asleep')
    holder.add(open, happy, asleep)
    parent.add(holder)
    return { open, happy, asleep }
  })

  return {
    update(mood, t) {
      const closedHappy = mood === 'happy'
      const closedAsleep = mood === 'sleep'
      const openness = blink(t, options.blinkEvery, options.blinkOffset)
      for (const pair of pairs) {
        pair.open.visible = !closedHappy && !closedAsleep
        pair.open.scale.y = openness
        pair.happy.visible = closedHappy
        pair.asleep.visible = closedAsleep
      }
    }
  }
}

/** Two soft pink cheeks, below and outside the eyes. Every companion has them. */
export function blush(parent: THREE.Object3D, head: number, y: number, z: number, color = '#f2a0a6'): void {
  for (const side of [-1, 1]) {
    parent.add(turn(at(part(ellipsoid(head * 0.15, head * 0.075, head * 0.055), color, { outline: false }), side * head * 0.6, y, z), 0, side * 0.35, 0))
  }
}
