import type { WidgetPlugin, StateSnapshot } from '../types'
import BinaryConverter, { type BinaryConverterState, defaultState as binaryDefault } from './BinaryConverter'
import TraceTable, { type TraceTableState, defaultState as traceDefault } from './TraceTable'

const CS_SUBJECTS = [
  'nsc-computer-science',
  'zol-computer-science',
  'zal-computer-science',
  'igcse-computer-sci',
  'igcse-ict',
  'cal-computer-science',
]

// ─── Binary Converter Plugin ──────────────────────────────────────
function describeBinary(s: BinaryConverterState): string {
  const baseNames: Record<number, string> = { 2: 'binary', 8: 'octal', 10: 'decimal', 16: 'hexadecimal' }
  const decimal = parseInt(s.inputValue, s.inputBase)
  if (isNaN(decimal)) return `Binary converter: invalid input "${s.inputValue}" in base ${s.inputBase}.`
  return (
    `Number converter: "${s.inputValue}" in ${baseNames[s.inputBase]} (decimal = ${decimal}). ` +
    `Binary: ${decimal.toString(2)}, Octal: ${decimal.toString(8)}, ` +
    `Hexadecimal: ${decimal.toString(16).toUpperCase()}. Steps shown: ${s.showSteps}.`
  )
}

function detectBinaryStruggle(history: StateSnapshot<BinaryConverterState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 6) {
    const values = recent.map(s => s.state.inputValue)
    const allSame = values.every(v => v === values[0])
    if (allSame) return { struggling: true as const, reason: 'stuck-same-state' as const }
  }
  return { struggling: false as const }
}

export const csBinaryConverterPlugin: WidgetPlugin<BinaryConverterState> = {
  id: 'cs-binary-converter',
  name: 'Binary/Hex Converter',
  description: 'Convert numbers between binary, octal, decimal and hexadecimal with step-by-step working shown.',
  subjects: CS_SUBJECTS,
  icon: '💻',
  defaultState: binaryDefault,
  Component: BinaryConverter,
  describeState: describeBinary,
  detectStruggle: detectBinaryStruggle,
}

// ─── Trace Table Plugin ────────────────────────────────────────────
function describeTrace(s: TraceTableState): string {
  const varList = s.variables.join(', ')
  const rowSummary = s.rows.map((r, i) =>
    `Row ${i + 1}: ${s.variables.map(v => `${v}=${r[v] || '?'}`).join(', ')}`
  ).join('; ')
  return (
    `Trace table with variables: ${varList}. ` +
    `Code: "${s.code.slice(0, 80)}${s.code.length > 80 ? '...' : ''}". ` +
    `${s.rows.length} rows: ${rowSummary}.`
  )
}

function detectTraceStruggle(history: StateSnapshot<TraceTableState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 7) {
    return { struggling: true as const, reason: 'many-changes-no-check' as const }
  }
  return { struggling: false as const }
}

export const csTraceTablePlugin: WidgetPlugin<TraceTableState> = {
  id: 'cs-trace-table',
  name: 'Algorithm Trace Table',
  description: 'Trace algorithms step-by-step — enter pseudocode, define variables, and fill in the trace table.',
  subjects: CS_SUBJECTS,
  icon: '📊',
  defaultState: traceDefault,
  Component: TraceTable,
  describeState: describeTrace,
  detectStruggle: detectTraceStruggle,
}
