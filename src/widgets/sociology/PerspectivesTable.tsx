import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface SociologyState extends Record<string, unknown> {
  topic: string
  notes: Record<string, string>
  activeTab: string
}

const PERSPECTIVES = [
  { id: 'functionalism', name: 'Functionalism', color: 'indigo', keyTheorists: 'Durkheim, Parsons', coreClaim: 'Society is a system of interconnected parts working together for stability.' },
  { id: 'marxism', name: 'Marxism', color: 'red', keyTheorists: 'Marx, Engels', coreClaim: 'Society is shaped by conflict between bourgeoisie and proletariat over economic power.' },
  { id: 'feminism', name: 'Feminism', color: 'pink', keyTheorists: 'Oakley, Walby', coreClaim: 'Society is patriarchal — gender inequality benefits men at the expense of women.' },
  { id: 'interactionism', name: 'Interactionism', color: 'amber', keyTheorists: 'Mead, Goffman', coreClaim: 'Society is constructed through small-scale face-to-face interactions and shared meanings.' },
  { id: 'postmodernism', name: 'Postmodernism', color: 'purple', keyTheorists: 'Baudrillard, Lyotard', coreClaim: 'No single "grand narrative" — society is fragmented, diverse, and media-saturated.' },
]

export const defaultState: SociologyState = {
  topic: '',
  notes: Object.fromEntries(PERSPECTIVES.map(p => [p.id, ''])),
  activeTab: 'functionalism',
}

export default function PerspectivesTable({ state, onChange, onCheck }: WidgetProps<SociologyState>) {
  const [activeTab, setActiveTab] = useState(state.activeTab || 'functionalism')
  const perspective = PERSPECTIVES.find(p => p.id === activeTab)!

  const updateNote = (pid: string, val: string) => onChange({ ...state, notes: { ...state.notes, [pid]: val }, activeTab: pid })

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      <input
        value={state.topic}
        onChange={e => onChange({ ...state, topic: e.target.value })}
        placeholder="Topic e.g. Family, Education, Crime…"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
      />

      {/* Perspective tabs */}
      <div className="flex gap-1 flex-wrap">
        {PERSPECTIVES.map(p => (
          <button key={p.id} onClick={() => { setActiveTab(p.id); onChange({ ...state, activeTab: p.id }) }}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all border ${activeTab === p.id ? `border-${p.color}-500/50 bg-${p.color}-500/20 text-${p.color}-300` : 'border-white/10 text-slate-500 hover:text-white'}`}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Active perspective card */}
      <div className={`rounded-xl border border-${perspective.color}-500/25 overflow-hidden`}>
        <div className={`px-3 py-2 bg-${perspective.color}-500/10 border-b border-${perspective.color}-500/20`}>
          <p className={`text-xs font-semibold text-${perspective.color}-300`}>{perspective.name}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Key: {perspective.keyTheorists}</p>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{perspective.coreClaim}</p>
        </div>
        <textarea
          value={(state.notes as Record<string, string>)[perspective.id] || ''}
          onChange={e => updateNote(perspective.id, e.target.value)}
          placeholder={`Apply ${perspective.name} to "${state.topic || 'your topic'}"…`}
          rows={5}
          className="w-full bg-transparent px-3 py-2 text-xs text-white/85 placeholder:text-slate-600 resize-none focus:outline-none"
        />
      </div>

      {/* Progress — show how many perspectives have notes */}
      <div className="flex gap-1.5 items-center">
        {PERSPECTIVES.map(p => {
          const hasNote = !!(state.notes as Record<string, string>)[p.id]
          return <div key={p.id} className={`flex-1 h-1 rounded-full ${hasNote ? `bg-${p.color}-500` : 'bg-white/10'}`} title={p.name} />
        })}
        <span className="text-[10px] text-slate-500 ml-1">{PERSPECTIVES.filter(p => !!(state.notes as Record<string, string>)[p.id]).length}/5 done</span>
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-teal-600/70 hover:bg-teal-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
