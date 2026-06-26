import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface TraceTableState extends Record<string, unknown> {
  variables: string[]
  rows: Array<Record<string, string>>
  code: string
}

export const defaultState: TraceTableState = {
  variables: ['x', 'y', 'output'],
  rows: [
    { x: '1', y: '2', output: '' },
    { x: '3', y: '4', output: '' },
  ],
  code: 'FOR i = 1 TO 5\n  x = x + 1\n  OUTPUT x\nNEXT i',
}

export default function TraceTable({ state, onChange, onCheck }: WidgetProps<TraceTableState>) {
  const { variables, rows, code } = state
  const [newVar, setNewVar] = useState('')

  function addVariable() {
    const v = newVar.trim()
    if (!v || variables.includes(v)) return
    const newRows = rows.map(r => ({ ...r, [v]: '' }))
    onChange({ ...state, variables: [...variables, v], rows: newRows })
    setNewVar('')
  }

  function removeVariable(v: string) {
    if (variables.length <= 1) return
    const newVars = variables.filter(x => x !== v)
    const newRows = rows.map(r => {
      const nr = { ...r }
      delete nr[v]
      return nr
    })
    onChange({ ...state, variables: newVars, rows: newRows })
  }

  function addRow() {
    const emptyRow: Record<string, string> = {}
    variables.forEach(v => { emptyRow[v] = '' })
    onChange({ ...state, rows: [...rows, emptyRow] })
  }

  function removeRow(idx: number) {
    if (rows.length <= 1) return
    onChange({ ...state, rows: rows.filter((_, i) => i !== idx) })
  }

  function updateCell(rowIdx: number, variable: string, value: string) {
    const newRows = rows.map((r, i) => i === rowIdx ? { ...r, [variable]: value } : r)
    onChange({ ...state, rows: newRows })
  }

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      <span className="text-slate-300 font-semibold">Algorithm Trace Table</span>

      {/* Code area */}
      <div>
        <p className="text-slate-500 mb-1" style={{ fontSize: 10 }}>Pseudocode / Algorithm</p>
        <textarea
          value={code}
          onChange={e => onChange({ ...state, code: e.target.value })}
          rows={4}
          className="w-full rounded-xl px-3 py-2 text-green-300 font-mono outline-none resize-none border border-white/10 focus:border-white/20 transition-colors"
          style={{ background: '#0d0d1f', fontSize: 11 }}
          spellCheck={false}
        />
      </div>

      {/* Variable pills */}
      <div>
        <p className="text-slate-500 mb-1.5" style={{ fontSize: 10 }}>Variables (columns)</p>
        <div className="flex flex-wrap gap-1.5 items-center">
          {variables.map(v => (
            <span key={v} className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1 font-mono text-white">
              {v}
              <button onClick={() => removeVariable(v)}
                className="text-slate-500 hover:text-red-400 ml-0.5 font-bold" style={{ fontSize: 10 }}>×</button>
            </span>
          ))}
          <div className="flex gap-1">
            <input
              value={newVar}
              onChange={e => setNewVar(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addVariable()}
              placeholder="var"
              className="bg-white/5 border border-white/10 rounded-full px-2.5 py-1 font-mono text-white outline-none w-16"
              style={{ fontSize: 11 }}
              maxLength={12}
            />
            <button onClick={addVariable}
              className="px-2 py-1 bg-indigo-600/50 rounded-full text-xs text-white hover:bg-indigo-600/70 transition-all">
              +
            </button>
          </div>
        </div>
      </div>

      {/* Trace table */}
      <div className="rounded-xl overflow-hidden border border-white/10" style={{ background: '#0d0d1f' }}>
        {/* Header */}
        <div className="flex border-b border-white/10" style={{ background: '#ffffff08' }}>
          <div className="w-8 py-1.5 text-center text-slate-500 shrink-0" style={{ fontSize: 9 }}>#</div>
          {variables.map(v => (
            <div key={v} className="flex-1 py-1.5 text-center text-slate-300 font-mono font-semibold border-l border-white/10" style={{ fontSize: 10 }}>
              {v}
            </div>
          ))}
          <div className="w-7 shrink-0 border-l border-white/10" />
        </div>

        {/* Rows */}
        <div className="max-h-48 overflow-y-auto">
          {rows.map((row, ri) => (
            <div key={ri} className="flex border-b border-white/5 hover:bg-white/2 transition-colors">
              <div className="w-8 py-1 text-center text-slate-600 shrink-0 flex items-center justify-center" style={{ fontSize: 9 }}>
                {ri + 1}
              </div>
              {variables.map(v => (
                <div key={v} className="flex-1 border-l border-white/5">
                  <input
                    value={row[v] ?? ''}
                    onChange={e => updateCell(ri, v, e.target.value)}
                    className="w-full py-1 px-1.5 bg-transparent text-white font-mono text-center outline-none focus:bg-white/5 transition-colors"
                    style={{ fontSize: 11 }}
                  />
                </div>
              ))}
              <div className="w-7 shrink-0 border-l border-white/5 flex items-center justify-center">
                <button onClick={() => removeRow(ri)}
                  className="text-slate-600 hover:text-red-400 font-bold" style={{ fontSize: 10 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row controls */}
      <div className="flex gap-2">
        <button onClick={addRow}
          className="flex-1 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all">
          + Add Row
        </button>
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
