import type { WidgetPlugin, StateSnapshot } from '../types'
import PhysicsWave, { type PhysicsWaveState, defaultState as waveDefault } from './PhysicsWave'
import ProjectileMotion, { type ProjectileState, defaultState as projectileDefault } from './ProjectileMotion'
import ForceDiagram, { type ForceDiagramState, defaultState as forceDefault } from './ForceDiagram'

const PHYSICS_SUBJECTS = [
  'nsc-physical-sciences',
  'zol-physics',
  'zal-physics',
  'igcse-physics',
  'cal-physics',
  'zol-combined-science',
  'igcse-combined-sci',
]

function fmt(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(2) }

// ─── Wave Plugin ──────────────────────────────────────────────────
function describeWave(s: PhysicsWaveState): string {
  const freq = 1 / s.wavelength
  return (
    `Wave: y = ${fmt(s.amplitude)}·sin(2π/${fmt(s.wavelength)}·x + ${fmt(s.phase)}). ` +
    `Amplitude = ${fmt(s.amplitude)} units, Wavelength = ${fmt(s.wavelength)} units, ` +
    `Frequency = ${freq.toFixed(3)} Hz, Phase = ${fmt(s.phase)} rad. Labels ${s.showLabels ? 'shown' : 'hidden'}.`
  )
}

function detectWaveStruggle(history: StateSnapshot<PhysicsWaveState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 6) {
    const ampVals = recent.map(s => s.state.amplitude)
    const oscillating = ampVals.filter(v => v === ampVals[0]).length > 5
    if (oscillating) return { struggling: true as const, reason: 'stuck-same-state' as const }
  }
  return { struggling: false as const }
}

export const physicsWavePlugin: WidgetPlugin<PhysicsWaveState> = {
  id: 'physics-wave',
  name: 'Wave Diagram',
  description: 'Visualise transverse waves — adjust amplitude, wavelength and phase with live SVG rendering and labels.',
  subjects: PHYSICS_SUBJECTS,
  icon: '〜',
  defaultState: waveDefault,
  Component: PhysicsWave,
  describeState: describeWave,
  detectStruggle: detectWaveStruggle,
}

// ─── Projectile Plugin ────────────────────────────────────────────
function describeProjectile(s: ProjectileState): string {
  const rad = (s.angle * Math.PI) / 180
  const vx = s.speed * Math.cos(rad)
  const vy = s.speed * Math.sin(rad)
  const T = (2 * vy) / s.gravity
  const R = vx * T
  const H = (vy * vy) / (2 * s.gravity)
  return (
    `Projectile: angle=${s.angle}°, initial speed=${fmt(s.speed)} m/s, gravity=${fmt(s.gravity)} m/s². ` +
    `Range = ${fmt(R)} m, Max height = ${fmt(H)} m, Time of flight = ${fmt(T)} s.`
  )
}

function detectProjectileStruggle(history: StateSnapshot<ProjectileState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 7) {
    return { struggling: true as const, reason: 'many-changes-no-check' as const }
  }
  return { struggling: false as const }
}

export const physicsProjectilePlugin: WidgetPlugin<ProjectileState> = {
  id: 'physics-projectile',
  name: 'Projectile Motion',
  description: 'Simulate projectile trajectories — set angle, speed and gravity to see range, height and flight time.',
  subjects: PHYSICS_SUBJECTS,
  icon: '🎯',
  defaultState: projectileDefault,
  Component: ProjectileMotion,
  describeState: describeProjectile,
  detectStruggle: detectProjectileStruggle,
}

// ─── Force Diagram Plugin ──────────────────────────────────────────
function describeForce(s: ForceDiagramState): string {
  const forces = s.forces.map(f => `${f.label} (${f.magnitude}N at ${f.angle}°)`).join(', ')
  const rx = s.forces.reduce((sum, f) => sum + f.magnitude * Math.cos((f.angle * Math.PI) / 180), 0)
  const ry = s.forces.reduce((sum, f) => sum + f.magnitude * Math.sin((f.angle * Math.PI) / 180), 0)
  const rMag = Math.sqrt(rx * rx + ry * ry)
  return (
    `Force diagram with ${s.forces.length} forces: ${forces}. ` +
    `Resultant: Fx=${fmt(rx)}N, Fy=${fmt(ry)}N, |F|=${fmt(rMag)}N.`
  )
}

function detectForceStruggle(history: StateSnapshot<ForceDiagramState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 6) {
    const counts = recent.map(s => s.state.forces.length)
    const same = counts.every(c => c === counts[0])
    if (same) return { struggling: true as const, reason: 'stuck-same-state' as const }
  }
  return { struggling: false as const }
}

export const physicsForcesPlugin: WidgetPlugin<ForceDiagramState> = {
  id: 'physics-forces',
  name: 'Force Diagram',
  description: 'Add and adjust force vectors on an object — see the resultant force and check equilibrium.',
  subjects: PHYSICS_SUBJECTS,
  icon: '⇗',
  defaultState: forceDefault,
  Component: ForceDiagram,
  describeState: describeForce,
  detectStruggle: detectForceStruggle,
}
