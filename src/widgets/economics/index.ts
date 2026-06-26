import type { WidgetPlugin, StateSnapshot } from '../types'
import SupplyDemand, { type SupplyDemandState, defaultState } from './SupplyDemand'

function fmt(n: number) { return n.toFixed(1) }

function describeState(s: SupplyDemandState): string {
  const dSlope = -0.8, sSlope = 0.8
  const dIntercept = 90 + 0.8 * s.demandShift
  const sIntercept = 10 - 0.8 * s.supplyShift
  const eqQ = (dIntercept - sIntercept) / (sSlope - dSlope)
  const eqP = sIntercept + sSlope * eqQ
  const dDesc = s.demandShift > 0 ? `demand shifted right by ${s.demandShift}` : s.demandShift < 0 ? `demand shifted left by ${Math.abs(s.demandShift)}` : 'no demand shift'
  const sDesc = s.supplyShift > 0 ? `supply shifted right by ${s.supplyShift}` : s.supplyShift < 0 ? `supply shifted left by ${Math.abs(s.supplyShift)}` : 'no supply shift'
  return (
    `Supply & Demand diagram: ${dDesc}, ${sDesc}. ` +
    `Equilibrium price P* = ${fmt(eqP)}, equilibrium quantity Q* = ${fmt(eqQ)}. ` +
    `Surplus shading: ${s.showSurplus ? 'on' : 'off'}.`
  )
}

function detectStruggle(history: StateSnapshot<SupplyDemandState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 6) {
    const ds = recent.map(s => s.state.demandShift)
    const ss = recent.map(s => s.state.supplyShift)
    const oscillating = (new Set(ds).size === 1 && new Set(ss).size === 1)
    if (oscillating) return { struggling: true as const, reason: 'stuck-same-state' as const }
  }
  return { struggling: false as const }
}

export const economicsSupplyDemandPlugin: WidgetPlugin<SupplyDemandState> = {
  id: 'economics-supplydemand',
  name: 'Supply & Demand',
  description: 'Shift supply and demand curves to explore market equilibrium, price, and quantity changes.',
  subjects: ['nsc-economics', 'zol-commerce', 'zal-economics', 'igcse-economics', 'cal-economics'],
  icon: '📈',
  defaultState,
  Component: SupplyDemand,
  describeState,
  detectStruggle,
}
