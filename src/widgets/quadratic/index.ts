import type { WidgetPlugin, StateSnapshot } from '../types'
import QuadraticGraph, { type QuadraticState, defaultState } from './QuadraticGraph'

function fmt(n: number) { return n.toFixed(2) }

function describeState(s: QuadraticState): string {
  const { a, b, c } = s
  const disc = b * b - 4 * a * c
  const vx = -b / (2 * a)
  const vy = a * vx * vx + b * vx + c
  return (
    `Quadratic: y = ${a}x² + ${b}x + ${c}. ` +
    `Vertex at (${fmt(vx)}, ${fmt(vy)}). ` +
    `Discriminant = ${fmt(disc)} — ` +
    (disc > 0 ? 'two real roots.' : disc === 0 ? 'one repeated root.' : 'no real roots (complex).')
  )
}

function detectStruggle(history: StateSnapshot<QuadraticState>[]) {
  if (history.length < 5) return { struggling: false as const }
  const recent = history.slice(-8)
  const aVals = recent.map(s => s.state.a)
  const unique = new Set(aVals)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (unique.size <= 2 && recent.length >= 6 && !hasChecked) {
    return { struggling: true as const, reason: 'oscillating' as const }
  }
  return { struggling: false as const }
}

export const quadraticPlugin: WidgetPlugin<QuadraticState> = {
  id: 'quadratic-graph',
  name: 'Quadratic Graph',
  description: 'Explore y = ax² + bx + c — adjust coefficients and see the parabola, vertex, and roots update live.',
  subjects: [
    'nsc-mathematics', 'zol-mathematics', 'zal-pure-mathematics',
    'igcse-mathematics', 'igcse-add-maths',
    'cal-mathematics', 'cal-further-maths',
  ],
  icon: '∪',
  defaultState,
  Component: QuadraticGraph,
  describeState,
  detectStruggle,
}
