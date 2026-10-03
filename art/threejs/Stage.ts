import * as THREE from 'three'
import type { Mood, Rig } from './types'

export interface Cell {
  rig: Rig
  mood: Mood
  moodSince: number
}

/**
 * One WebGL canvas that draws one or more companions, each in its own square
 * cell (the book shows one; the lab shows a grid). Pauses when the window hides.
 */
export class Stage {
  private renderer: THREE.WebGLRenderer
  private camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50)
  private scenes = new Map<Cell, THREE.Scene>()
  private cells: Cell[] = []
  private columns = 1
  private frame = 0
  private last = 0
  private started = performance.now()

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.setScissorTest(true)
    this.camera.position.set(0, 1.75, 7.4)
    this.camera.lookAt(0, 1.38, 0)
  }

  /** Replaces what is on stage. */
  set(cells: Cell[], columns = 1): void {
    for (const cell of this.cells) if (!cells.includes(cell)) cell.rig.dispose()
    this.cells = cells
    this.columns = columns
    this.scenes.clear()
    for (const cell of cells) this.scenes.set(cell, this.sceneFor(cell.rig))
  }

  setMood(cell: Cell, mood: Mood): void {
    if (cell.mood === mood) return
    cell.mood = mood
    cell.moodSince = this.seconds()
  }

  /** Plays the current mood from its start again (a second celebration in a row). */
  replay(cell: Cell): void {
    cell.moodSince = this.seconds()
  }

  start(): void {
    if (this.frame) return
    const loop = (now: number): void => {
      this.frame = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (now - (this.last || now)) / 1000)
      this.last = now
      this.draw(dt)
    }
    this.frame = requestAnimationFrame(loop)
  }

  stop(): void {
    cancelAnimationFrame(this.frame)
    this.frame = 0
    this.last = 0
  }

  dispose(): void {
    this.stop()
    for (const cell of this.cells) cell.rig.dispose()
    this.renderer.dispose()
  }

  private seconds(): number {
    return (performance.now() - this.started) / 1000
  }

  private sceneFor(rig: Rig): THREE.Scene {
    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight('#fff3dc', '#6a4a34', 1.6))
    const key = new THREE.DirectionalLight('#fff0d8', 2.2)
    key.position.set(-2.5, 4, 4)
    scene.add(key)
    scene.add(rig.root)
    return scene
  }

  private draw(dt: number): void {
    const width = this.canvas.clientWidth
    const height = this.canvas.clientHeight
    if (!width || !height) return
    if (this.canvas.width !== Math.round(width * this.renderer.getPixelRatio())) this.renderer.setSize(width, height, false)

    const t = this.seconds()
    const rows = Math.ceil(this.cells.length / this.columns)
    const cellWidth = width / this.columns
    const cellHeight = height / rows
    this.camera.aspect = cellWidth / cellHeight
    this.camera.updateProjectionMatrix()

    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setScissor(0, 0, width, height)
    this.renderer.clear()

    this.cells.forEach((cell, i) => {
      cell.rig.animate(cell.mood, t, t - cell.moodSince, dt)
      const x = (i % this.columns) * cellWidth
      const y = height - (Math.floor(i / this.columns) + 1) * cellHeight
      this.renderer.setViewport(x, y, cellWidth, cellHeight)
      this.renderer.setScissor(x, y, cellWidth, cellHeight)
      this.renderer.render(this.scenes.get(cell)!, this.camera)
    })
  }
}
