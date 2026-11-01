import { useEffect, useRef } from 'react'

export type Scene = 'blackhole' | 'space'

export const SCENE_META: Record<Scene, { label: string; icon: string; hint?: string }> = {
  blackhole: { label: 'Black hole mode', icon: 'fa-solid fa-circle-dot', hint: 'Stir the disk with your cursor' },
  space: { label: 'Space exploration mode', icon: 'fa-solid fa-rocket' },
}

interface Renderer {
  resize(w: number, h: number): void
  frame(t: number): void
  /** Viewport-space pointer position, or null when the pointer leaves */
  pointer?(p: { x: number; y: number } | null): void
}

interface CosmicBackgroundProps {
  scene: Scene | null
  onExit: () => void
}

/**
 * Full-viewport animated canvas behind the page, toggled from the Interests chips.
 * Draws with plain 2D canvas (no per-frame layout work) and renders a single static
 * frame when the user prefers reduced motion.
 */
export default function CosmicBackground({ scene, onExit }: CosmicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const root = document.documentElement
    if (!scene) {
      root.removeAttribute('data-scene')
      return
    }
    root.setAttribute('data-scene', scene)

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const renderer = scene === 'blackhole' ? blackHole(ctx) : spaceExploration(ctx)
    let raf = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      renderer.resize(w, h)
      if (reduce) renderer.frame(0)
    }
    resize()
    window.addEventListener('resize', resize)

    if (!reduce) {
      const start = performance.now()
      const loop = (now: number) => {
        renderer.frame((now - start) / 1000)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    // The canvas sits under the page (pointer-events: none), so listen on window
    const onMove = (e: PointerEvent) => renderer.pointer?.({ x: e.clientX, y: e.clientY })
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget || e.pointerType === 'touch') renderer.pointer?.(null)
    }
    if (!reduce && renderer.pointer) {
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerout', onLeave)
      window.addEventListener('pointerup', onLeave)
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onLeave)
      window.removeEventListener('pointerup', onLeave)
      window.removeEventListener('keydown', onKey)
      root.removeAttribute('data-scene')
    }
  }, [scene, onExit])

  if (!scene) return null
  const meta = SCENE_META[scene]

  return (
    <>
      <canvas key={scene} ref={canvasRef} className="cosmic-bg" aria-hidden="true" />
      <div className="scene-pill" role="status">
        <i className={meta.icon} />
        <span>{meta.label}</span>
        {meta.hint && <span className="scene-hint">· {meta.hint}</span>}
        <button onClick={onExit} aria-label={`Exit ${meta.label.toLowerCase()}`}>
          Exit <i className="fa-solid fa-xmark" />
        </button>
      </div>
    </>
  )
}

/* ---------- Black hole: lensed disk, cursor stirring, tidal disruption of passing planets ---------- */

type RGB = [number, number, number]

const TAU = Math.PI * 2
const DISK_TILT = 0.2 // vertical squash of the disk — we view it almost edge-on
const DISK_ROLL = -0.1 // slight clockwise roll so it doesn't look perfectly flat
// Disk radii, in multiples of the shadow radius. The inner edge sits close to the shadow, as
// in Interstellar — a wider gap shows up as a dark, pointed "eye" once the far side is lensed.
const DISK_INNER = 1.25
const DISK_SPAN = 4.1
const DISK_SPIN = 1.15 // rad/s at the inner edge; outer material is slower (Kepler)
const LENS_RADIUS = 1.3 // Einstein radius (× R) for light from far behind the hole
const LENS_DEPTH = 3 // (× R) how far behind the hole a source must be for the full Einstein radius
const FALL_ZONE = 2.2 // disturbed inside this radius (× R) → always spirals in
const ESCAPE_ZONE = 3.8 // disturbed beyond this radius → always flung out; mixed in between
const CURSOR_RADIUS = 90 // screen px around the cursor that stirs the disk
const ESCAPE_FADE = 4 // seconds for a flung particle to fade out
const HORIZON_FADE = 1.4 // (× R) infalling matter dims and slows from here down to the horizon

// A visiting planet's tidal disruption, modelled on how black holes shred stars: in one close
// pass the side facing the hole is pulled into a tail that wraps around it and settles into a
// ring, the far side is flung away, and as the ring falls in the hole flares and fires jets
const PERICENTER = 2.4 // (× R) the planet's closest approach
const TIDAL = 5 // (× R) inside this, tides pull it apart
const STREAM_STEP = 0.04 // seconds between points laid down along each debris stream
const STREAM_FADE = 5 // seconds for flung-away material to fade out
const FLARE_DECAY = 6 // seconds for the feeding flare to fade by a factor e
const HOT: RGB = [240, 225, 255] // debris heats toward this as it nears the hole
const PLANETS: { light: string; mid: string; dark: string; stuff: RGB; debris: RGB[] }[] = [
  { light: '#c4ebff', mid: '#3a8fd8', dark: '#0b2552', stuff: [70, 150, 220], debris: [[120, 190, 255], [90, 220, 200], [230, 240, 255]] },
  { light: '#ffdcb5', mid: '#c8703a', dark: '#3a1708', stuff: [215, 125, 65], debris: [[255, 170, 110], [210, 120, 70], [255, 220, 180]] },
  { light: '#dcffd4', mid: '#3fa86a', dark: '#0d3320', stuff: [75, 175, 110], debris: [[140, 230, 160], [90, 180, 255], [240, 255, 240]] },
]

