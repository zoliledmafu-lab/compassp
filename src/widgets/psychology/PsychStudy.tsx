import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface PsychStudyState extends Record<string, unknown> {
  studyName: string
  researcher: string
  year: string
  aim: string
  procedure: string
  findings: string
  conclusions: string
  evaluation: string
  approach: string
}

export const defaultState: PsychStudyState = {
  studyName: 'Milgram (1963)',
  researcher: 'Stanley Milgram',
  year: '1963',
  aim: 'To investigate obedience to authority',
  procedure: '40 male participants told to administer electric shocks',
  findings: '65% delivered maximum 450V shock',
  conclusions: 'People obey authority even against moral principles',
  evaluation: '',
  approach: 'Behaviourist',
}

const APPROACHES = ['Behaviourist', 'Cognitive', 'Biological', 'Psychodynamic', 'Humanist', 'Social Learning', 'Socio-cultural']

export default function PsychStudy({ state, onChange, onCheck }: WidgetProps<PsychStudyState>) {
  const [activeTab, setActiveTab] = useState<'study' | 'evaluate'>('study')

  const update = (key: keyof PsychStudyState, val: string) => onChange({ ...state, [key]: val })

  const fields: Array<{ key: keyof PsychStudyState; label: string; color: string; rows?: number }> = [
    { key: 'aim', label: 'Aim', color: 'indigo', rows: 2 },
    { key: 'procedure', label: 'Procedure', color: 'cyan', rows: 3 },
    { key: 'findings', label: 'Findings', color: 'green', rows: 2 },
    { key: 'conclusions', label: 'Conclusions', color: 'purple', rows: 2 },
  ]

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      {/* Study header */}
      <div className="glass rounded-xl p-3 border border-indigo-500/20">
        <input
          value={state.studyName}
          onChange={e => update('studyName', e.target.value)}
          placeholder="Study name e.g. Milgram (1963)"
          className="w-full bg-transparent text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none mb-2"
        />
        <div className="flex gap-2">
          <input value={state.researcher} onChange={e => update('researcher', e.target.value)} placeholder="Researcher" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none" />
          <input value={state.year} onChange={e => update('year', e.target.value)} placeholder="Year" className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none" />
        </div>
        <div className="mt-2">
          <select value={state.approach} onChange={e => update('approach', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none">
            {APPROACHES.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
        {(['study', 'evaluate'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-1 rounded-md text-xs font-medium capitalize transition-all ${activeTab === t ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-white'}`}>{t === 'study' ? 'APFC Notes' : 'Evaluation'}</button>
        ))}
      </div>

      {activeTab === 'study' && (
        <div className="space-y-2">
          {fields.map(({ key, label, color, rows }) => (
            <div key={key} className={`rounded-xl border border-${color}-500/20 overflow-hidden`}>
              <div className={`px-3 py-1 bg-${color}-500/10`}>
                <span className={`text-[10px] font-semibold text-${color}-400 uppercase tracking-wider`}>{label}</span>
              </div>
              <textarea
                value={state[key] as string}
                onChange={e => update(key, e.target.value)}
                placeholder={`Describe the ${label.toLowerCase()}…`}
                rows={rows || 2}
                className="w-full bg-transparent px-3 py-2 text-xs text-white/85 placeholder:text-slate-600 resize-none focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'evaluate' && (
        <div className="space-y-2">
          <div className="rounded-xl border border-amber-500/20 overflow-hidden">
            <div className="px-3 py-1 bg-amber-500/10">
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Evaluation (Strengths & Weaknesses)</span>
            </div>
            <textarea
              value={state.evaluation}
              onChange={e => update('evaluation', e.target.value)}
              placeholder="Evaluate: reliability, validity, ethics, sample, methodology…"
              rows={6}
              className="w-full bg-transparent px-3 py-2 text-xs text-white/85 placeholder:text-slate-600 resize-none focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[
              { label: 'Researcher', value: state.researcher || '—' },
              { label: 'Year', value: state.year || '—' },
              { label: 'Approach', value: state.approach },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
                <p className="text-slate-500" style={{ fontSize: 9 }}>{s.label}</p>
                <p className="text-white font-semibold mt-0.5" style={{ fontSize: 10 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-pink-600/70 hover:bg-pink-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
