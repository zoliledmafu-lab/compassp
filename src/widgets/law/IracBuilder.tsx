import type { WidgetProps } from '../types'

export interface IracState extends Record<string, unknown> {
  scenario: string
  issue: string
  rule: string
  application: string
  conclusion: string
  caseType: 'criminal' | 'contract' | 'tort'
}

export const defaultState: IracState = {
  scenario: '',
  issue: '',
  rule: '',
  application: '',
  conclusion: '',
  caseType: 'criminal',
}

const SECTIONS: Array<{ key: keyof IracState; letter: string; label: string; hint: string; color: string; rows: number }> = [
  { key: 'issue', letter: 'I', label: 'Issue', hint: 'What legal question does the court need to answer?', color: 'indigo', rows: 2 },
  { key: 'rule', letter: 'R', label: 'Rule', hint: 'What is the relevant law, statute, or precedent?', color: 'cyan', rows: 3 },
  { key: 'application', letter: 'A', label: 'Application', hint: 'Apply the rule to the facts of this case.', color: 'purple', rows: 4 },
  { key: 'conclusion', letter: 'C', label: 'Conclusion', hint: 'What outcome would a court likely reach and why?', color: 'green', rows: 2 },
]

export default function IracBuilder({ state, onChange, onCheck }: WidgetProps<IracState>) {
  const update = (key: keyof IracState, val: string) => onChange({ ...state, [key]: val })

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      {/* Case type + scenario */}
      <div className="glass rounded-xl p-3 border border-slate-500/20">
        <div className="flex gap-1 mb-2">
          {(['criminal', 'contract', 'tort'] as const).map(t => (
            <button key={t} onClick={() => onChange({ ...state, caseType: t })}
              className={`flex-1 py-1 rounded-lg text-[10px] font-medium capitalize transition-all ${state.caseType === t ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>
        <textarea
          value={state.scenario}
          onChange={e => update('scenario', e.target.value)}
          placeholder="Paste the problem scenario here…"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-slate-500 resize-none focus:outline-none"
        />
      </div>

      {/* IRAC sections */}
      {SECTIONS.map(({ key, letter, label, hint, color, rows }) => (
        <div key={key} className={`rounded-xl border border-${color}-500/25 overflow-hidden`}>
          <div className={`flex items-center gap-2 px-3 py-1.5 bg-${color}-500/10`}>
            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold bg-${color}-500/30 text-${color}-300`}>{letter}</span>
            <span className={`text-xs font-semibold text-${color}-300`}>{label}</span>
            <span className="text-slate-600 text-[10px] ml-auto">{hint}</span>
          </div>
          <textarea
            value={state[key] as string}
            onChange={e => update(key, e.target.value)}
            placeholder={`Write your ${label.toLowerCase()} here…`}
            rows={rows}
            className="w-full bg-transparent px-3 py-2 text-xs text-white/85 placeholder:text-slate-600 resize-none focus:outline-none"
          />
        </div>
      ))}

      {/* Word count hint */}
      {state.application && (
        <p className="text-[10px] text-slate-600 text-right">Application: {state.application.split(/\s+/).filter(Boolean).length} words</p>
      )}

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-slate-600/70 hover:bg-slate-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
