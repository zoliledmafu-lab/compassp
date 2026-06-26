import type { WidgetPlugin, StateSnapshot } from '../types'
import EcoDataChart, { type EcoDataState, defaultState } from './EcoDataChart'

function describeState(s: EcoDataState): string {
  const vals = s.values.join(', ')
  return `Environmental data (${s.topic}) for ${s.locationName}: years ${s.years.join(', ')}; values ${vals} ${s.unit}.`
}

function detectStruggle(history: StateSnapshot<EcoDataState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-6)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.every(s => !s.state.notes)) return { struggling: true as const, reason: 'no-analysis' as const }
  return { struggling: false as const }
}

export const ecoDataPlugin: WidgetPlugin<EcoDataState> = {
  id: 'env-eco-data',
  name: 'Eco Data Chart',
  description: 'Chart environmental trends — deforestation, pollution, population, energy.',
  subjects: ['igcse-env-management', 'nsc-geography', 'zol-geography', 'zal-geography', 'igcse-geography', 'cal-geography'],
  icon: '🌱',
  defaultState,
  Component: EcoDataChart,
  describeState,
  detectStruggle,
}
