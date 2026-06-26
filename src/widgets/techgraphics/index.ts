import type { WidgetPlugin, StateSnapshot } from '../types'
import ShapeProperties, { type TechGraphicsState, defaultState } from './ShapeProperties'
import { SHAPES } from './ShapeProperties'

function describeState(s: TechGraphicsState): string {
  const def = SHAPES[s.shape]
  if (!def) return `Technical graphics: ${s.shape}`
  const area = def.area(s.dimensions)
  const perim = def.perimeter(s.dimensions)
  return `${def.name}: area = ${area.toFixed(2)} units², perimeter = ${perim.toFixed(2)} units.`
}

function detectStruggle(history: StateSnapshot<TechGraphicsState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-6)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked) return { struggling: true as const, reason: 'no-check' as const }
  return { struggling: false as const }
}

export const shapePropertiesPlugin: WidgetPlugin<TechGraphicsState> = {
  id: 'techgraphics-shapes',
  name: '2D Shape Properties',
  description: 'Explore area, perimeter and dimensions of 2D shapes with live diagrams.',
  subjects: ['zol-technical-graphics'],
  icon: '📐',
  defaultState,
  Component: ShapeProperties,
  describeState,
  detectStruggle,
}
