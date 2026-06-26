import type { WidgetPlugin, StateSnapshot } from '../types'
import VocabBuilder, { type VocabState, defaultState } from './VocabBuilder'

function describeState(s: VocabState): string {
  const mastered = s.words.filter(w => w.mastered).length
  return `${s.language} vocabulary: ${s.words.length} words, ${mastered} mastered. Words: ${s.words.slice(0, 5).map(w => w.word).join(', ')}.`
}

function detectStruggle(history: StateSnapshot<VocabState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-6)
  const hasChecked = recent.some(s => s.trigger === 'check')
  const noMastered = recent.every(s => s.state.words.filter(w => w.mastered).length === 0)
  if (noMastered && recent[0].state.words.length > 3 && !hasChecked) return { struggling: true as const, reason: 'not-mastering' as const }
  return { struggling: false as const }
}

const LANGUAGE_SUBJECTS = [
  'igcse-french', 'nsc-isizulu', 'nsc-afrikaans', 'zol-shona', 'zol-ndebele',
  'zol-english-language', 'igcse-english-lang', 'cal-english-language',
]

export const vocabBuilderPlugin: WidgetPlugin<VocabState> = {
  id: 'languages-vocab',
  name: 'Vocabulary Builder',
  description: 'Build and quiz yourself on vocabulary with flashcard mode.',
  subjects: LANGUAGE_SUBJECTS,
  icon: '🗣️',
  defaultState,
  Component: VocabBuilder,
  describeState,
  detectStruggle,
}
