import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface SwotState extends Record<string, unknown> {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
  businessName: string
}

export const defaultState: SwotState = {
  businessName: 'My Business',
  strengths: ['Strong brand'],
  weaknesses: ['Limited capital'],
  opportunities: ['Growing market'],
  threats: ['New competitors'],
}

type QuadrantKey = 'strengths' | 'weaknesses' | 'opportunities' | 'threats'

const QUADRANTS: { key: QuadrantKey; label: string; color: string; bg: string }[] = [
  { key: 'strengths',    label: 'Strengths',    color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  { key: 'weaknesses',   label: 'Weaknesses',   color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
  { key: 'opportunities',label: 'Opportunities',color: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
  { key: 'threats',      label: 'Threats',      color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
]

export default function SwotAnalysis({ state, onChange, onCheck }: WidgetProps<SwotState>) {
  const [newItems, setNewItems] = useState<Record<QuadrantKey, string>>({
    strengths: '', weaknesses: '', opportunities: '', threats: '',
  })

  function addItem(key: QuadrantKey) {
    const val = newItems[key].trim()
    if (!val || state[key].length >= 5) return
    onChange({ ...state, [key]: [...state[key], val] })
    setNewItems(prev => ({ ...prev, [key]: '' }))
  }

  function removeItem(key: QuadrantKey, idx: number) {
    onChange({ ...state, [key]: state[key].filter((_, i) => i !== idx) })
  }

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      {/* Business name */}
      <input
        value={state.businessName}
        onChange={e => onChange({ ...state, businessName: e.target.value })}
        placeholder="Business Name"
        className="w-full text-center bg-white/10 rounded-lg px-3 py-1.5 text-white text-sm font-semibold outline-none"
        maxLength={50}
      />

      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-2">
        {QUADRANTS.map(({ key, label, color, bg }) => (
          <div key={key} className="rounded-xl p-2.5 flex flex-col gap-1.5" style={{ background: bg, border: `1px solid ${color}30` }}>
            <p className="font-semibold" style={{ color, fontSize: 11 }}>{label}</p>

            {/* Items */}
            <ul className="space-y-1">
              {state[key].map((item, idx) => (
                <li key={idx} className="flex items-start gap-1 group">
                  <span className="text-slate-300 flex-1 leading-tight">{item}</span>
                  <button onClick={() => removeItem(key, idx)}
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">×</button>
                </li>
              ))}
            </ul>

            {/* Add item */}
            {state[key].length < 5 && (
              <div className="flex gap-1 mt-auto">
                <input
                  value={newItems[key]}
                  onChange={e => setNewItems(prev => ({ ...prev, [key]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addItem(key)}
                  placeholder="Add item..."
                  className="flex-1 bg-black/20 rounded px-1.5 py-0.5 text-white text-xs outline-none"
                  maxLength={60}
                />
                <button onClick={() => addItem(key)}
                  className="px-1.5 py-0.5 rounded text-xs transition-all"
                  style={{ background: color + '40', color }}>
                  +
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
