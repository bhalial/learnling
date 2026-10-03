import * as THREE from 'three'

/*
 * The storybook look in 3D: cel shading in three soft bands, and an ink line
 * around every part (an inflated back-face shell). Scale is baked into the
 * geometry so every outline keeps the same thickness.
 */

export const INK = '#2b2118'

let ramp: THREE.DataTexture | null = null

/** Three tone bands: shade, mid, light. */
function toonRamp(): THREE.DataTexture {
  if (ramp) return ramp
  const tones = [118, 196, 255]
  ramp = new THREE.DataTexture(new Uint8Array(tones.flatMap((v) => [v, v, v, 255])), tones.length, 1, THREE.RGBAFormat)
  ramp.minFilter = THREE.NearestFilter
  ramp.magFilter = THREE.NearestFilter
  ramp.needsUpdate = true
  return ramp
}

const toonCache = new Map<string, THREE.MeshToonMaterial>()
export function toon(color: string): THREE.MeshToonMaterial {
  let material = toonCache.get(color)
  if (!material) {
    material = new THREE.MeshToonMaterial({ color, gradientMap: toonRamp() })
    toonCache.set(color, material)
  }
  return material
}

const twoToneCache = new Map<string, THREE.MeshToonMaterial>()
/**
 * Countershading on one mesh: `top` above a gently waving line at `split` (in
 * the mesh's own y), `bottom` below it. Crisp like a painted edge, and nothing
 * sticks out the way a separate belly shape would.
 */
export function twoTone(top: string, bottom: string, split: number): THREE.MeshToonMaterial {
  const key = `${top}|${bottom}|${split}`
  let material = twoToneCache.get(key)
  if (!material) {
    material = new THREE.MeshToonMaterial({ color: top, gradientMap: toonRamp() })
    const below = new THREE.Color(bottom)
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uBelow = { value: below }
      shader.vertexShader =
        'varying vec3 vLocal;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;')
      shader.fragmentShader =
        'uniform vec3 uBelow;\nvarying vec3 vLocal;\n' +
        shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>\nif (vLocal.y < ${split.toFixed(3)} + 0.035 * sin(vLocal.z * 7.0)) diffuseColor.rgb = uBelow;`
        )
    }
    material.customProgramCacheKey = () => `two-tone-${key}`
    twoToneCache.set(key, material)
  }
  return material
}

const flatCache = new Map<string, THREE.MeshBasicMaterial>()
/** Unlit colour, for eye highlights and the like. */
export function flat(color: string): THREE.MeshBasicMaterial {
  let material = flatCache.get(color)
  if (!material) {
    material = new THREE.MeshBasicMaterial({ color })
    flatCache.set(color, material)
  }
  return material
}

const outlineCache = new Map<number, THREE.MeshBasicMaterial>()
function outlineMaterial(width: number): THREE.MeshBasicMaterial {
  let material = outlineCache.get(width)
  if (!material) {
    material = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\ntransformed += normalize(normal) * ${width.toFixed(4)};`
      )
    }
    material.customProgramCacheKey = () => `outline-${width}`
    outlineCache.set(width, material)
  }
  return material
}

export interface PartOptions {
  /** Ink line thickness; false for none. */
  outline?: number | false
  material?: THREE.Material
}

/** A mesh with its ink line, in one group so they move together. */
export function part(geometry: THREE.BufferGeometry, color: string, options: PartOptions = {}): THREE.Group {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(geometry, options.material ?? toon(color)))
  const width = options.outline === undefined ? 0.04 : options.outline
  if (width !== false) group.add(new THREE.Mesh(geometry, outlineMaterial(width)))
  return group
}

export const at = <T extends THREE.Object3D>(object: T, x: number, y: number, z: number): T => {
  object.position.set(x, y, z)
  return object
}

export const turn = <T extends THREE.Object3D>(object: T, x: number, y: number, z: number): T => {
  object.rotation.set(x, y, z)
  return object
}

export const ellipsoid = (rx: number, ry: number, rz: number, detail = 32): THREE.BufferGeometry =>
  new THREE.SphereGeometry(1, detail, Math.round(detail * 0.75)).scale(rx, ry, rz)

/** A rounded cone (ears, beaks, hats). */
export const cone = (radius: number, height: number, sx = 1, sz = 1): THREE.BufferGeometry =>
  new THREE.ConeGeometry(radius, height, 32, 1).scale(sx, 1, sz)

/** A solid of revolution from [radius, height] pairs, bottom to top. */
export const lathe = (profile: Array<[number, number]>, sx = 1, sz = 1): THREE.BufferGeometry =>
  new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    40
  ).scale(sx, 1, sz)

