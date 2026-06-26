import type { WidgetPlugin, StateSnapshot } from '../types'
import TimelineWidget, { type TimelineState, defaultState } from './TimelineWidget'

function describeState(s: TimelineState): string {
  const sorted = [...s.events].sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0))
  const evList = sorted.map(e => `${e.year}: ${e.event}${e.significance ? ` (${e.significance})` : ''}`).join('; ')
  return `Historical timeline with ${s.events.length} events: ${evList || 'none'}.`
}

function detectStruggle(history: StateSnapshot<TimelineState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 6) {
    const counts = recent.map(s => s.state.events.length)
    const allSame = counts.every(c => c === counts[0])
    if (allSame) return { struggling: true as const, reason: 'stuck-same-state' as const }
  }
  return { struggling: false as const }
}

export const historyTimelinePlugin: WidgetPlugin<TimelineState> = {
  id: 'history-timeline',
  name: 'Timeline Builder',
  description: 'Build and annotate historical timelines — add events, years, and significance notes.',
  subjects: ['nsc-history', 'zol-history', 'zal-history', 'igcse-history', 'cal-history'],
  icon: '🕰️',
  defaultState,
  Component: TimelineWidget,
  describeState,
  detectStruggle,
}
