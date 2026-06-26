import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface TimelineEvent {
  id: string
  year: string
  event: string
  significance: string
}

export interface TimelineState extends Record<string, unknown> {
  events: TimelineEvent[]
}

export const defaultState: TimelineState = {
  events: [
    { id: 'ev1', year: '1914', event: 'World War I begins', significance: 'Started in Sarajevo' },
    { id: 'ev2', year: '1918', event: 'WWI ends', significance: 'Treaty of Versailles' },
  ],
}

const DOT_COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#06b6d4', '#84cc16', '#fb923c']

export default function TimelineWidget({ state, onChange, onCheck }: WidgetProps<TimelineState>) {
  const { events } = state
  const [newYear, setNewYear] = useState('')
  const [newEvent, setNewEvent] = useState('')
  const [newSig, setNewSig] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  const sorted = [...events].sort((a, b) => {
    const ya = parseInt(a.year) || 0
    const yb = parseInt(b.year) || 0
    return ya - yb
  })

  const W = 360, H = 160
  const padL = 20, padR = 20
  const lineY = H / 2
  const plotW = W - padL - padR

  function getX(idx: number) {
    if (sorted.length <= 1) return padL + plotW / 2
    const years = sorted.map(e => parseInt(e.year) || 0)
    const minY = Math.min(...years)
    const maxY = Math.max(...years)
    const span = maxY - minY
    if (span === 0) return padL + plotW / 2
    if (span <= 200) {
      // Proportional
      const y = parseInt(sorted[idx].year) || 0
      return padL + ((y - minY) / span) * plotW
    }
    // Even spacing
    return padL + (idx / Math.max(sorted.length - 1, 1)) * plotW
  }

  function addEvent() {
    if (!newYear.trim() || !newEvent.trim()) return
    const id = 'ev' + Date.now()
    onChange({ ...state, events: [...events, { id, year: newYear.trim(), event: newEvent.trim(), significance: newSig.trim() }] })
    setNewYear('')
    setNewEvent('')
    setNewSig('')
    setShowAdd(false)
  }

  function removeEvent(id: string) {
    onChange({ ...state, events: events.filter(e => e.id !== id) })
    if (editing === id) setEditing(null)
  }

  function updateEvent(id: string, field: keyof Omit<TimelineEvent, 'id'>, val: string) {
    onChange({ ...state, events: events.map(e => e.id === id ? { ...e, [field]: val } : e) })
  }

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      <span className="text-slate-300 font-semibold">Timeline Builder</span>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0d0d1f' }}>
        {/* Timeline line */}
        <line x1={padL} y1={lineY} x2={W - padR} y2={lineY} stroke="#ffffff30" strokeWidth="2" />
        <polygon points={`${W - padR},${lineY} ${W - padR - 6},${lineY - 4} ${W - padR - 6},${lineY + 4}`} fill="#ffffff30" />

        {sorted.map((ev, i) => {
          const x = getX(i)
          const above = i % 2 === 0
          const color = DOT_COLORS[i % DOT_COLORS.length]
          const textY = above ? lineY - 18 : lineY + 30
          const yearY = above ? lineY - 8 : lineY + 20
          const connY2 = above ? lineY - 4 : lineY + 4
          const connY1 = above ? textY + 12 : textY - 4

          return (
            <g key={ev.id} style={{ cursor: 'pointer' }} onClick={() => setEditing(editing === ev.id ? null : ev.id)}>
              {/* Connector */}
              <line x1={x} y1={connY1} x2={x} y2={connY2} stroke={color} strokeWidth="1" opacity="0.6" />
              {/* Dot */}
              <circle cx={x} cy={lineY} r="5" fill={color} />
              {/* Year */}
              <text x={x} y={yearY} textAnchor="middle" fill={color} fontSize="7" fontWeight="600">{ev.year}</text>
              {/* Event label */}
              <text x={x} y={textY} textAnchor="middle" fill="white" fontSize="8" fontWeight="600">
                {ev.event.length > 14 ? ev.event.slice(0, 14) + '…' : ev.event}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Editing panel */}
      {editing && (() => {
        const ev = events.find(e => e.id === editing)
        if (!ev) return null
        return (
          <div className="bg-white/5 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Edit event</span>
              <button onClick={() => removeEvent(editing)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
            </div>
            {([
              { field: 'year', label: 'Year', placeholder: '1914' },
              { field: 'event', label: 'Event', placeholder: 'Event name' },
              { field: 'significance', label: 'Significance', placeholder: 'Brief note' },
            ] as const).map(({ field, label, placeholder }) => (
              <div key={field} className="flex items-center gap-2">
                <span className="w-20 text-slate-400 shrink-0">{label}</span>
                <input value={ev[field]} onChange={e => updateEvent(editing, field, e.target.value)}
                  placeholder={placeholder} maxLength={field === 'year' ? 10 : 80}
                  className="flex-1 bg-white/10 rounded px-2 py-1 text-white text-xs outline-none" />
              </div>
            ))}
          </div>
        )
      })()}

      {/* Add event form */}
      {showAdd ? (
        <div className="bg-white/5 rounded-xl p-3 space-y-2">
          {([
            { val: newYear, set: setNewYear, label: 'Year', placeholder: '1969', maxLen: 10 },
            { val: newEvent, set: setNewEvent, label: 'Event', placeholder: 'Moon landing', maxLen: 80 },
            { val: newSig, set: setNewSig, label: 'Significance', placeholder: 'Brief note', maxLen: 100 },
          ] as const).map(({ val, set, label, placeholder, maxLen }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-20 text-slate-400 shrink-0">{label}</span>
              <input value={val} onChange={e => set(e.target.value)}
                placeholder={placeholder} maxLength={maxLen}
                className="flex-1 bg-white/10 rounded px-2 py-1 text-white text-xs outline-none" />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={addEvent} className="flex-1 py-1 bg-indigo-600/70 rounded text-xs text-white">Add Event</button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-1 bg-white/10 rounded text-xs text-slate-400">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all">
          + Add Event
        </button>
      )}

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
