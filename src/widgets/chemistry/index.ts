import type { WidgetPlugin, StateSnapshot } from '../types'
import TitrationCurve, { type TitrationState, defaultState as titrationDefault } from './TitrationCurve'
import PeriodicTableWidget, { type PeriodicTableState, defaultState as periodicDefault } from './PeriodicTable'

const CHEMISTRY_SUBJECTS = [
  'nsc-physical-sciences',
  'zol-chemistry',
  'zal-chemistry',
  'igcse-chemistry',
  'cal-chemistry',
  'zol-combined-science',
  'igcse-combined-sci',
]

// ─── Titration Plugin ─────────────────────────────────────────────
function describeTitration(s: TitrationState): string {
  const epPH =
    s.acidType === 'strong' && s.baseType === 'strong' ? 7
    : s.acidType === 'weak' && s.baseType === 'strong' ? 9
    : s.acidType === 'strong' && s.baseType === 'weak' ? 5
    : 7
  const indicator =
    s.acidType === 'strong' && s.baseType === 'strong' ? 'Methyl orange or Phenolphthalein'
    : s.acidType === 'weak' && s.baseType === 'strong' ? 'Phenolphthalein'
    : s.acidType === 'strong' && s.baseType === 'weak' ? 'Methyl orange'
    : 'No sharp indicator'
  return (
    `Titration curve: ${s.acidType} acid + ${s.baseType} base, concentration = ${s.concentration.toFixed(2)} M. ` +
    `Equivalence point pH ≈ ${epPH}. Recommended indicator: ${indicator}.`
  )
}

function detectTitrationStruggle(history: StateSnapshot<TitrationState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 6) {
    const types = recent.map(s => s.state.acidType + s.state.baseType)
    const allSame = types.every(t => t === types[0])
    if (allSame) return { struggling: true as const, reason: 'stuck-same-state' as const }
  }
  return { struggling: false as const }
}

export const chemistryTitrationPlugin: WidgetPlugin<TitrationState> = {
  id: 'chemistry-titration',
  name: 'Titration Curve',
  description: 'Visualise pH vs volume curves for strong/weak acid-base combinations with equivalence point and indicator ranges.',
  subjects: CHEMISTRY_SUBJECTS,
  icon: '🧪',
  defaultState: titrationDefault,
  Component: TitrationCurve,
  describeState: describeTitration,
  detectStruggle: detectTitrationStruggle,
}

// ─── Periodic Table Plugin ────────────────────────────────────────
function describePeriodic(s: PeriodicTableState): string {
  const sel = s.searchElement ? `Search: "${s.searchElement}". ` : ''
  const grp = s.selectedGroup !== null ? `Selected group: ${s.selectedGroup}. ` : ''
  return `Periodic table mini (elements 1–20). ${sel}${grp}`.trim()
}

function detectPeriodicStruggle(history: StateSnapshot<PeriodicTableState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 7) {
    return { struggling: true as const, reason: 'many-changes-no-check' as const }
  }
  return { struggling: false as const }
}

export const chemistryPeriodicPlugin: WidgetPlugin<PeriodicTableState> = {
  id: 'chemistry-periodic',
  name: 'Periodic Table',
  description: 'Interactive mini periodic table for elements 1–20 with element details, categories, and search.',
  subjects: CHEMISTRY_SUBJECTS,
  icon: '⚗',
  defaultState: periodicDefault,
  Component: PeriodicTableWidget,
  describeState: describePeriodic,
  detectStruggle: detectPeriodicStruggle,
}
