import type { WidgetPlugin, StateSnapshot } from '../types'
import TrigGraph, { type TrigState, defaultState } from './TrigGraph'

function fmt(n: number) { return Number.isInteger(n) ? String(n) : n.toFixed(2) }

function describeState(s: TrigState): string {
  const { func, amplitude, frequency, phase, vertical } = s
  const period = (2 * Math.PI) / Math.abs(frequency)
  const phaseShift = phase !== 0 ? -phase / frequency : 0
  return (
    `Trig function: y = ${amplitude !== 1 ? amplitude : ''}${func}(${frequency !== 1 ? frequency : ''}x${phase !== 0 ? (phase > 0 ? '+' : '') + fmt(phase) : ''})${vertical !== 0 ? (vertical > 0 ? '+' : '') + fmt(vertical) : ''}. ` +
    `Amplitude = ${fmt(Math.abs(amplitude))}, Period = ${fmt(period)}, Phase shift = ${fmt(phaseShift)}, Vertical shift = ${fmt(vertical)}.`
  )
}

function detectStruggle(history: StateSnapshot<TrigState>[]) {
  if (history.length < 5) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  const funcs = recent.map(s => s.state.func)
  const switchedFuncs = new Set(funcs).size >= 3 && !hasChecked
  if (switchedFuncs) return { struggling: true as const, reason: 'oscillating' as const }
  return { struggling: false as const }
}

export const trigPlugin: WidgetPlugin<TrigState> = {
  id: 'trig-graph',
  name: 'Trig Graph',
  description: 'Explore y = A·sin(Bx+C)+D — adjust amplitude, frequency, phase, and vertical shift with sliders.',
  subjects: [
    'nsc-mathematics', 'zol-mathematics', 'zal-pure-mathematics',
    'igcse-mathematics', 'igcse-add-maths',
    'cal-mathematics', 'cal-further-maths',
  ],
  icon: '∿',
  defaultState,
  Component: TrigGraph,
  describeState,
  detectStruggle,
}
