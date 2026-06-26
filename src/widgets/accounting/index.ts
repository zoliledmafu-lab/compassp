import type { WidgetPlugin, StateSnapshot } from '../types'
import TAccount, { type TAccountState, defaultState } from './TAccount'

function fmtMoney(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function describeState(s: TAccountState): string {
  const debitTotal = s.entries.reduce((sum, e) => sum + e.debit, 0)
  const creditTotal = s.entries.reduce((sum, e) => sum + e.credit, 0)
  const balance = debitTotal - creditTotal
  const entries = s.entries.map(e =>
    e.debit > 0 ? `Dr ${e.description} ${fmtMoney(e.debit)}` : `Cr ${e.description} ${fmtMoney(e.credit)}`
  ).join('; ')
  return (
    `T-Account: "${s.accountName}". Entries: ${entries || 'none'}. ` +
    `Debit total = ${fmtMoney(debitTotal)}, Credit total = ${fmtMoney(creditTotal)}, ` +
    `Balance = ${balance >= 0 ? 'Dr' : 'Cr'} ${fmtMoney(Math.abs(balance))}.`
  )
}

function detectStruggle(history: StateSnapshot<TAccountState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-8)
  const hasChecked = recent.some(s => s.trigger === 'check')
  if (!hasChecked && recent.length >= 6) {
    const counts = recent.map(s => s.state.entries.length)
    const allSame = counts.every(c => c === counts[0])
    if (allSame) return { struggling: true as const, reason: 'stuck-same-state' as const }
  }
  return { struggling: false as const }
}

export const accountingTAccountPlugin: WidgetPlugin<TAccountState> = {
  id: 'accounting-taccount',
  name: 'T-Account',
  description: 'Build T-accounts with debit and credit entries — see totals and balance automatically calculated.',
  subjects: ['nsc-accounting', 'zol-accounts', 'zal-accounting', 'igcse-accounting', 'cal-accounting'],
  icon: '⚖️',
  defaultState,
  Component: TAccount,
  describeState,
  detectStruggle,
}
