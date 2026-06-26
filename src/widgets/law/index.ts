import type { WidgetPlugin, StateSnapshot } from '../types'
import IracBuilder, { type IracState, defaultState } from './IracBuilder'

function describeState(s: IracState): string {
  return `Law IRAC (${s.caseType}). Issue: ${s.issue.substring(0, 80)}. Rule: ${s.rule.substring(0, 80)}.`
}

function detectStruggle(history: StateSnapshot<IracState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-6)
  const hasChecked = recent.some(s => s.trigger === 'check')
  const stuck = recent.every(s => !s.state.application)
  if (stuck && !hasChecked) return { struggling: true as const, reason: 'no-application' as const }
  return { struggling: false as const }
}

export const lawIracPlugin: WidgetPlugin<IracState> = {
  id: 'law-irac',
  name: 'IRAC Builder',
  description: 'Structure a legal problem answer: Issue, Rule, Application, Conclusion.',
  subjects: ['cal-law'],
  icon: '⚖️',
  defaultState,
  Component: IracBuilder,
  describeState,
  detectStruggle,
}
