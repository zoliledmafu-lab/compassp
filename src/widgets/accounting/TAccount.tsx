import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface TAccountEntry {
  id: string
  description: string
  debit: number
  credit: number
}

export interface TAccountState extends Record<string, unknown> {
  accountName: string
  entries: TAccountEntry[]
}

export const defaultState: TAccountState = {
  accountName: 'Cash',
  entries: [
    { id: 'e1', description: 'Capital introduced', debit: 10000, credit: 0 },
    { id: 'e2', description: 'Rent paid', debit: 0, credit: 1200 },
  ],
}

function fmtMoney(n: number) {
  if (n === 0) return ''
  return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function TAccount({ state, onChange, onCheck }: WidgetProps<TAccountState>) {
  const { accountName, entries } = state
  const [showForm, setShowForm] = useState(false)
  const [desc, setDesc] = useState('')
  const [side, setSide] = useState<'debit' | 'credit'>('debit')
  const [amount, setAmount] = useState('')

  const debitTotal = entries.reduce((s, e) => s + e.debit, 0)
  const creditTotal = entries.reduce((s, e) => s + e.credit, 0)
  const balance = debitTotal - creditTotal

  function addEntry() {
    const amt = parseFloat(amount)
    if (!desc.trim() || isNaN(amt) || amt <= 0) return
    const id = 'e' + Date.now()
    const entry: TAccountEntry = { id, description: desc.trim(), debit: side === 'debit' ? amt : 0, credit: side === 'credit' ? amt : 0 }
    onChange({ ...state, entries: [...entries, entry] })
    setDesc('')
    setAmount('')
    setShowForm(false)
  }

  function removeEntry(id: string) {
    onChange({ ...state, entries: entries.filter(e => e.id !== id) })
  }

  const debitEntries = entries.filter(e => e.debit > 0)
  const creditEntries = entries.filter(e => e.credit > 0)
  const maxRows = Math.max(debitEntries.length, creditEntries.length)

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      {/* Account name */}
      <input
        value={accountName}
        onChange={e => onChange({ ...state, accountName: e.target.value })}
        className="w-full text-center bg-white/10 rounded-lg px-3 py-1.5 text-white text-sm font-semibold outline-none"
        placeholder="Account Name"
        maxLength={40}
      />

      {/* T-Account */}
      <div className="rounded-lg overflow-hidden border border-white/15" style={{ background: '#0d0d1f' }}>
        {/* Header row */}
        <div className="grid grid-cols-2 border-b border-white/15">
          <div className="text-center py-1.5 text-slate-300 font-semibold border-r border-white/15">DEBIT (Dr)</div>
          <div className="text-center py-1.5 text-slate-300 font-semibold">CREDIT (Cr)</div>
        </div>

        {/* Entries */}
        {Array.from({ length: Math.max(maxRows, 1) }).map((_, i) => {
          const dr = debitEntries[i]
          const cr = creditEntries[i]
          return (
            <div key={i} className="grid grid-cols-2 border-b border-white/5">
              <div className="flex items-center justify-between px-2 py-1 border-r border-white/10 min-h-[28px]">
                {dr ? (
                  <>
                    <span className="text-slate-300 truncate mr-1 flex-1">{dr.description}</span>
                    <span className="text-green-400 font-mono shrink-0">{fmtMoney(dr.debit)}</span>
                    <button onClick={() => removeEntry(dr.id)} className="ml-1 text-slate-600 hover:text-red-400 text-xs">×</button>
                  </>
                ) : null}
              </div>
              <div className="flex items-center justify-between px-2 py-1 min-h-[28px]">
                {cr ? (
                  <>
                    <span className="text-slate-300 truncate mr-1 flex-1">{cr.description}</span>
                    <span className="text-red-400 font-mono shrink-0">{fmtMoney(cr.credit)}</span>
                    <button onClick={() => removeEntry(cr.id)} className="ml-1 text-slate-600 hover:text-red-400 text-xs">×</button>
                  </>
                ) : null}
              </div>
            </div>
          )
        })}

        {/* Balance c/d */}
        {balance !== 0 && (
          <div className="grid grid-cols-2 border-b border-white/10 bg-white/3">
            <div className="flex items-center justify-between px-2 py-1 border-r border-white/10">
              {balance < 0 && (
                <>
                  <span className="text-slate-400 italic">Balance c/d</span>
                  <span className="text-yellow-400 font-mono">{fmtMoney(Math.abs(balance))}</span>
                </>
              )}
            </div>
            <div className="flex items-center justify-between px-2 py-1">
              {balance > 0 && (
                <>
                  <span className="text-slate-400 italic">Balance c/d</span>
                  <span className="text-yellow-400 font-mono">{fmtMoney(balance)}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="grid grid-cols-2 bg-white/5">
          <div className="flex items-center justify-between px-2 py-1.5 border-r border-white/15">
            <span className="text-slate-400 font-semibold">Total</span>
            <span className="text-green-300 font-mono font-semibold">{fmtMoney(Math.max(debitTotal, creditTotal))}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-slate-400 font-semibold">Total</span>
            <span className="text-green-300 font-mono font-semibold">{fmtMoney(Math.max(debitTotal, creditTotal))}</span>
          </div>
        </div>
      </div>

      {/* Balance info */}
      <div className="bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
        <span className="text-slate-400">Balance:</span>
        <span className={`font-mono font-semibold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {balance >= 0 ? 'Dr' : 'Cr'} {fmtMoney(Math.abs(balance))}
        </span>
      </div>

      {/* Add entry form */}
      {showForm ? (
        <div className="bg-white/5 rounded-lg p-3 space-y-2">
          <input value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Description"
            className="w-full bg-white/10 rounded px-2 py-1 text-white text-xs outline-none" />
          <div className="flex gap-2">
            <div className="flex gap-1 flex-1">
              {(['debit', 'credit'] as const).map(s => (
                <button key={s} onClick={() => setSide(s)}
                  className={`flex-1 py-1 rounded text-xs transition-all ${side === s ? 'bg-indigo-600/70 text-white' : 'bg-white/5 text-slate-400'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <input value={amount} onChange={e => setAmount(e.target.value)}
              type="number" min={0} placeholder="Amount"
              className="w-24 bg-white/10 rounded px-2 py-1 text-white text-xs outline-none font-mono" />
          </div>
          <div className="flex gap-2">
            <button onClick={addEntry} className="flex-1 py-1 bg-indigo-600/70 rounded text-xs text-white">Add Entry</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1 bg-white/10 rounded text-xs text-slate-400">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all">
          + Add Entry
        </button>
      )}

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
