import type { WidgetPlugin, StateSnapshot } from '../types'
import PsychStudy, { type PsychStudyState, defaultState } from './PsychStudy'

function describeState(s: PsychStudyState): string {
  return `Psychology study: ${s.studyName} by ${s.researcher} (${s.year}). Approach: ${s.approach}. Aim: ${s.aim.substring(0, 100)}`
}

function detectStruggle(history: StateSnapshot<PsychStudyState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-6)
  const hasChecked = recent.some(s => s.trigger === 'check')
  const noContent = recent.every(s => !s.state.aim && !s.state.findings)
  if (noContent && !hasChecked) return { struggling: true as const, reason: 'no-content' as const }
  return { struggling: false as const }
}

export const psychStudyPlugin: WidgetPlugin<PsychStudyState> = {
  id: 'psych-study',
  name: 'Core Study Evaluator',
  description: 'Structure APFC notes on a psychology core study with evaluation.',
  subjects: ['cal-psychology'],
  icon: '🧠',
  defaultState,
  Component: PsychStudy,
  describeState,
  detectStruggle,
}
