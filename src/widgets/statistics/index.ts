import type { WidgetPlugin, StateSnapshot } from '../types'
import Statistics, { type StatisticsState, defaultState } from './Statistics'

function mean(v: number[]) { return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0 }
function median(v: number[]) {
  if (!v.length) return 0
  const s = [...v].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
function fmt(n: number) { return n.toFixed(2) }

function describeState(s: StatisticsState): string {
  const valid = s.values.filter((_, i) => s.labels[i]?.trim())
  return (
    `Dataset: ${s.labels.filter(l => l.trim()).join(', ')} with values ${valid.join(', ')}. ` +
    `Mean = ${fmt(mean(valid))}, Median = ${fmt(median(valid))}, Range = ${valid.length ? fmt(Math.max(...valid) - Math.min(...valid)) : 0}.`
  )
}

function detectStruggle(history: StateSnapshot<StatisticsState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-6)
  const withoutCheck = recent.filter(s => s.trigger !== 'check')
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (withoutCheck.length >= 5 && !hasChecked) return { struggling: true as const, reason: 'many-changes-no-check' as const }
  return { struggling: false as const }
}

export const statisticsPlugin: WidgetPlugin<StatisticsState> = {
  id: 'statistics-chart',
  name: 'Statistics Chart',
  description: 'Enter data to build a bar chart and calculate mean, median, mode, and range.',
  subjects: [
    'nsc-mathematics', 'nsc-mathematics-literacy',
    'zol-mathematics', 'zal-pure-mathematics', 'zal-statistics',
    'igcse-mathematics', 'igcse-add-maths',
    'cal-mathematics', 'cal-further-maths',
  ],
  icon: '📊',
  defaultState,
  Component: Statistics,
  describeState,
  detectStruggle,
}
