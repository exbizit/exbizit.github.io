// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CUBEFIELD — an endless dodge-the-cubes runner where every cube is an album
// cover pulled off the Listening page.
//
// Mechanics (steer, speed ramp, recycle-cubes-behind-camera, box collision)
// are adapted from Christopher Hayes' "cubefield" (MIT licensed):
//   https://github.com/Christopher-Hayes/cubefield
// This isn't a line-for-line port — the coordinate scale, controls, textures,
// and game loop are rewritten from scratch for this site — but the shape of
// the game (and the name) is his.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import * as THREE from 'three'
import { playCrashSound } from './crashSound'

export interface CubefieldCover {
  url: string
  artist: string
  album: string
  track?: string
  previewUrl?: string | null
  /** +1s from the Listening page. More votes, a (capped) bigger cube. */
  likeCount?: number
}

export type CubefieldState = 'idle' | 'playing' | 'gameover'

export interface CubefieldCallbacks {
  onScore?: (seconds: number) => void
  onGameOver?: (info: {
    seconds: number
    artist: string
    album: string
    track?: string
    coverUrl: string
    previewUrl?: string | null
  }) => void
  onStateChange?: (state: CubefieldState) => void
}

const NUM_CUBES = 110
const LANE_HALF_WIDTH = 13
const CUBE_SIZE = 1.15
const SHIP_HALF_WIDTH = 0.5
const SPAWN_MIN = 22
const SPAWN_SPREAD = 130
const BASE_SPEED = 9
const MAX_SPEED_BONUS = 16
const SPEED_RAMP_PER_SEC = 0.16
const STEER_MAX = 17
const STEER_EASE = 8 // how fast steerVel closes on its target, per second
const IDLE_DRIFT_SPEED = 3.2
const TILT_MAX_DEG = 20   // phone tilt (degrees) that maps to full steering
const TILT_DEADZONE = 0.06
const LIKE_SCALE_STEP = 0.15 // size added per doubling of +1s
const LIKE_SCALE_MAX = 1.9   // cap — a popular album is a bigger target, not an unfair wall

/** 0 likes -> 1x. Grows with log2(likes), capped so a viral album stays dodgeable. */
function scaleForLikes(likeCount = 0): number {
  return Math.min(LIKE_SCALE_MAX, 1 + Math.log2(likeCount + 1) * LIKE_SCALE_STEP)
}

class Cube {
  mesh: THREE.Mesh
  cover: CubefieldCover

  constructor(scene: THREE.Scene, cover: CubefieldCover, material: THREE.Material) {
    this.cover = cover
    const geo = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)
    this.mesh = new THREE.Mesh(geo, material)
    this.applyScale() // also sets position.y so the (now-sized) cube rests on the ground
    this.mesh.position.x = randX(0)
    this.mesh.position.z = -(SPAWN_MIN + Math.random() * SPAWN_SPREAD)
    scene.add(this.mesh)
  }

  /** Sizes the mesh for its current cover's vote count and keeps it grounded. */
  private applyScale() {
    const scale = scaleForLikes(this.cover.likeCount)
    this.mesh.scale.setScalar(scale)
    this.mesh.position.y = (CUBE_SIZE * scale) / 2
  }

  // originX is the ship's *current* X, not a fixed lane centre — so however
  // hard the player is zigzagging, freshly-recycled cubes always land near
  // wherever the ship actually is, not near where it started. (The original
  // cubefield centred cube-X on the ship too, but only on the *first* pass —
  // this project's spawn pool is smaller, so it's worth double-checking here
  // rather than assuming a fixed lane stays populated.)
  resetPosition(originX: number, originZ: number) {
    this.mesh.position.x = randX(originX)
    this.mesh.position.z = originZ - (SPAWN_MIN + Math.random() * SPAWN_SPREAD)
  }

  setCover(cover: CubefieldCover, material: THREE.Material) {
    this.cover = cover
    this.mesh.material = material
    this.applyScale()
  }

  dispose() {
    this.mesh.geometry.dispose()
  }
}

function randX(center: number) {
  return center + (Math.random() * LANE_HALF_WIDTH * 2 - LANE_HALF_WIDTH)
}

