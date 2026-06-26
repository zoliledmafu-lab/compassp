import type { WidgetPlugin, StateSnapshot } from '../types'
import EssayPlanner, { type EssayPlannerState, defaultState } from './EssayPlanner'

function describeState(s: EssayPlannerState): string {
  const paras = s.paragraphs.map((p, i) =>
    `Para ${i + 1}: Point="${p.point || '(empty)'}"; Evidence="${p.evidence || '(empty)'}"; Explanation="${p.explanation || '(empty)'}"; Link="${p.link || '(empty)'}"`)
    .join(' | ')
  return `Essay plan${s.topic ? ` for "${s.topic}"` : ''}: ${s.paragraphs.length} paragraph(s). ${paras}`
}

function detectStruggle(history: StateSnapshot<EssayPlannerState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 6) {
    // Check if point fields are mostly empty across recent snapshots
    const emptyPoints = recent.filter(s => s.state.paragraphs.every(p => !p.point)).length
    if (emptyPoints >= 4) return { struggling: true as const, reason: 'stuck-same-state' as const }
  }
  return { struggling: false as const }
}

export const englishEssayPlannerPlugin: WidgetPlugin<EssayPlannerState> = {
  id: 'english-essay-planner',
  name: 'Essay Planner (PEEL)',
  description: 'Plan structured essays using the PEEL framework — Point, Evidence, Explanation, Link.',
  subjects: [
    'nsc-english',
    'zol-english-language',
    'zal-english-literature',
    'igcse-english-lang',
    'igcse-english-lit',
    'cal-english-language',
    'cal-english-literature',
  ],
  icon: '📝',
  defaultState,
  Component: EssayPlanner,
  describeState,
  detectStruggle,
}
