import type { WidgetPlugin, StateSnapshot } from '../types'
import PunnettSquare, { type PunnettState, defaultState as punnettDefault } from './PunnettSquare'
import FoodWeb, { type FoodWebState, defaultState as foodWebDefault } from './FoodWeb'

const BIOLOGY_SUBJECTS = [
  'nsc-life-sciences',
  'zol-biology',
  'zal-biology',
  'igcse-biology',
  'cal-biology',
  'zol-combined-science',
  'igcse-combined-sci',
]

// ─── Punnett Plugin ────────────────────────────────────────────────
function describePunnett(s: PunnettState): string {
  return (
    `Punnett square for "${s.trait}": Parent 1 = ${s.parent1}, Parent 2 = ${s.parent2}. ` +
    `Cross: ${s.parent1} × ${s.parent2}.`
  )
}

function detectPunnettStruggle(history: StateSnapshot<PunnettState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 6) {
    const genos = recent.map(s => s.state.parent1 + s.state.parent2)
    const allSame = genos.every(g => g === genos[0])
    if (allSame) return { struggling: true as const, reason: 'stuck-same-state' as const }
  }
  return { struggling: false as const }
}

export const biologyPunnettPlugin: WidgetPlugin<PunnettState> = {
  id: 'biology-punnett',
  name: 'Punnett Square',
  description: 'Visualise genetic crosses — enter parent genotypes to see offspring ratios and phenotype distribution.',
  subjects: BIOLOGY_SUBJECTS,
  icon: '🧬',
  defaultState: punnettDefault,
  Component: PunnettSquare,
  describeState: describePunnett,
  detectStruggle: detectPunnettStruggle,
}

// ─── Food Web Plugin ───────────────────────────────────────────────
function describeFoodWeb(s: FoodWebState): string {
  const orgs = s.organisms.map(o => `${o.name} (${o.level})`).join(', ')
  const conns = s.connections.map(c => {
    const from = s.organisms.find(o => o.id === c.from)?.name ?? c.from
    const to = s.organisms.find(o => o.id === c.to)?.name ?? c.to
    return `${from} → ${to}`
  }).join(', ')
  return (
    `Food web with ${s.organisms.length} organisms: ${orgs}. ` +
    `Connections: ${conns || 'none'}.`
  )
}

function detectFoodWebStruggle(history: StateSnapshot<FoodWebState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 7) {
    return { struggling: true as const, reason: 'many-changes-no-check' as const }
  }
  return { struggling: false as const }
}

export const biologyFoodWebPlugin: WidgetPlugin<FoodWebState> = {
  id: 'biology-foodweb',
  name: 'Food Web Builder',
  description: 'Build food webs by adding organisms at trophic levels and connecting them with energy flow arrows.',
  subjects: BIOLOGY_SUBJECTS,
  icon: '🌿',
  defaultState: foodWebDefault,
  Component: FoodWeb,
  describeState: describeFoodWeb,
  detectStruggle: detectFoodWebStruggle,
}
