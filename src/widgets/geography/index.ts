import type { WidgetPlugin, StateSnapshot } from '../types'
import ClimateGraph, { type ClimateState, defaultState } from './ClimateGraph'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function describeState(s: ClimateState): string {
  const totalRain = s.rainfall.reduce((sum, v) => sum + v, 0)
  const meanTemp = (s.temperature.reduce((sum, v) => sum + v, 0) / 12).toFixed(1)
  const hottestIdx = s.temperature.indexOf(Math.max(...s.temperature))
  const coldestIdx = s.temperature.indexOf(Math.min(...s.temperature))
  return (
    `Climate graph for ${s.locationName}. ` +
    `Total annual rainfall: ${totalRain} mm. Mean temperature: ${meanTemp}°C. ` +
    `Hottest month: ${MONTHS[hottestIdx]} (${s.temperature[hottestIdx]}°C). ` +
    `Coldest month: ${MONTHS[coldestIdx]} (${s.temperature[coldestIdx]}°C). ` +
    `Monthly rainfall: ${s.rainfall.map((v, i) => `${MONTHS[i]}=${v}`).join(', ')}.`
  )
}

function detectStruggle(history: StateSnapshot<ClimateState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 7) {
    return { struggling: true as const, reason: 'many-changes-no-check' as const }
  }
  return { struggling: false as const }
}

export const geographyClimatePlugin: WidgetPlugin<ClimateState> = {
  id: 'geography-climate',
  name: 'Climate Graph',
  description: 'Build dual-axis climate graphs with monthly rainfall bars and temperature line for any location.',
  subjects: ['nsc-geography', 'zol-geography', 'zal-geography', 'igcse-geography', 'cal-geography'],
  icon: '🌦️',
  defaultState,
  Component: ClimateGraph,
  describeState,
  detectStruggle,
}