/** A flat shape with a little thickness and rounded edges (fins, feathers). */
export function slab(points: Array<[number, number]>, depth = 0.06): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i += 2) {
    const [cx, cy] = points[i]
    const [x, y] = points[i + 1] ?? points[0]
    shape.quadraticCurveTo(cx, cy, x, y)
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.5,
    bevelSize: depth * 0.45,
    bevelSegments: 3,
    curveSegments: 16
  })
  geometry.translate(0, 0, -depth / 2)
  geometry.computeVertexNormals()
  return geometry
}

/** A soft round shadow under the animal. */
export function shadow(radius: number): THREE.Mesh {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(20,10,5,0.45)')
  gradient.addColorStop(1, 'rgba(20,10,5,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false })
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.005
  return mesh
}

/** A colour made darker (negative) or lighter (positive), for stripes and shading marks. */
export function shade(color: string, amount: number): string {
  return '#' + new THREE.Color(color).offsetHSL(0, 0, amount).getHexString()
}

/** Frees every geometry under a root (materials are shared and cached). */
export function disposeTree(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose()
      const material = object.material as THREE.Material & { map?: THREE.Texture }
      if (material.map) {
        material.map.dispose()
        material.dispose()
      }
    }
  })
}

// ——— Motion helpers ———

/** Eyelid opening for an idle blink every few seconds (1 open, 0.1 shut). */
export function blink(t: number, every = 4.3, offset = 0): number {
  const phase = (t + offset) % every
  return phase < 0.13 ? 0.1 + 0.9 * Math.abs(phase - 0.065) / 0.065 : 1
}

/** A hop that bounces twice and settles within `length` seconds. */
export function hop(moodTime: number, height = 0.28, length = 1.1): number {
  if (moodTime > length) return 0
  const decay = 1 - moodTime / length
  return Math.abs(Math.sin(moodTime * 7.5)) * height * decay
}

/** Moves a value towards a target, smoothly and independent of frame rate. */
export const ease = (current: number, target: number, dt: number, speed = 6): number =>
  current + (target - current) * (1 - Math.exp(-speed * dt))

// ——— Accessories ———

const HAT = '#4b3a8c'
const GOLD = '#e3b54a'
const WAX = '#a32c25'

/** The wizard hat; its base sits at the origin. */
export function wizardHat(size = 1): THREE.Group {
  const hat = new THREE.Group()
  hat.add(part(new THREE.CylinderGeometry(0.42 * size, 0.44 * size, 0.05 * size, 40), '#3c2d73'))
  const tip = new THREE.Group()
  tip.add(at(part(cone(0.27 * size, 0.62 * size), HAT), 0, 0.33 * size, 0))
  tip.add(at(part(new THREE.CylinderGeometry(0.255 * size, 0.27 * size, 0.07 * size, 40), '#c79a3a', { outline: 0.012 }), 0, 0.07 * size, 0))
  tip.add(at(part(new THREE.OctahedronGeometry(0.075 * size), GOLD, { outline: 0.012 }), 0, 0.68 * size, 0))
  turn(tip, -0.18, 0, 0.12)
  hat.add(tip)
  return hat
}

/** A red collar with a golden bell; the ring lies flat around the origin. */
export function bellCollar(radius: number): THREE.Group {
  const collar = new THREE.Group()
  collar.add(turn(part(new THREE.TorusGeometry(radius, 0.055, 12, 48), WAX), Math.PI / 2, 0, 0))
  collar.add(at(part(new THREE.SphereGeometry(0.09, 20, 16), GOLD, { outline: 0.014 }), 0, -0.08, radius + 0.02))
  return collar
}

/** A bow tie, centred on the origin, facing +z. */
export function bowTie(size = 1): THREE.Group {
  const tie = new THREE.Group()
  for (const side of [-1, 1]) {
    tie.add(turn(at(part(cone(0.1 * size, 0.2 * size, 1, 0.45), WAX, { outline: 0.012 }), side * 0.1 * size, 0, 0), 0, 0, side * Math.PI / 2))
  }
  tie.add(part(new THREE.SphereGeometry(0.05 * size, 16, 12), WAX, { outline: 0.012 }))
  return tie
}

/** A knitted scarf ring with two loose ends. */
export function scarf(radius: number): THREE.Group {
  const group = new THREE.Group()
  group.add(turn(part(new THREE.TorusGeometry(radius, 0.08, 12, 48), WAX), Math.PI / 2, 0, 0))
  group.add(turn(at(part(new THREE.CapsuleGeometry(0.07, 0.3, 6, 12).scale(1, 1, 0.5), WAX), radius * 0.45, -0.22, radius * 0.8), 0.2, 0, 0.25))
  group.add(turn(at(part(new THREE.CapsuleGeometry(0.07, 0.24, 6, 12).scale(1, 1, 0.5), '#8a2019'), radius * 0.2, -0.2, radius * 0.9), 0.15, 0, -0.1))
  return group
}