export class CubefieldGame {
  private container: HTMLElement
  private covers: CubefieldCover[]
  private callbacks: CubefieldCallbacks

  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private clock = new THREE.Clock()
  private resizeObserver: ResizeObserver

  private ship: THREE.Group
  private shipBody!: THREE.Mesh
  private shipEdges!: THREE.LineSegments
  private shipLogo!: THREE.Mesh
  private shipLogoMaterial!: THREE.MeshBasicMaterial
  private ground: THREE.Group
  private cubes: Cube[] = []
  private materials = new Map<string, THREE.Material>()
  private fallbackMaterial: THREE.MeshBasicMaterial
  private loader = new THREE.TextureLoader()

  private state: CubefieldState = 'idle'
  private shipX = 0
  private shipZ = 0
  private steerVel = 0
  private steerInput = 0 // keyboard/touch: -1, 0, 1
  private tiltAxis = 0   // accelerometer: continuous, -1..1
  private useTilt = false
  private elapsed = 0
  private lastScoreEmit = 0
  private rafId = 0
  private disposed = false

  constructor(container: HTMLElement, covers: CubefieldCover[], callbacks: CubefieldCallbacks = {}) {
    this.container = container
    this.covers = covers.length > 0 ? covers : [{ url: '', artist: 'Unknown', album: 'Unknown' }]
    this.callbacks = callbacks

    const { clientWidth: w, clientHeight: h } = container
    this.camera = new THREE.PerspectiveCamera(55, w / Math.max(h, 1), 0.1, 300)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(w, h)
    container.appendChild(this.renderer.domElement)

    this.scene.fog = new THREE.Fog(0x000000, 18, 70)

    this.fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0x242424 })

    this.ground = this.buildGround()
    this.scene.add(this.ground)

    this.ship = this.buildShip()
    this.scene.add(this.ship)

    for (let i = 0; i < NUM_CUBES; i++) {
      const cover = this.covers[i % this.covers.length]
      this.cubes.push(new Cube(this.scene, cover, this.materialFor(cover)))
    }

    this.setCamera()

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('pointercancel', this.onPointerUp)

    this.animate()
  }

  // ── setup ──────────────────────────────────────────────────────────────

  private buildGround(): THREE.Group {
    const group = new THREE.Group()

    const geo = new THREE.PlaneGeometry(4000, 4000)
    const mat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
    const plane = new THREE.Mesh(geo, mat)
    plane.rotation.x = -Math.PI / 2
    group.add(plane)

    // GridHelper already lies flat in the X-Z plane, so it's a sibling of
    // `plane` here, not a child — nesting it under the rotated plane would
    // rotate it a second time and stand it up on its edge.
    const grid = new THREE.GridHelper(4000, 400, 0x2a2a2a, 0x161616)
    grid.position.y = 0.01
    group.add(grid)

    return group
  }

  private buildShip(): THREE.Group {
    const group = new THREE.Group()
    const geo = new THREE.ConeGeometry(0.42, 1.1, 3)
    geo.rotateX(Math.PI / 2)
    geo.rotateZ(Math.PI)
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    this.shipBody = new THREE.Mesh(geo, mat)
    this.shipEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x000000 })
    )

    // The logo "character": a flat, transparent-PNG card standing in for the
    // default triangle. Pre-rotated 180° around Y so it reads right-way-round
    // once the ship group's own runtime Math.PI flip (see tickPlaying) is
    // applied — same reason the cone geometry above is pre-rotated.
    this.shipLogoMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    })
    this.shipLogo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.shipLogoMaterial)
    this.shipLogo.rotation.y = Math.PI
    this.shipLogo.visible = false

    group.add(this.shipBody, this.shipEdges, this.shipLogo)
    group.position.y = CUBE_SIZE / 2
    return group
  }

  /** Swaps the default triangle for a band logo, or back to the triangle on null. */
  setPlayerLogo(url: string | null) {
    if (!url) {
      this.shipBody.visible = true
      this.shipEdges.visible = true
      this.shipLogo.visible = false
      return
    }
    this.shipBody.visible = false
    this.shipEdges.visible = false
    this.shipLogo.visible = true
    this.loader.load(url, texture => {
      texture.colorSpace = THREE.SRGBColorSpace
      this.shipLogoMaterial.map = texture
      this.shipLogoMaterial.needsUpdate = true
      const { width, height } = texture.image as { width: number; height: number }
      const targetHeight = 1.15
      const aspect = width && height ? width / height : 1
      this.shipLogo.scale.set(targetHeight * aspect, targetHeight, 1)
      this.shipLogo.position.y = targetHeight / 2 - CUBE_SIZE / 2 // sit on the ground, not centred on it
    })
  }

  private materialFor(cover: CubefieldCover): THREE.Material {
    if (!cover.url) return this.fallbackMaterial
    const existing = this.materials.get(cover.url)
    if (existing) return existing
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff })
    this.materials.set(cover.url, material)
    this.loader.load(
      cover.url,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace
        material.map = texture
        material.color.set(0xffffff)
        material.needsUpdate = true
      },
      undefined,
      () => {
        material.map = null
        material.color.set(0x242424)
        material.needsUpdate = true
      }
    )
    return material
  }

  private randomCover(): CubefieldCover {
    return this.covers[Math.floor(Math.random() * this.covers.length)]
  }

  private setCamera() {
    this.camera.position.set(this.shipX, 3, this.shipZ + 6)
    this.camera.lookAt(this.shipX, 0.6, this.shipZ - 10)
  }

  // ── controls ───────────────────────────────────────────────────────────

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.steerInput = -1
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.steerInput = 1
    else if (e.key === ' ' || e.key === 'Enter') {
      if (this.state !== 'playing') this.start()
    }
  }

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      if (this.steerInput === -1) this.steerInput = 0
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      if (this.steerInput === 1) this.steerInput = 0
    }
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.state !== 'playing') {
      this.start()
      return
    }
    // Tilt owns steering once it's active — a stray tap shouldn't fight it.
    if (this.useTilt) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.steerInput = e.clientX - rect.left < rect.width / 2 ? -1 : 1
  }

  private onPointerUp = () => {
    this.steerInput = 0
  }

  private onDeviceOrientation = (e: DeviceOrientationEvent) => {
    // gamma: left/right tilt in degrees, ~-90..90, 0 = flat/upright.
    const gamma = e.gamma ?? 0
    const norm = Math.max(-1, Math.min(1, gamma / TILT_MAX_DEG))
    this.tiltAxis = Math.abs(norm) < TILT_DEADZONE ? 0 : norm
  }

  /**
   * Switches steering to the accelerometer. Must be called from inside a
   * user-gesture handler (e.g. the Start button's onClick) — iOS only grants
   * motion access when `requestPermission()` runs synchronously off a tap.
   * Resolves false (and leaves touch/keyboard steering in place) if the
   * device has no orientation sensor or the visitor declines the prompt.
   */
  async enableTilt(): Promise<boolean> {
    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    if (typeof DeviceOrientation === 'undefined') return false
    if (typeof DeviceOrientation.requestPermission === 'function') {
      try {
        const result = await DeviceOrientation.requestPermission()
        if (result !== 'granted') return false
      } catch {
        return false
      }
    }
    window.addEventListener('deviceorientation', this.onDeviceOrientation)
    this.useTilt = true
    return true
  }

  // ── lifecycle ──────────────────────────────────────────────────────────

  start() {
    this.shipX = 0
    this.shipZ = 0
    this.steerVel = 0
    this.steerInput = 0
    this.elapsed = 0
    this.lastScoreEmit = 0
    for (const cube of this.cubes) {
      cube.resetPosition(0, 0)
      const cover = this.randomCover()
      cube.setCover(cover, this.materialFor(cover))
    }
    this.setState('playing')
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.rafId)
    this.resizeObserver.disconnect()
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('pointercancel', this.onPointerUp)
    if (this.useTilt) window.removeEventListener('deviceorientation', this.onDeviceOrientation)
    for (const cube of this.cubes) cube.dispose()
    for (const mat of this.materials.values()) {
      const map = (mat as THREE.MeshBasicMaterial).map
      map?.dispose()
      mat.dispose()
    }
    this.fallbackMaterial.dispose()
    this.shipBody.geometry.dispose()
    ;(this.shipBody.material as THREE.Material).dispose()
    this.shipEdges.geometry.dispose()
    ;(this.shipEdges.material as THREE.Material).dispose()
    this.shipLogo.geometry.dispose()
    this.shipLogoMaterial.map?.dispose()
    this.shipLogoMaterial.dispose()
    for (const child of this.ground.children) {
      const obj = child as THREE.Mesh | THREE.LineSegments
      obj.geometry.dispose()
      const mat = obj.material
      if (Array.isArray(mat)) mat.forEach(m => m.dispose())
      else mat.dispose()
    }
    this.renderer.dispose()
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.container
    if (w === 0 || h === 0) return
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private setState(next: CubefieldState) {
    this.state = next
    this.callbacks.onStateChange?.(next)
  }

  // ── loop ───────────────────────────────────────────────────────────────

  private animate = () => {
    if (this.disposed) return
    this.rafId = requestAnimationFrame(this.animate)
    const dt = Math.min(this.clock.getDelta(), 0.1)

    if (this.state === 'playing') this.tickPlaying(dt)
    else this.tickIdle(dt)

    this.renderer.render(this.scene, this.camera)
  }

  private tickIdle(dt: number) {
    this.shipZ -= IDLE_DRIFT_SPEED * dt
    for (const cube of this.cubes) this.recycleIfPassed(cube)
    this.setCamera()
  }

  private tickPlaying(dt: number) {
    this.elapsed += dt

    // Steering: ease steerVel toward a target velocity. Keyboard/touch give
    // a digital -1/0/1 axis (so the target is always full-tilt or zero);
    // the accelerometer gives a continuous -1..1 axis, so a shallow tilt
    // eases toward a proportionally gentler turn instead of snapping to max.
    const axis = this.useTilt ? this.tiltAxis : this.steerInput
    const targetVel = axis * STEER_MAX
    this.steerVel += (targetVel - this.steerVel) * Math.min(1, STEER_EASE * dt)
    this.shipX += this.steerVel * dt
    this.shipX = Math.max(-LANE_HALF_WIDTH, Math.min(LANE_HALF_WIDTH, this.shipX))

    const speed = BASE_SPEED + Math.min(MAX_SPEED_BONUS, this.elapsed * SPEED_RAMP_PER_SEC)
    this.shipZ -= speed * dt

    this.ship.position.x = this.shipX
    this.ship.position.z = this.shipZ
    this.ship.rotation.z = -this.steerVel * 0.05
    this.ship.rotation.y = Math.PI

    this.setCamera()
    this.camera.position.x += (this.steerVel / STEER_MAX) * -0.6
    this.camera.rotation.z = (-this.steerVel / STEER_MAX) * 0.05

    for (const cube of this.cubes) {
      // A liked-up cube is rendered bigger, so it hits bigger too — otherwise
      // a visually huge cube would feel like it should've been a crash and
      // wasn't.
      const cubeSize = CUBE_SIZE * cube.mesh.scale.x
      const hit =
        Math.abs(cube.mesh.position.x - this.shipX) < (cubeSize + SHIP_HALF_WIDTH) / 2 &&
        Math.abs(cube.mesh.position.z - this.shipZ) < cubeSize * 0.6
      if (hit) {
        this.crash(cube.cover)
        return
      }
      cube.mesh.rotation.y += dt * 0.4
      this.recycleIfPassed(cube)
    }

    const now = Math.floor(this.elapsed * 10) / 10
    if (now !== this.lastScoreEmit) {
      this.lastScoreEmit = now
      this.callbacks.onScore?.(now)
    }
  }

  private recycleIfPassed(cube: Cube) {
    if (cube.mesh.position.z > this.shipZ + 4) {
      cube.resetPosition(this.shipX, this.shipZ)
      const cover = this.randomCover()
      cube.setCover(cover, this.materialFor(cover))
    }
  }

  private crash(cover: CubefieldCover) {
    playCrashSound()
    this.setState('gameover')
    this.callbacks.onGameOver?.({
      seconds: Math.round(this.elapsed * 10) / 10,
      artist: cover.artist,
      album: cover.album,
      track: cover.track,
      coverUrl: cover.url,
      previewUrl: cover.previewUrl,
    })
  }
}
