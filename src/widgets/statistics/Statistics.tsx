import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface StatisticsState extends Record<string, unknown> {
  labels: string[]
  values: number[]
}

export const defaultState: StatisticsState = {
  labels: ['A', 'B', 'C', 'D', 'E'],
  values: [4, 7, 3, 9, 5],
}

function mean(v: number[]) { return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0 }
function median(v: number[]) {
  if (!v.length) return 0
  const s = [...v].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
function mode(v: number[]) {
  const freq: Record<number, number> = {}
  v.forEach(x => { freq[x] = (freq[x] || 0) + 1 })
  const max = Math.max(...Object.values(freq))
  return Object.keys(freq).filter(k => freq[Number(k)] === max).map(Number)
}
function fmt(n: number) { return Number.isInteger(n) ? String(n) : n.toFixed(2) }

export default function Statistics({ state, onChange, onCheck }: WidgetProps<StatisticsState>) {
  const { labels, values } = state
  const [tab, setTab] = useState<'chart' | 'data'>('chart')

  const valid = values.filter((_, i) => labels[i]?.trim())
  const maxV = Math.max(...valid, 1)

  const updateLabel = (i: number, v: string) => {
    const l = [...labels]; l[i] = v
    onChange({ ...state, labels: l })
  }
  const updateValue = (i: number, v: string) => {
    const vs = [...values]; vs[i] = parseFloat(v) || 0
    onChange({ ...state, values: vs })
  }
  const addRow = () => onChange({ ...state, labels: [...labels, ''], values: [...values, 0] })
  const removeRow = (i: number) => onChange({ ...state, labels: labels.filter((_, j) => j !== i), values: values.filter((_, j) => j !== i) })

  const m = mean(valid)
  const med = median(valid)
  const rng = valid.length ? Math.max(...valid) - Math.min(...valid) : 0
  const modeVals = mode(valid)

  // SVG bar chart
  const W = 360, H = 160, pad = { l: 32, r: 12, t: 10, b: 32 }
  const chartW = W - pad.l - pad.r
  const chartH = H - pad.t - pad.b
  const barW = Math.max(12, (chartW / Math.max(valid.length, 1)) * 0.65)
  const gap   = chartW / Math.max(valid.length, 1)

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs select-none" style={{ minWidth: 360 }}>
      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
        {(['chart', 'data'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-1 rounded-md text-xs font-medium transition-all capitalize ${tab === t ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-white'}`}>{t}</button>
        ))}
      </div>

      {tab === 'chart' && (
        <>
          {/* Bar chart */}
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0d0d1f' }}>
            {/* Y-axis */}
            <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="#ffffff20" strokeWidth="1" />
            {/* Y grid lines + labels */}
            {[0, 0.25, 0.5, 0.75, 1].map(r => {
              const y = pad.t + chartH * (1 - r)
              return (
                <g key={r}>
                  <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#ffffff0c" strokeWidth="1" />
                  <text x={pad.l - 4} y={y + 3} textAnchor="end" fill="#ffffff40" fontSize="9">{fmt(maxV * r)}</text>
                </g>
              )
            })}
            {/* Bars */}
            {valid.map((v, i) => {
              const barH = (v / maxV) * chartH
              const x = pad.l + gap * i + (gap - barW) / 2
              const y = pad.t + chartH - barH
              return (
                <g key={i}>
                  <rect x={x} y={y} width={barW} height={barH} rx="3" fill={`hsl(${220 + i * 25},70%,60%)`} opacity="0.85" />
                  <text x={x + barW / 2} y={y - 3} textAnchor="middle" fill="#ffffff80" fontSize="9">{fmt(v)}</text>
                  <text x={x + barW / 2} y={H - pad.b + 14} textAnchor="middle" fill="#ffffff60" fontSize="9">{labels[i] || ''}</text>
                </g>
              )
            })}
            {/* Mean line */}
            {valid.length > 0 && (
              <>
                <line
                  x1={pad.l} y1={pad.t + chartH * (1 - m / maxV)}
                  x2={W - pad.r} y2={pad.t + chartH * (1 - m / maxV)}
                  stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 3" opacity="0.7"
                />
                <text x={W - pad.r - 2} y={pad.t + chartH * (1 - m / maxV) - 3} textAnchor="end" fill="#f59e0b" fontSize="8">mean</text>
              </>
            )}
            {/* X-axis */}
            <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#ffffff20" strokeWidth="1" />
          </svg>

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Mean', value: fmt(m) },
              { label: 'Median', value: fmt(med) },
              { label: 'Mode', value: modeVals.map(fmt).join(', ') || '—' },
              { label: 'Range', value: fmt(rng) },
            ].map(s => (
              <div key={s.label} className="rounded-lg bg-white/5 border border-white/8 px-2 py-1.5 text-center">
                <p className="text-slate-400 text-xs" style={{ fontSize: 9 }}>{s.label}</p>
                <p className="text-white font-semibold mt-0.5" style={{ fontSize: 11 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'data' && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-1 text-xs text-slate-500 px-1 mb-1">
            <span>Label</span><span>Value</span><span></span>
          </div>
          {labels.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1 items-center">
              <input value={l} onChange={e => updateLabel(i, e.target.value)} placeholder={`Class ${i + 1}`} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50" />
              <input type="number" value={values[i] ?? 0} onChange={e => updateValue(i, e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500/50" />
              <button onClick={() => removeRow(i)} className="text-slate-600 hover:text-red-400 px-1 transition-colors" disabled={labels.length <= 2}>×</button>
            </div>
          ))}
          {labels.length < 10 && (
            <button onClick={addRow} className="w-full py-1.5 rounded-lg border border-white/10 border-dashed text-slate-500 hover:text-white hover:border-white/20 transition-all text-xs">+ Add data point</button>
          )}
        </div>
      )}

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-purple-600/70 hover:bg-purple-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
