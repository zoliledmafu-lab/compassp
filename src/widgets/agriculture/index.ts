import type { WidgetPlugin, StateSnapshot } from '../types'
import CropPlanner, { type AgricultureState, defaultState } from './CropPlanner'

function describeState(s: AgricultureState): string {
  return `Crop plan: ${s.crop}, season ${s.season}. Soil: ${s.soilType}, rainfall ${s.rainfall}mm. Activities: ${s.activities.map(a => `${a.month}: ${a.activity}`).join('; ')}.`
}

function detectStruggle(history: StateSnapshot<AgricultureState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-6)
  const hasChecked = recent.some(s => s.trigger === 'check')
  const noActivities = recent.every(s => s.state.activities.length <= 1)
  if (noActivities && !hasChecked) return { struggling: true as const, reason: 'few-activities' as const }
  return { struggling: false as const }
}

export const cropPlannerPlugin: WidgetPlugin<AgricultureState> = {
  id: 'agriculture-crop-planner',
  name: 'Crop Planner',
  description: 'Plan a crop calendar with soil type, rainfall, fertilizer and monthly activities.',
  subjects: ['nsc-agriculture', 'zol-agriculture', 'zal-agriculture'],
  icon: '🌾',
  defaultState,
  Component: CropPlanner,
  describeState,
  detectStruggle,
}
