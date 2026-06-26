import type { WidgetPlugin, StateSnapshot } from '../types'
import SwotAnalysis, { type SwotState, defaultState } from './SwotAnalysis'

function describeState(s: SwotState): string {
  return (
    `SWOT Analysis for "${s.businessName}". ` +
    `Strengths (${s.strengths.length}): ${s.strengths.join(', ') || 'none'}. ` +
    `Weaknesses (${s.weaknesses.length}): ${s.weaknesses.join(', ') || 'none'}. ` +
    `Opportunities (${s.opportunities.length}): ${s.opportunities.join(', ') || 'none'}. ` +
    `Threats (${s.threats.length}): ${s.threats.join(', ') || 'none'}.`
  )
}

function detectStruggle(history: StateSnapshot<SwotState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 7) {
    return { struggling: true as const, reason: 'many-changes-no-check' as const }
  }
  return { struggling: false as const }
}

export const businessSwotPlugin: WidgetPlugin<SwotState> = {
  id: 'business-swot',
  name: 'SWOT Analysis',
  description: 'Build a SWOT analysis with strengths, weaknesses, opportunities and threats — get AI feedback.',
  subjects: ['nsc-business-studies', 'zol-commerce', 'zal-business-studies', 'igcse-business', 'cal-business'],
  icon: '📋',
  defaultState,
  Component: SwotAnalysis,
  describeState,
  detectStruggle,
}