// white-lavender at the inner edge → violet → deep purple outward
const DISK_STOPS: RGB[] = [
  [245, 235, 255],
  [190, 130, 255],
  [110, 50, 210],
]
const mix = (a: RGB, b: RGB, k: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`
const diskColor = (u: number) =>
  u < 0.5 ? mix(DISK_STOPS[0], DISK_STOPS[1], u * 2) : mix(DISK_STOPS[1], DISK_STOPS[2], u * 2 - 1)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

// Anything moving freely around the hole, in orbital-plane coordinates (z = depth, + toward viewer)
interface Body {
  x: number
  z: number
  vx: number
  vz: number
}

interface DiskParticle extends Body {
  u: number // radial position across the disk while orbiting (0 = inner edge, 1 = outer)
  angle: number // orbital phase while orbiting
  size: number
  jitter: number
  accent: string | null // a few pink/blue particles for variety
  color: string
  mode: 'orbit' | 'fall' | 'escape'
  since: number // time of the last spawn or disturbance
  sx: number // lensed screen position, refreshed every step
  sy: number
  k: number // how strongly it is lensed (0 = near side, 1 = far side)
}

interface StreamPoint extends Body {
  born: number
  drag: number
}

// A ribbon of planet material: points in the order they were torn off (oldest first). While the
// planet survives, the newest end stays attached to it.
interface Stream {
  points: StreamPoint[]
  bound: boolean // bound material wraps round and falls in; unbound material escapes
  rgb: RGB
  width: number // screen px at the newest end
}

interface Planet extends Body {
  mass: number // 1 = intact; the remnant puffs apart at the end
  look: (typeof PLANETS)[number]
  size: number
  lastLaid: number
  tail: Stream | null // pulled toward the hole
  wake: Stream | null // flung away from it
}

interface Debris extends Body {
  rgb: RGB
  size: number
  born: number
  life: number // seconds until it has faded out; Infinity = lives until it falls in
  damp: number // radial damping
  drag: number // tangential drag
  lift: number // screen offset perpendicular to the disk, for material thrown above or below it
  vlift: number
}

function blackHole(ctx: CanvasRenderingContext2D): Renderer {
  let w = 0
  let h = 0
  let cx = 0
  let cy = 0
  let R = 0 // shadow radius
  let GM = 0 // gravity strength, chosen so the inner disk edge orbits at DISK_SPIN
  let last = 0
  let nebula: HTMLCanvasElement | null = null
  let farGlow: HTMLCanvasElement | null = null // pre-rendered, lensed glow of the far half of the disk
  const farGlowOrigin = { x: 0, y: 0 } // where the hole sits inside farGlow
  let stars: { x: number; y: number; r: number; a: number; tw: number }[] = []
  // cursor in the disk's screen frame (centred, un-rolled)
  let cursor: { x: number; y: number } | null = null
  let cursorPrev: { x: number; y: number; time: number } | null = null
  let cursorSpeed = 0
  let planet: Planet | null = null
  let nextPlanet = 6
  let streams: Stream[] = []
  let debris: Debris[] = []
  let cloud: (Body & { born: number; rgb: RGB; size: number }) | null = null // the remnant's puff
  let flare = 0 // 0–1: how hard the hole is feeding right now

  const disk: DiskParticle[] = Array.from({ length: 2400 }, () => {
    const roll = Math.random()
    const u = Math.pow(Math.random(), 1.4)
    const accent = roll < 0.1 ? 'rgb(255,130,225)' : roll < 0.16 ? 'rgb(150,190,255)' : null
    return {
      u,
      angle: Math.random() * TAU,
      size: 0.8 + Math.random() * 1.4,
      jitter: Math.random() - 0.5,
      accent,
      color: accent ?? diskColor(u),
      mode: 'orbit',
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      since: -10,
      sx: 0,
      sy: 0,
      k: 0,
    }
  })

  const radius = (u: number) => R * (DISK_INNER + u * DISK_SPAN)
  const horizonFade = (r: number) => {
    const k = clamp01((r - R * 1.02) / (R * (HORIZON_FADE - 1.02)))
    return k * k * (3 - 2 * k)
  }

  // Where a point in an orbital plane appears on screen. Light from behind the hole is bent
  // around it (point-lens equation θ = (β + √(β² + 4θE²)) / 2), which lifts the far side of
  // the disk into the arch over the shadow — the Interstellar look. The near side is unbent.
  // The Einstein radius grows with the source's depth behind the hole (θE² ∝ depth), so the
  // sides of the disk, barely behind it, stay put while the far middle rises over the top.
  const pt = { x: 0, y: 0, k: 0 } // reused output, so the hot loop allocates nothing
  function lens(x: number, z: number, tilt: number) {
    const px = x
    const py = z * tilt
    // k: depth behind the hole as a fraction of LENS_DEPTH — 0 at the midline and in front, so
    // the lensed far half meets the unlensed near half without a seam
    const k = clamp01(-z / (LENS_DEPTH * R))
    let scale = 1
    if (k > 0) {
      const d = Math.hypot(px, py) || 1e-3
      const E2 = (LENS_RADIUS * R) ** 2 * k
      scale = (d + Math.sqrt(d * d + 4 * E2)) / (2 * d)
    }
    pt.x = px * scale
    pt.y = py * scale
    pt.k = k
    return pt
  }

  // Gravity plus optional damping of the radial and tangential velocity; returns the radius
  function fly(b: Body, dt: number, radialDamp = 0, drag = 0) {
    const r = Math.hypot(b.x, b.z)
    const nx = b.x / r
    const nz = b.z / r
    const g = GM / (r * r)
    b.vx -= g * nx * dt
    b.vz -= g * nz * dt
    if (radialDamp || drag) {
      const vr = b.vx * nx + b.vz * nz
      const kr = Math.exp(-radialDamp * dt)
      const kt = Math.exp(-drag * dt)
      b.vx = vr * kr * nx + (b.vx - vr * nx) * kt
      b.vz = vr * kr * nz + (b.vz - vr * nz) * kt
    }
    b.x += b.vx * dt
    b.z += b.vz * dt
    return r
  }

  // Lost particles fade back in somewhere in the disk, so it never empties
  function respawn(p: DiskParticle, t: number) {
    p.mode = 'orbit'
    p.u = Math.pow(Math.random(), 1.4)
    p.angle = Math.random() * TAU
    p.color = p.accent ?? diskColor(p.u)
    p.since = t
  }

  // Knock an orbiting particle loose. Close to the hole it loses its orbit and spirals in;
  // farther out it gets enough speed to escape. In between it could go either way.
  function disturb(p: DiskParticle, r: number, t: number) {
    const c = Math.cos(p.angle)
    const s = Math.sin(p.angle)
    p.x = r * c
    p.z = r * s
    const vc = Math.sqrt(GM / r) // circular orbit speed
    let ax = p.x - cursor!.x
    let az = p.z - cursor!.y / DISK_TILT
    const len = Math.hypot(ax, az) || 1
    ax /= len
    az /= len
    const push = 60 + Math.min(cursorSpeed, 900) * 0.15
    const fallChance = clamp01((ESCAPE_ZONE * R - r) / ((ESCAPE_ZONE - FALL_ZONE) * R))
    // (-s, c) is the orbital direction, (c, s) points away from the hole
    if (Math.random() < fallChance) {
      p.mode = 'fall'
      p.vx = -s * vc * 0.6 - c * vc * 0.5 + ax * push * 0.4
      p.vz = c * vc * 0.6 - s * vc * 0.5 + az * push * 0.4
    } else {
      p.mode = 'escape'
      p.vx = -s * vc * 1.5 + c * vc * 0.6 + ax * push
      p.vz = c * vc * 1.5 + s * vc * 0.6 + az * push
    }
    p.since = t
  }

  function stepDisk(p: DiskParticle, dt: number, t: number) {
    if (p.mode === 'orbit') {
      const r = radius(p.u)
      p.angle += dt * Math.sqrt(GM / (r * r * r))
      lens(r * Math.cos(p.angle), r * Math.sin(p.angle) + p.jitter * R * 0.25, DISK_TILT)
      p.sx = pt.x
      p.sy = pt.y
      p.k = pt.k
      if (!cursor || dt === 0) return
      const d = Math.hypot(p.sx - cursor.x, p.sy - cursor.y)
      if (d >= CURSOR_RADIUS) return
      const strength = (1 - d / CURSOR_RADIUS) ** 2 * (0.5 + Math.min(cursorSpeed / 600, 1.5))
      if (Math.random() < strength * dt * 10) disturb(p, r, t)
      return
    }

    if (p.mode === 'fall') {
      // time slows near the horizon: the particle crawls and dims rather than vanishing at once
      const slow = 0.25 + 0.75 * horizonFade(Math.hypot(p.x, p.z))
      // shedding angular momentum (tangential drag) turns the orbit into an inward spiral
      if (fly(p, dt * slow, 0, 2.5) < R * 1.02) return respawn(p, t)
    } else {
      fly(p, dt)
      const offscreen = Math.abs(p.x) > w * 0.6 + 40 || Math.abs(p.z * DISK_TILT) > h * 0.6 + 40
      if (offscreen || t - p.since > ESCAPE_FADE) return respawn(p, t)
    }
    lens(p.x, p.z, DISK_TILT)
    p.sx = pt.x
    p.sy = pt.y
    p.k = pt.k
  }

  // A planet drifts in from the side on a near-parabolic path that dips inside the tidal radius,
  // going round the same way as the disk and in its plane
  function spawnPlanet(t: number) {
    const side = Math.random() < 0.5 ? -1 : 1
    const x = side * (w / 2 + 40)
    const z = ((Math.random() - 0.5) * h * 0.5) / DISK_TILT
    const d = Math.hypot(x, z)
    const speed = 0.97 * Math.sqrt((2 * GM) / d)
    // aim so its angular momentum, √(2·GM·r_p), brings it to PERICENTER — on the prograde side
    const offset = Math.asin(Math.min(0.95, Math.sqrt(2 * GM * PERICENTER * R) / (d * speed)))
    const toHole = Math.atan2(-z, -x)
    const dir = [toHole + offset, toHole - offset].find((a) => x * Math.sin(a) - z * Math.cos(a) > 0)!
    planet = {
      x,
      z,
      vx: Math.cos(dir) * speed,
      vz: Math.sin(dir) * speed,
      mass: 1,
      look: PLANETS[Math.floor(Math.random() * PLANETS.length)],
      size: R * 0.32,
      lastLaid: t,
      tail: null,
      wake: null,
    }
  }

  const planetSize = (pl: Planet) => pl.size * (0.45 + 0.55 * Math.sqrt(Math.max(0, pl.mass)))
  const heatOf = (r: number) => clamp01((1.8 * R - r) / (0.8 * R)) // 0 = planet colour, 1 = white-hot
  const stripOf = (r: number) => clamp01((TIDAL * R - r) / ((TIDAL - PERICENTER) * R))

  // Lay a point on each stream. The side facing the hole is pulled off toward it — slightly
  // slower than the planet and with an inward kick — so it's bound, runs ahead on a tighter
  // orbit and wraps around the hole. The far side leaves a little faster and escapes.
  function layStreams(pl: Planet, r: number, strip: number, t: number) {
    const nx = pl.x / r
    const nz = pl.z / r
    const s = planetSize(pl) * 0.8
    const slow = 1 - (0.04 + 0.04 * strip)
    const fast = 1 + (0.06 + 0.12 * strip)
    const kick = (0.4 + 0.3 * strip) * Math.hypot(pl.vx, pl.vz)
    pl.tail!.points.push({
      x: pl.x - nx * s,
      z: pl.z - nz * s,
      vx: pl.vx * slow - nx * kick,
      vz: pl.vz * slow - nz * kick,
      born: t,
      drag: 0.03 + 0.015 * strip,
    })
    pl.wake!.points.push({ x: pl.x + nx * s, z: pl.z + nz * s, vx: pl.vx * fast, vz: pl.vz * fast, born: t, drag: 0 })
    // loose dust along both streams gives them ragged, torn edges
    for (let i = 0; i < 2; i++) {
      const bound = i === 0
      const off = bound ? -s : s
      const j = (Math.random() - 0.5) * s * 1.6
      const k = bound ? slow - Math.random() * 0.05 : fast + Math.random() * 0.08
      debris.push({
        x: pl.x + nx * off - nz * j,
        z: pl.z + nz * off + nx * j,
        vx: pl.vx * k - (bound ? nx * kick : 0),
        vz: pl.vz * k - (bound ? nz * kick : 0),
        rgb: pl.look.debris[Math.floor(Math.random() * pl.look.debris.length)],
        size: 0.8 + Math.random(),
        born: t,
        life: bound ? Infinity : STREAM_FADE * 0.8,
        damp: bound ? 0.6 : 0,
        drag: bound ? 0.03 + Math.random() * 0.02 : 0,
        lift: 0,
        vlift: (Math.random() - 0.5) * 12,
      })
    }
  }

  // What's left of the planet puffs apart into a cloud that expands as it drifts off
  function burst(pl: Planet, t: number) {
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * TAU
      const s = 30 + Math.random() * 90
      debris.push({
        x: pl.x,
        z: pl.z,
        vx: pl.vx * 1.05 + Math.cos(a) * s,
        vz: pl.vz * 1.05 + Math.sin(a) * s,
        rgb: pl.look.debris[i % pl.look.debris.length],
        size: 1.4 + Math.random() * 2,
        born: t,
        life: 3 + Math.random() * 1.5,
        damp: 0,
        drag: 0,
        lift: 0,
        vlift: (Math.random() - 0.5) * 90,
      })
    }
    cloud = { x: pl.x, z: pl.z, vx: pl.vx * 1.05, vz: pl.vz * 1.05, born: t, rgb: pl.look.debris[0], size: planetSize(pl) }
  }

  function stepPlanet(pl: Planet, dt: number, t: number) {
    fly(pl, dt)
    const r = Math.hypot(pl.x, pl.z)
    if (r < TIDAL * R && pl.mass > 0) {
      // tides strengthen toward pericenter, so material peels off faster the closer it gets
      const strip = stripOf(r)
      pl.mass -= dt * (0.03 + 0.18 * strip) // about 6 s from first tear to the end
      if (!pl.tail || !pl.wake) {
        pl.tail = { points: [], bound: true, rgb: pl.look.stuff, width: 0 }
        pl.wake = { points: [], bound: false, rgb: pl.look.debris[1], width: 0 }
        streams.push(pl.tail, pl.wake)
      }
      // the ribbons stay as thick as the planet where they leave it — a teardrop with a tail
      pl.tail.width = planetSize(pl) * 1.5
      pl.wake.width = planetSize(pl) * 0.9
      if (t - pl.lastLaid >= STREAM_STEP) {
        pl.lastLaid = t
        layStreams(pl, r, strip, t)
      }
    }
    const leaving = pl.x * pl.vx + pl.z * pl.vz > 0 && r > TIDAL * R
    if (pl.tail && (pl.mass < 0.12 || leaving)) {
      burst(pl, t)
      planet = null
      nextPlanet = t + 55 + Math.random() * 30
    } else if (r > Math.max(w, h) * 1.6) {
      planet = null
      nextPlanet = t + 20
    }
  }

  function stepStreams(dt: number, t: number) {
    for (const st of streams) {
      const pts = st.points
      if (st.bound) {
        let eaten = -1
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i]
          const slow = 0.25 + 0.75 * horizonFade(Math.hypot(p.x, p.z))
          // radial damping circularizes the loop into a ring; drag slowly spirals it inward
          if (fly(p, dt * slow, 0.6, p.drag) < R * 1.02) eaten = i
        }
        // swallowed from the head: drop everything up to the newest point that crossed
        if (eaten >= 0) {
          pts.splice(0, eaten + 1)
          flare = Math.min(1, flare + 0.025 * (eaten + 1))
        }
      } else {
        for (const p of pts) fly(p, dt)
        while (pts.length && t - pts[0].born > STREAM_FADE) pts.shift()
      }
      // cut loose from the planet, a stream slowly thins out
      if (!planet || (planet.tail !== st && planet.wake !== st)) st.width = Math.max(R * 0.05, st.width * Math.exp(-dt / 5))
    }
    streams = streams.filter((s) => s.points.length > 1 || (planet !== null && (planet.tail === s || planet.wake === s)))
  }

  function stepDebris(dt: number, t: number) {
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i]
      const slow = d.life === Infinity ? 0.25 + 0.75 * horizonFade(Math.hypot(d.x, d.z)) : 1
      const r = fly(d, dt * slow, d.damp, d.drag)
      d.lift += d.vlift * dt
      const fellIn = r < R * 1.02
      if (fellIn || t - d.born > d.life) {
        if (fellIn && d.life === Infinity) flare = Math.min(1, flare + 0.004)
        debris[i] = debris[debris.length - 1]
        debris.pop()
      }
    }
    if (cloud) {
      cloud.x += cloud.vx * dt
      cloud.z += cloud.vz * dt
      if (t - cloud.born > 3.5) cloud = null
    }
  }

  // While the hole feeds it blows a hot wind off the disk, above and below it
  function blowWind(dt: number, t: number) {
    const count = Math.floor(flare * 70 * dt + Math.random())
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU
      const r = R * (1.8 + Math.random() * 2.2)
      const s = 90 + Math.random() * 90
      debris.push({
        x: r * Math.cos(a),
        z: r * Math.sin(a),
        vx: Math.cos(a) * s,
        vz: Math.sin(a) * s,
        rgb: Math.random() < 0.5 ? [120, 170, 255] : [175, 205, 255],
        size: 1 + Math.random(),
        born: t,
        life: 1.6 + Math.random(),
        damp: 0,
        drag: 0,
        lift: 0,
        vlift: (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 70),
      })
    }
  }

  // Brightness (0–1) and colour across the disk, shared by both halves' glows so they match:
  // white-lavender at the inner edge fading out to deep purple
  const GLOW_PEAK = 0.5
  const GLOW_STOPS: [number, number, RGB][] = [
    [0, 1, [235, 215, 255]],
    [0.22, 0.58, [170, 110, 255]],
    [0.58, 0.2, [120, 60, 220]],
    [1, 0, [90, 40, 180]],
  ]

  // Near half: unlensed, so a plain gradient in disk space (y squashed), cut at the disk's
  // midline where the far half takes over
  function nearGlow() {
    ctx.save()
    ctx.scale(1, DISK_TILT)
    ctx.beginPath()
    ctx.rect(-R * 8, 0, R * 16, R * 8)
    ctx.clip()
    const inner = R * DISK_INNER
    const outer = R * (DISK_INNER + DISK_SPAN)
    const g = ctx.createRadialGradient(0, 0, inner, 0, 0, outer)
    for (const [u, b, c] of GLOW_STOPS) g.addColorStop(u, `rgba(${c.join(',')},${GLOW_PEAK * b})`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(0, 0, outer, 0, TAU)
    ctx.arc(0, 0, inner, 0, TAU, true) // the gap between the shadow and the disk's inner edge
    ctx.fill()
    ctx.restore()
  }

  // Far half: pushed through the same lens() as its particles, so it follows the arch over
  // the shadow. It is rotationally symmetric and only changes on resize, so tile the far
  // half of the disk with small patches once, offscreen: each patch's corners go through
  // lens() and it's filled at the disk's brightness for that radius. Patches tile without
  // stacking, so the glow keeps a constant surface brightness everywhere (stacking faint
  // splats instead bands badly, since 8-bit channels round tiny additions unevenly).
  function renderFarGlow() {
    farGlowOrigin.x = R * 6.8
    farGlowOrigin.y = R * 2.6
    const c = document.createElement('canvas')
    c.width = Math.ceil(R * 13.6)
    c.height = Math.ceil(farGlowOrigin.y)
    const g = c.getContext('2d')!
    const rings = 60
    const steps = 240
    const corner = (r: number, phi: number) => {
      const p = lens(r * Math.cos(phi), r * Math.sin(phi), DISK_TILT)
      return [farGlowOrigin.x + p.x, farGlowOrigin.y + p.y]
    }
    for (let i = 0; i < rings; i++) {
      const u = (i + 0.5) / rings
      const j = Math.max(1, GLOW_STOPS.findIndex((s) => s[0] >= u))
      const [u0, b0, c0] = GLOW_STOPS[j - 1]
      const [u1, b1, c1] = GLOW_STOPS[j]
      const k = (u - u0) / (u1 - u0)
      // opaque, with brightness baked into the colour: overlapping patch edges then just repaint
      // the same pixel instead of compounding into hairlines, and since the canvas is drawn
      // additively, the empty (transparent black) areas add nothing
      const b = GLOW_PEAK * (b0 + (b1 - b0) * k)
      g.fillStyle = `rgb(${c0.map((v, n) => Math.round((v + (c1[n] - v) * k) * b)).join(',')})`
      const ra = radius(i / rings)
      const rb = radius((i + 1) / rings)
      for (let a = 0; a < steps; a++) {
        const pa = -Math.PI + (a / steps) * Math.PI // far half: sin φ < 0
        const pb = -Math.PI + ((a + 1) / steps) * Math.PI
        const quad = [corner(ra, pa), corner(rb, pa), corner(rb, pb), corner(ra, pb)]
        // nudge corners out by half a pixel so anti-aliased edges don't leave hairline gaps
        const mx = (quad[0][0] + quad[1][0] + quad[2][0] + quad[3][0]) / 4
        const my = (quad[0][1] + quad[1][1] + quad[2][1] + quad[3][1]) / 4
        g.beginPath()
        for (const [x, y] of quad) {
          const d = Math.hypot(x - mx, y - my) || 1
          g.lineTo(x + ((x - mx) / d) * 0.5, y + ((y - my) / d) * 0.5)
        }
        g.fill()
      }
    }
    return c
  }

  // Soft glow along the lensed arch over the shadow (wide) and the image under it (thin)
  function haloGlow() {
    for (const half of [-1, 1] as const) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(-R * 4, half < 0 ? -R * 4 : 0, R * 8, R * 4)
      ctx.clip()
      const width = half < 0 ? 1.0 : 0.45
      const g = ctx.createRadialGradient(0, 0, R * 1.02, 0, 0, R * (1.05 + width))
      g.addColorStop(0, `rgba(240,225,255,${half < 0 ? 0.45 : 0.35})`)
      g.addColorStop(0.3, `rgba(175,115,255,${half < 0 ? 0.22 : 0.15})`)
      g.addColorStop(1, 'rgba(110,50,210,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(0, 0, R * (1.05 + width), 0, TAU)
      ctx.fill()
      ctx.restore()
    }
  }

  function drawDisk(t: number, front: boolean) {
    for (const p of disk) {
      const behind = (p.mode === 'orbit' ? Math.sin(p.angle) : p.z) < 0
      if (behind === front) continue
      if (p.mode === 'orbit') {
        const fadeIn = Math.min(1, (t - p.since) / 1.2)
        // Doppler beaming: the side moving toward us is brighter
        const alpha = Math.min(1, (0.25 + 0.75 * (1 - p.u)) * (0.75 + 0.5 * Math.cos(p.angle))) * fadeIn
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.fillRect(p.sx, p.sy, p.size, p.size)
        if (p.k > 0) {
          // faint secondary image, bent the other way round the hole into the thin lower arc
          const d = Math.hypot(p.sx, p.sy) || 1
          const rs = R * (1.04 + p.u * 0.35)
          ctx.globalAlpha = alpha * p.k * 0.35
          ctx.fillRect((-p.sx / d) * rs, (-p.sy / d) * rs, p.size * 0.8, p.size * 0.8)
        }
      } else {
        // loose particles are drawn as short streaks along their motion
        ctx.globalAlpha =
          p.mode === 'escape'
            ? Math.max(0, 1 - (t - p.since) / ESCAPE_FADE)
            : horizonFade(Math.hypot(p.x, p.z))
        const tail = lens(p.x - p.vx * 0.08, p.z - p.vz * 0.08, DISK_TILT)
        ctx.strokeStyle = p.color
        ctx.lineWidth = p.size
        ctx.beginPath()
        ctx.moveTo(tail.x, tail.y)
        ctx.lineTo(p.sx, p.sy)
        ctx.stroke()
      }
    }
  }

  function drawDebris(front: boolean, t: number) {
    for (const d of debris) {
      if (d.z >= 0 !== front) continue
      const r = Math.hypot(d.x, d.z)
      const { x, y } = lens(d.x, d.z, DISK_TILT)
      // streak along its motion, so the material reads as stretched strands
      const tail = lens(d.x - d.vx * 0.1, d.z - d.vz * 0.1, DISK_TILT)
      const fade = d.life === Infinity ? 1 : clamp01(1 - (t - d.born) / d.life)
      ctx.globalAlpha = horizonFade(r) * fade
      ctx.strokeStyle = mix(d.rgb, HOT, heatOf(r))
      ctx.lineWidth = d.size
      ctx.beginPath()
      ctx.moveTo(tail.x, tail.y - d.lift + d.vlift * 0.1)
      ctx.lineTo(x, y - d.lift)
      ctx.stroke()
    }
  }

  // Each stream is one tapering ribbon through its points — thin at the head, as thick as the
  // planet where it leaves it — filled in short chunks so it can pass behind and in front of
  // the hole. It's painted as solid planet material (not added light, which washes out to white
  // over the bright disk), with a lighter core so it reads as a tube, and glows as it heats.
  const RIBBON_CHUNK = 6
  function drawStreams(front: boolean, t: number) {
    for (const st of streams) {
      const pts = st.points.map((p) => {
        const s = lens(p.x, p.z, DISK_TILT)
        return { x: s.x, y: s.y, z: p.z, r: Math.hypot(p.x, p.z), age: t - p.born }
      })
      if (planet && (planet.tail === st || planet.wake === st)) {
        // attach the newest end to the planet's surface, facing toward or away from the hole
        const r = Math.hypot(planet.x, planet.z)
        const off = (st.bound ? -0.5 : 0.5) * planetSize(planet)
        const s = lens(planet.x + (planet.x / r) * off, planet.z + (planet.z / r) * off, DISK_TILT)
        pts.push({ x: s.x, y: s.y, z: planet.z, r, age: 0 })
      }
      const n = pts.length
      if (n < 2) continue
      const half = (i: number) => Math.max(0.6, (st.width * Math.pow(i / (n - 1), 0.8)) / 2)
      const normal = (i: number) => {
        const a = pts[Math.max(0, i - 1)]
        const b = pts[Math.min(n - 1, i + 1)]
        const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
        return [-(b.y - a.y) / len, (b.x - a.x) / len]
      }
      const path = (from: number, to: number, scale: number) => {
        ctx.beginPath()
        for (let i = from; i <= to; i++) {
          const [nx, ny] = normal(i)
          ctx.lineTo(pts[i].x + nx * half(i) * scale, pts[i].y + ny * half(i) * scale)
        }
        for (let i = to; i >= from; i--) {
          const [nx, ny] = normal(i)
          ctx.lineTo(pts[i].x - nx * half(i) * scale, pts[i].y - ny * half(i) * scale)
        }
        ctx.closePath()
      }
      for (let c = 0; c < n - 1; c += RIBBON_CHUNK) {
        const end = Math.min(n - 1, c + RIBBON_CHUNK)
        const mid = pts[(c + end) >> 1]
        if (mid.z >= 0 !== front) continue
        const alpha = st.bound ? horizonFade(mid.r) : clamp01(1 - mid.age / STREAM_FADE)
        const heat = heatOf(mid.r)
        const body: RGB = [0, 1, 2].map((n) => st.rgb[n] + (HOT[n] - st.rgb[n]) * heat) as RGB
        ctx.fillStyle = `rgb(${body.map(Math.round).join(',')})`
        ctx.globalAlpha = alpha * (0.06 + 0.25 * heat) // glow around it, stronger as it heats
        path(c, end, 2.6)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = alpha * (st.bound ? 0.92 : 0.55)
        path(c, end, 1)
        ctx.fill()
        ctx.fillStyle = mix(body, [255, 255, 255], 0.35)
        ctx.globalAlpha = alpha * (st.bound ? 0.6 : 0.35)
        path(c, end, 0.4)
        ctx.fill()
        ctx.globalCompositeOperation = 'lighter'
      }
    }
  }

  function drawCloud(front: boolean, t: number) {
    if (!cloud || cloud.z >= 0 !== front) return
    const age = (t - cloud.born) / 3.5
    const p = lens(cloud.x, cloud.z, DISK_TILT)
    const r = cloud.size * (1 + age * 5)
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
    g.addColorStop(0, `rgba(${cloud.rgb.join(',')},${0.35 * (1 - age)})`)
    g.addColorStop(1, `rgba(${cloud.rgb.join(',')},0)`)
    ctx.globalAlpha = 1
    ctx.fillStyle = g
    ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2)
  }

  // The planet is a sphere lit by the disk; the tidal bulge toward the hole comes from the tail
  // ribbon leaving its surface, so it reads as a teardrop rather than a stretched oval
  function drawPlanet(front: boolean) {
    if (!planet || planet.z >= 0 !== front) return
    const p = lens(planet.x, planet.z, DISK_TILT)
    const size = planetSize(planet)
    const strip = stripOf(Math.hypot(planet.x, planet.z))

    const aura = ctx.createRadialGradient(p.x, p.y, size * 0.5, p.x, p.y, size * 2.4)
    aura.addColorStop(0, `rgba(${planet.look.debris[0].join(',')},${0.18 + strip * 0.35})`) // hotter as it's torn
    aura.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.globalAlpha = 1
    ctx.fillStyle = aura
    ctx.fillRect(p.x - size * 2.4, p.y - size * 2.4, size * 4.8, size * 4.8)

    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.translate(p.x, p.y)
    ctx.rotate(Math.atan2(p.y, p.x)) // +x now points away from the hole
    ctx.scale(1 + strip * 0.12, 1) // a slight tidal bulge along the line to the hole
    const body = ctx.createRadialGradient(-size * 0.45, -size * 0.15, size * 0.1, 0, 0, size)
    body.addColorStop(0, planet.look.light)
    body.addColorStop(0.5, planet.look.mid)
    body.addColorStop(1, planet.look.dark)
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.arc(0, 0, size, 0, TAU)
    ctx.fill()
    ctx.restore()
  }

  // Twin jets along the spin axis (straight up and down in the disk's frame) while it feeds
  function drawJets(t: number) {
    if (flare < 0.02) return
    const L = R * (2.2 + 2 * flare)
    for (const dir of [-1, 1]) {
      const a = flare * (0.75 + 0.25 * Math.sin(t * 23 + dir * 2))
      const y0 = dir * R * 0.85
      const y1 = dir * (R * 0.85 + L)
      const g = ctx.createLinearGradient(0, y0, 0, y1)
      g.addColorStop(0, `rgba(240,240,255,${0.9 * a})`)
      g.addColorStop(0.35, `rgba(170,185,255,${0.45 * a})`)
      g.addColorStop(1, 'rgba(120,140,255,0)')
      ctx.globalAlpha = 1
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(-R * 0.035, y0)
      ctx.lineTo(R * 0.035, y0)
      ctx.lineTo(R * 0.11, y1)
      ctx.lineTo(-R * 0.11, y1)
      ctx.closePath()
      ctx.fill()
    }
  }

  function renderNebula() {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const g = c.getContext('2d')!
    g.fillStyle = '#05020d'
    g.fillRect(0, 0, w, h)
    const m = Math.max(w, h)
    for (const [x, y, r, color] of [
      [0.15, 0.2, 0.5, 'rgba(110,40,180,0.22)'],
      [0.85, 0.75, 0.5, 'rgba(190,50,160,0.14)'],
      [0.7, 0.15, 0.35, 'rgba(60,60,200,0.14)'],
    ] as const) {
      const n = g.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * m)
      n.addColorStop(0, color)
      n.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = n
      g.fillRect(0, 0, w, h)
    }
    return c
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      cx = w / 2
      cy = h / 2
      R = Math.min(w, h) * (w < 700 ? 0.11 : 0.12)
      GM = DISK_SPIN ** 2 * (DISK_INNER * R) ** 3
      nebula = renderNebula()
      farGlow = renderFarGlow()
      for (const p of disk) if (p.mode !== 'orbit') respawn(p, last)
      planet = null
      streams = []
      debris = []
      cloud = null
      flare = 0
      stars = Array.from({ length: Math.round((w * h) / 4000) }, () => {
        const x = Math.random() * w
        const y = Math.random() * h
        // Push stars away from the hole to fake gravitational lensing
        const dx = x - cx
        const dy = y - cy
        const k = 1 + (R * R * 3) / (dx * dx + dy * dy + 1)
        return {
          x: cx + dx * k,
          y: cy + dy * k,
          r: Math.random() < 0.08 ? 1.6 : 0.5 + Math.random() * 0.8,
          a: 0.3 + Math.random() * 0.7,
          tw: 0.5 + Math.random() * 2,
        }
      })
    },
    pointer(p) {
      if (!p) {
        cursor = null
        cursorPrev = null
        return
      }
      // into the disk's frame: centred on the hole, roll undone
      const dx = p.x - cx
      const dy = p.y - cy
      const cos = Math.cos(-DISK_ROLL)
      const sin = Math.sin(-DISK_ROLL)
      cursor = { x: dx * cos - dy * sin, y: dx * sin + dy * cos }
      const now = performance.now()
      if (cursorPrev) {
        const dtm = Math.max(1, now - cursorPrev.time) / 1000
        const speed = Math.hypot(cursor.x - cursorPrev.x, cursor.y - cursorPrev.y) / dtm
        cursorSpeed = cursorSpeed * 0.7 + speed * 0.3
      }
      cursorPrev = { ...cursor, time: now }
    },
    frame(t) {
      const dt = Math.min(Math.max(t - last, 0), 0.05)
      last = t
      cursorSpeed *= Math.exp(-dt * 4) // settles when the cursor rests
      for (const p of disk) stepDisk(p, dt, t)
      flare *= Math.exp(-dt / FLARE_DECAY)
      if (!planet && t > nextPlanet && dt > 0) spawnPlanet(t)
      if (planet) stepPlanet(planet, dt, t)
      stepStreams(dt, t)
      blowWind(dt, t)
      stepDebris(dt, t)

      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      if (nebula) ctx.drawImage(nebula, 0, 0, w, h)

      ctx.fillStyle = '#fff'
      for (const s of stars) {
        ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(t * s.tw + s.x))
        ctx.fillRect(s.x, s.y, s.r, s.r)
      }
      ctx.globalAlpha = 1

      const ambient = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 6)
      ambient.addColorStop(0, `rgba(150,90,255,${0.18 + 0.22 * flare})`)
      ambient.addColorStop(1, 'rgba(150,90,255,0)')
      ctx.fillStyle = ambient
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(DISK_ROLL)
      ctx.globalCompositeOperation = 'lighter'

      // everything behind the hole: its light reaches us bent around the shadow
      if (farGlow) ctx.drawImage(farGlow, -farGlowOrigin.x, -farGlowOrigin.y)
      haloGlow()
      drawDisk(t, false)
      drawStreams(false, t)
      drawDebris(false, t)
      drawCloud(false, t)
      drawPlanet(false)

      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(0, 0, R, 0, TAU)
      ctx.fill()

      ctx.globalCompositeOperation = 'lighter'
      ctx.strokeStyle = `rgba(235,220,255,${0.7 + 0.3 * flare})`
      ctx.lineWidth = Math.max(1.2, R * 0.022)
      ctx.shadowColor = 'rgba(170,110,255,0.9)'
      ctx.shadowBlur = R * (0.25 + 0.3 * flare)
      ctx.beginPath()
      ctx.arc(0, 0, R * 1.02, 0, TAU)
      ctx.stroke()
      ctx.shadowBlur = 0

      // jets leave the poles; the near side of the disk passes in front of the lower one's base
      drawJets(t)

      // everything in front of the hole
      ctx.globalAlpha = 1
      nearGlow()
      drawDisk(t, true)
      drawStreams(true, t)
      drawDebris(true, t)
      drawCloud(true, t)
      drawPlanet(true)

      if (cursor) {
        const halo = ctx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, CURSOR_RADIUS)
        halo.addColorStop(0, 'rgba(200,150,255,0.10)')
        halo.addColorStop(1, 'rgba(200,150,255,0)')
        ctx.globalAlpha = 1
        ctx.fillStyle = halo
        ctx.fillRect(cursor.x - CURSOR_RADIUS, cursor.y - CURSOR_RADIUS, CURSOR_RADIUS * 2, CURSOR_RADIUS * 2)
      }
      ctx.restore()

      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
    },
  }
}

/* ---------- Space exploration: nebula, parallax stars, ringed planet, rocket ---------- */

const CRASH_RADIUS = 1.2 // a rocket closer than this many planet radii crashes
// Surface gravity in px/s² on a 900px-tall screen. Every planet shares it, so mass grows
// with radius² — the big planet bends a passing rocket far more than the small one.
const SURFACE_GRAVITY = 30
const DEBRIS_LIFE = 1.4 // seconds
const DEBRIS_COLORS = ['#ffd27a', '#ff8a3d', '#ff5a3d', '#eef2fa']

interface Rocket {
  x: number
  y: number
  vx: number
  vy: number
  born: number
  trail: { x: number; y: number }[]
  lastTrail: number
}

function spaceExploration(ctx: CanvasRenderingContext2D): Renderer {
  let w = 0
  let h = 0
  let last = 0
  let backdrop: HTMLCanvasElement | null = null
  let planet: HTMLCanvasElement | null = null
  let planetR = 0 // body radius of the big ringed planet
  let moon = { x: 0, y: 0, r: 0 } // the small orange planet (baked into the backdrop)
  let stars: { x: number; y: number; r: number; a: number; depth: number }[] = []
  let shooting: { x: number; y: number; born: number } | null = null
  let nextShot = 3
  let rocket: Rocket | null = null
  let nextRocket = 1.5
  let debris: { x: number; y: number; vx: number; vy: number; size: number; color: string; born: number }[] = []
  let blast: { x: number; y: number; born: number } | null = null

  function renderBackdrop() {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const g = c.getContext('2d')!
    const sky = g.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#040716')
    sky.addColorStop(1, '#0b0620')
    g.fillStyle = sky
    g.fillRect(0, 0, w, h)
    const m = Math.max(w, h)
    for (const [x, y, r, color] of [
      [0.2, 0.3, 0.6, 'rgba(120,60,200,0.28)'],
      [0.85, 0.2, 0.5, 'rgba(30,140,200,0.22)'],
      [0.6, 0.9, 0.55, 'rgba(200,60,140,0.16)'],
    ] as const) {
      const n = g.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * m)
      n.addColorStop(0, color)
      n.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = n
      g.fillRect(0, 0, w, h)
    }
    // small distant orange planet
    const { x: px, y: py, r: pr } = moon
    const pg = g.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr)
    pg.addColorStop(0, '#ffd2a1')
    pg.addColorStop(0.6, '#d9733a')
    pg.addColorStop(1, '#3a1708')
    g.fillStyle = pg
    g.beginPath()
    g.arc(px, py, pr, 0, Math.PI * 2)
    g.fill()
    return c
  }

  function renderPlanet(P: number) {
    const c = document.createElement('canvas')
    c.width = Math.ceil(P * 2.6)
    c.height = Math.ceil(P * 1.6)
    const g = c.getContext('2d')!
    const x = c.width / 2
    const y = c.height / 2

    const ring = (from: number, to: number) => {
      for (let i = 0; i < 14; i++) {
        g.strokeStyle = `rgba(${200 - i * 4},${190 - i * 3},${230 - i * 2},${0.05 + (i % 3) * 0.05})`
        g.lineWidth = P * 0.018
        g.beginPath()
        g.ellipse(x, y, P * (0.72 + i * 0.03), P * (0.15 + i * 0.006), -0.18, from, to)
        g.stroke()
      }
    }

    ring(Math.PI, Math.PI * 2)

    const r = P / 2
    const body = g.createRadialGradient(x - r * 0.45, y - r * 0.45, r * 0.1, x, y, r)
    body.addColorStop(0, '#a8dcff')
    body.addColorStop(0.45, '#3f74d8')
    body.addColorStop(0.85, '#16215e')
    body.addColorStop(1, '#070a22')
    g.fillStyle = body
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()

    // faint cloud bands
    g.save()
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.clip()
    for (let i = -3; i <= 3; i++) {
      const by = y + i * r * 0.28
      const band = g.createLinearGradient(0, by - r * 0.08, 0, by + r * 0.08)
      band.addColorStop(0, 'rgba(255,255,255,0)')
      band.addColorStop(0.5, `rgba(255,255,255,${i % 2 ? 0.03 : 0.06})`)
      band.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = band
      g.fillRect(x - r, by - r * 0.08, r * 2, r * 0.16)
    }
    const shade = g.createLinearGradient(x - r, y - r, x + r, y + r)
    shade.addColorStop(0.45, 'rgba(0,0,0,0)')
    shade.addColorStop(1, 'rgba(0,0,0,0.65)')
    g.fillStyle = shade
    g.fillRect(x - r, y - r, r * 2, r * 2)
    g.restore()

    ring(0, Math.PI)
    return c
  }

  function drawRocket(x: number, y: number, angle: number, size: number, t: number) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.scale(size / 40, size / 40)

    const f = 12 + Math.sin(t * 38) * 3
    const flame = ctx.createLinearGradient(-14, 0, -14 - f, 0)
    flame.addColorStop(0, 'rgba(255,240,180,1)')
    flame.addColorStop(0.4, 'rgba(255,150,40,0.9)')
    flame.addColorStop(1, 'rgba(255,60,20,0)')
    ctx.fillStyle = flame
    ctx.beginPath()
    ctx.moveTo(-13, -4)
    ctx.quadraticCurveTo(-14 - f, 0, -13, 4)
    ctx.fill()

    ctx.fillStyle = '#e0533d'
    for (const dir of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(-6, 4 * dir)
      ctx.lineTo(-15, 12 * dir)
      ctx.lineTo(-13, 3 * dir)
      ctx.fill()
    }

    ctx.fillStyle = '#eef2fa'
    ctx.beginPath()
    ctx.ellipse(1, 0, 16, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#e0533d'
    ctx.beginPath()
    ctx.ellipse(13, 0, 4.5, 3.6, 0, -Math.PI / 2, Math.PI / 2)
    ctx.fill()

    ctx.fillStyle = '#5fb3ff'
    ctx.strokeStyle = '#22325a'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(4, 0, 2.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  // the big planet drifts up slightly as the page scrolls
  const planetY = (scroll: number) => h * 0.8 - Math.min(scroll * 0.05, h * 0.15)

  function gravityWells(scroll: number) {
    const g = SURFACE_GRAVITY * (Math.min(w, h) / 900)
    return [
      { x: w * 0.82, y: planetY(scroll), r: planetR, gm: g * planetR * planetR },
      { ...moon, gm: g * moon.r * moon.r },
    ]
  }

  // Launch from a random point on a random edge, aimed across the open upper-left of the
  // screen — about 1 in 4 rockets still crash, mostly after gravity bends them in
  function launch(t: number) {
    const m = 60
    const start = [
      { x: -m, y: Math.random() * h },
      { x: w + m, y: Math.random() * h },
      { x: Math.random() * w, y: -m },
      { x: Math.random() * w, y: h + m },
    ][Math.floor(Math.random() * 4)]
    const tx = w * (0.15 + Math.random() * 0.5)
    const ty = h * (0.15 + Math.random() * 0.45)
    const a = Math.atan2(ty - start.y, tx - start.x)
    const speed = Math.hypot(w, h) / (14 + Math.random() * 6)
    rocket = { ...start, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, born: t, trail: [], lastTrail: t }
  }

  function crash(r: Rocket, t: number) {
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 40 + Math.random() * 120
      debris.push({
        x: r.x,
        y: r.y,
        vx: Math.cos(a) * s + r.vx * 0.3,
        vy: Math.sin(a) * s + r.vy * 0.3,
        size: 1.5 + Math.random() * 1.5,
        color: DEBRIS_COLORS[i % DEBRIS_COLORS.length],
        born: t,
      })
    }
    blast = { x: r.x, y: r.y, born: t }
    rocket = null
    nextRocket = t + 2.5 + Math.random() * 3
  }

  function stepRocket(r: Rocket, dt: number, t: number, scroll: number) {
    const wells = gravityWells(scroll)
    const sub = dt / 2 // two substeps keep close flybys stable
    for (let i = 0; i < 2; i++) {
      for (const p of wells) {
        const dx = p.x - r.x
        const dy = p.y - r.y
        const d = Math.hypot(dx, dy)
        if (d < p.r * CRASH_RADIUS) return crash(r, t)
        const a = p.gm / (d * d)
        r.vx += (a * dx * sub) / d
        r.vy += (a * dy * sub) / d
      }
      r.x += r.vx * sub
      r.y += r.vy * sub
    }
    if (t - r.lastTrail > 0.04) {
      r.trail.push({ x: r.x, y: r.y })
      if (r.trail.length > 18) r.trail.shift()
      r.lastTrail = t
    }
    const gone = r.x < -120 || r.x > w + 120 || r.y < -120 || r.y > h + 120
    // the age check lets it clear the edge it launched from; the cap ends any stray orbit
    if ((gone && t - r.born > 1) || t - r.born > 45) {
      rocket = null
      nextRocket = t + 2 + Math.random() * 4
    }
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      const P = Math.min(w, h) * (w < 700 ? 0.42 : 0.34)
      planetR = P / 2
      moon = { x: w * 0.12, y: h * 0.22, r: Math.min(w, h) * 0.035 }
      backdrop = renderBackdrop()
      planet = renderPlanet(P)
      const count = Math.round((w * h) / 3500)
      // three parallax layers: near stars are bigger and move faster
      stars = Array.from({ length: count }, (_, i) => {
        const depth = [1, 0.55, 0.25][i % 3]
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          depth,
          r: depth * (0.9 + Math.random() * 0.9),
          a: 0.35 + Math.random() * 0.65,
        }
      })
    },
    frame(t) {
      if (!backdrop || !planet) return
      const dt = Math.min(Math.max(t - last, 0), 0.05)
      last = t
      const scroll = window.scrollY
      ctx.globalAlpha = 1
      ctx.drawImage(backdrop, 0, 0, w, h)

      ctx.fillStyle = '#fff'
      for (const s of stars) {
        const x = (((s.x - t * 6 * s.depth) % w) + w) % w
        const y = (((s.y - scroll * 0.12 * s.depth) % h) + h) % h
        ctx.globalAlpha = s.a
        ctx.fillRect(x, y, s.r, s.r)
      }
      ctx.globalAlpha = 1

      ctx.drawImage(planet, w * 0.82 - planet.width / 2, planetY(scroll) - planet.height / 2)

      // shooting star
      if (!shooting && t > nextShot) shooting = { x: w * (0.3 + Math.random() * 0.7), y: h * Math.random() * 0.4, born: t }
      if (shooting) {
        const age = (t - shooting.born) / 0.9
        if (age >= 1) {
          shooting = null
          nextShot = t + 4 + Math.random() * 5
        } else {
          const hx = shooting.x - age * 260
          const hy = shooting.y + age * 130
          const tail = ctx.createLinearGradient(hx, hy, hx + 120, hy - 60)
          tail.addColorStop(0, `rgba(255,255,255,${1 - age})`)
          tail.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.strokeStyle = tail
          ctx.lineWidth = 1.6
          ctx.beginPath()
          ctx.moveTo(hx, hy)
          ctx.lineTo(hx + 120, hy - 60)
          ctx.stroke()
        }
      }

      // rocket on a gravity-bent path, with an exhaust trail
      if (!rocket && t > nextRocket && dt > 0) launch(t)
      if (rocket) stepRocket(rocket, dt, t, scroll)
      if (rocket) {
        const n = rocket.trail.length
        rocket.trail.forEach((p, i) => {
          const k = (i + 1) / n // 1 = newest
          ctx.globalAlpha = 0.35 * k
          ctx.fillStyle = '#ffd9a8'
          ctx.beginPath()
          ctx.arc(p.x, p.y, 2 + (1 - k) * 4, 0, Math.PI * 2)
          ctx.fill()
        })
        ctx.globalAlpha = 1
        drawRocket(rocket.x, rocket.y, Math.atan2(rocket.vy, rocket.vx), w < 700 ? 30 : 42, t)
      }

      // crash: a flash plus a burst of debris
      ctx.globalCompositeOperation = 'lighter'
      if (blast) {
        const age = (t - blast.born) / 0.6
        if (age >= 1) blast = null
        else {
          const br = 10 + age * 60
          const flash = ctx.createRadialGradient(blast.x, blast.y, 0, blast.x, blast.y, br)
          flash.addColorStop(0, `rgba(255,240,200,${1 - age})`)
          flash.addColorStop(0.4, `rgba(255,140,50,${0.7 * (1 - age)})`)
          flash.addColorStop(1, 'rgba(255,60,20,0)')
          ctx.fillStyle = flash
          ctx.fillRect(blast.x - br, blast.y - br, br * 2, br * 2)
        }
      }
      debris = debris.filter((d) => t - d.born < DEBRIS_LIFE)
      for (const d of debris) {
        d.vx *= Math.exp(-dt * 1.5)
        d.vy *= Math.exp(-dt * 1.5)
        d.x += d.vx * dt
        d.y += d.vy * dt
        ctx.globalAlpha = 1 - (t - d.born) / DEBRIS_LIFE
        ctx.fillStyle = d.color
        ctx.fillRect(d.x, d.y, d.size, d.size)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    },
  }
}
