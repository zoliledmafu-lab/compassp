import type { WidgetPlugin, StateSnapshot, StruggleResult } from '../types'
import CoordinatePlane, { type CoordinatePlaneState, defaultState } from './CoordinatePlane'
import { computeLinear, fmt } from './math'

function describeState(s: CoordinatePlaneState): string {
  const a = s.pointA
  const b = s.pointB
  const result = computeLinear(
    { ...a, id: 'A', label: 'A', color: '' },
    { ...b, id: 'B', label: 'B', color: '' },
  )
  return (
    `Point A is at (${fmt(a.x)}, ${fmt(a.y)}) and Point B is at (${fmt(b.x)}, ${fmt(b.y)}). ` +
    `The line through them has equation ${result.equation} ` +
    `with ${result.slopeLabel}` +
    (result.type !== 'vertical' ? ` and ${result.interceptLabel}` : '') +
    '.'
  )
}

function detectStruggle(history: StateSnapshot<CoordinatePlaneState>[]): StruggleResult {
  if (history.length < 4) return { struggling: false }

  const recent = history.slice(-8)
  const windowMs = 45_000 // 45 seconds
  const now = Date.now()
  const inWindow = recent.filter(s => now - s.timestamp < windowMs)

  if (inWindow.length < 4) return { struggling: false }

  // Detect oscillation: A and B toggling between 2 positions repeatedly
  const positions = inWindow.map(s => `${s.state.pointA.x},${s.state.pointA.y}|${s.state.pointB.x},${s.state.pointB.y}`)
  const unique = new Set(positions)
  if (unique.size <= 2 && inWindow.length >= 6) {
    return { struggling: true, reason: 'oscillating' }
  }

  // Detect many changes without a Check
  const withoutCheck = inWindow.filter(s => s.trigger !== 'check')
  const hasChecked = inWindow.some(s => s.trigger === 'check')
  if (withoutCheck.length >= 6 && !hasChecked) {
    return { struggling: true, reason: 'many-changes-no-check' }
  }

  return { struggling: false }
}

export const coordinatePlanePlugin: WidgetPlugin<CoordinatePlaneState> = {
  id: 'coordinate-plane',
  name: 'Coordinate Plane',
  description: 'Drag two points to explore linear equations — slope, y-intercept, and the graph update live.',
  subjects: ['mathematics', 'physical-sciences'],
  icon: '📈',
  defaultState,
  Component: CoordinatePlane,
  describeState,
  detectStruggle,
}
