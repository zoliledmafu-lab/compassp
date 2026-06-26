import type { WidgetPlugin, StateSnapshot } from '../types'
import PerspectivesTable, { type SociologyState, defaultState } from './PerspectivesTable'

function describeState(s: SociologyState): string {
  const noted = Object.entries(s.notes as Record<string, string>).filter(([, v]) => v).map(([k]) => k)
  return `Sociology perspectives on "${s.topic || 'topic'}". Notes on: ${noted.join(', ') || 'none yet'}.`
}

function detectStruggle(history: StateSnapshot<SociologyState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-6)
  const hasChecked = recent.some(s => s.trigger === 'check')
  const allEmpty = recent.every(s => Object.values(s.state.notes as Record<string, string>).every(v => !v))
  if (allEmpty && !hasChecked) return { struggling: true as const, reason: 'no-notes' as const }
  return { struggling: false as const }
}

export const sociologyPerspectivesPlugin: WidgetPlugin<SociologyState> = {
  id: 'sociology-perspectives',
  name: 'Sociological Perspectives',
  description: 'Apply Functionalism, Marxism, Feminism, Interactionism & Postmodernism to any topic.',
  subjects: ['igcse-sociology', 'cal-sociology'],
  icon: '🤝',
  defaultState,
  Component: PerspectivesTable,
  describeState,
  detectStruggle,
}
