import type { WidgetProps } from '../types'

export interface EcoDataState extends Record<string, unknown> {
  topic: 'deforestation' | 'pollution' | 'population' | 'energy' | 'custom'
  locationName: string
  years: string[]
  values: number[]
  unit: string
  notes: string
}

const TOPIC_PRESETS: Record<EcoDataState['topic'], { label: string; unit: string; color: string; years: string[]; values: number[] }> = {
  deforestation: { label: 'Deforestation', unit: 'km²/year', color: '#22c55e', years: ['2018','2019','2020','2021','2022'], values: [120,145,168,190,210] },
  pollution:     { label: 'Air Pollution', unit: 'μg/m³ PM2.5', color: '#f59e0b', years: ['2018','2019','2020','2021','2022'], values: [42,45,38,49,51] },
  population:    { label: 'Population Growth', unit: 'millions', color: '#818cf8', years: ['2018','2019','2020','2021','2022'], values: [14.0,14.4,14.9,15.2,15.6] },
  energy:        { label: 'Energy Consumption', unit: 'TWh', color: '#38bdf8', years: ['2018','2019','2020','2021','2022'], values: [11.2,11.8,10.9,12.3,13.1] },
  custom:        { label: 'Custom Data', unit: 'units', color: '#a78bfa', years: ['2018','2019','2020','2021','2022'], values: [10,20,30,40,50] },
}

export const defaultState: EcoDataState = {
  topic: 'deforestation',
  locationName: 'Zimbabwe',
  years: TOPIC_PRESETS.deforestation.years,
  values: TOPIC_PRESETS.deforestation.values,
  unit: TOPIC_PRESETS.deforestation.unit,
  notes: '',
}

function fmt(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(1) }

export default function EcoDataChart({ state, onChange, onCheck }: WidgetProps<EcoDataState>) {
  const preset = TOPIC_PRESETS[state.topic]
  const W = 360, H = 160, pad = { l: 40, r: 12, t: 12, b: 28 }
  const chartW = W - pad.l - pad.r
  const chartH = H - pad.t - pad.b
  const maxV = Math.max(...state.values, 1)
  const barW = Math.max(16, (chartW / state.values.length) * 0.6)
  const gap = chartW / state.values.length

  const switchTopic = (topic: EcoDataState['topic']) => {
    const p = TOPIC_PRESETS[topic]
    onChange({ ...state, topic, unit: p.unit, years: [...p.years], values: [...p.values] })
  }

  const updateValue = (i: number, v: string) => {
    const vals = [...state.values]
    vals[i] = parseFloat(v) || 0
    onChange({ ...state, values: vals })
  }

  const trend = state.values.length > 1
    ? state.values[state.values.length - 1] > state.values[0] ? '↑ Increasing' : '↓ Decreasing'
    : '—'

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      {/* Topic selector */}
      <div className="flex gap-1 flex-wrap">
        {(Object.keys(TOPIC_PRESETS) as EcoDataState['topic'][]).map(t => (
          <button key={t} onClick={() => switchTopic(t)}
            className={`px-2 py-0.5 rounded-lg text-[10px] border capitalize transition-all ${state.topic === t ? 'border-green-500/40 bg-green-500/15 text-green-300' : 'border-white/10 text-slate-500 hover:text-white'}`}>
            {TOPIC_PRESETS[t].label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={state.locationName} onChange={e => onChange({ ...state, locationName: e.target.value })} placeholder="Location" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none" />
        <input value={state.unit} onChange={e => onChange({ ...state, unit: e.target.value })} placeholder="Unit" className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none" />
      </div>

      {/* Bar chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0d0d1f' }}>
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="#ffffff20" strokeWidth="1" />
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#ffffff20" strokeWidth="1" />
        {[0, 0.5, 1].map(r => {
          const y = pad.t + chartH * (1 - r)
          return (
            <g key={r}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#ffffff0a" strokeWidth="1" />
              <text x={pad.l - 4} y={y + 3} textAnchor="end" fill="#ffffff40" fontSize="8">{fmt(maxV * r)}</text>
            </g>
          )
        })}
        {state.values.map((v, i) => {
          const barH = (v / maxV) * chartH
          const x = pad.l + gap * i + (gap - barW) / 2
          const y = pad.t + chartH - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="3" fill={preset.color} opacity="0.8" />
              <text x={x + barW / 2} y={H - pad.b + 14} textAnchor="middle" fill="#ffffff60" fontSize="8">{state.years[i]}</text>
            </g>
          )
        })}
        <text x={W - pad.r} y={pad.t + 8} textAnchor="end" fill={preset.color} fontSize="8">{state.locationName}</text>
      </svg>

      {/* Year/value inputs */}
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${state.years.length}, 1fr)` }}>
        {state.years.map((y, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <input value={y} onChange={e => { const ys = [...state.years]; ys[i] = e.target.value; onChange({ ...state, years: ys }) }} className="w-full bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px] text-center text-slate-400 focus:outline-none" />
            <input type="number" value={state.values[i]} onChange={e => updateValue(i, e.target.value)} className="w-full bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px] text-center text-white focus:outline-none" />
          </div>
        ))}
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[
          { label: 'Trend', value: trend },
          { label: 'Peak', value: fmt(Math.max(...state.values)) + ' ' + state.unit },
          { label: 'Recent', value: fmt(state.values[state.values.length - 1]) + ' ' + state.unit },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
            <p className="text-slate-500" style={{ fontSize: 9 }}>{s.label}</p>
            <p className="text-white font-semibold mt-0.5 truncate" style={{ fontSize: 10 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <textarea value={state.notes} onChange={e => onChange({ ...state, notes: e.target.value })} placeholder="Notes on causes, impacts, management strategies…" rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white placeholder:text-slate-600 resize-none focus:outline-none" />

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-green-700/70 hover:bg-green-700 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
