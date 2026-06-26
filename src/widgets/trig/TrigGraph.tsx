import type { WidgetProps } from '../types'

export interface TrigState extends Record<string, unknown> {
  func: 'sin' | 'cos' | 'tan'
  amplitude: number
  frequency: number
  phase: number
  vertical: number
}

export const defaultState: TrigState = {
  func: 'sin',
  amplitude: 1,
  frequency: 1,
  phase: 0,
  vertical: 0,
}

function fmt(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(2) }

export default function TrigGraph({ state, onChange, onCheck }: WidgetProps<TrigState>) {
  const { func, amplitude, frequency, phase, vertical } = state

  const W = 360, H = 180
  const xRange = 2 * Math.PI   // show 0 to 2π
  const yRange = Math.max(Math.abs(amplitude) + Math.abs(vertical) + 0.5, 2)

  const toSvgX = (x: number) => 30 + (x / xRange) * (W - 50)
  const toSvgY = (y: number) => H / 2 - (y / yRange) * (H / 2 - 20)

  const fn = (x: number) => {
    const base = func === 'sin' ? Math.sin(frequency * x + phase)
                : func === 'cos' ? Math.cos(frequency * x + phase)
                : Math.tan(frequency * x + phase)
    return amplitude * (isFinite(base) ? Math.max(-10, Math.min(10, base)) : 0) + vertical
  }

  const steps = 200
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const x = (xRange * i) / steps
    const y = fn(x)
    return `${toSvgX(x)},${toSvgY(y)}`
  }).join(' ')

  const period = (2 * Math.PI) / Math.abs(frequency)
  const color = func === 'sin' ? '#818cf8' : func === 'cos' ? '#34d399' : '#f59e0b'

  // π label positions
  const piLabels = [0, 0.5, 1, 1.5, 2].map(n => ({ label: n === 0 ? '0' : n === 1 ? 'π' : `${n}π`, x: toSvgX(n * Math.PI) }))

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      {/* Function selector */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
        {(['sin', 'cos', 'tan'] as const).map(fn => (
          <button key={fn} onClick={() => onChange({ ...state, func: fn })}
            className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${state.func === fn ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-white'}`}>
            {fn}(x)
          </button>
        ))}
      </div>

      {/* SVG Graph */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0d0d1f' }}>
        {/* Horizontal grid */}
        {[-1, 0, 1].map(r => {
          const y = toSvgY(r * yRange * 0.5)
          return <line key={r} x1={30} y1={y} x2={W - 20} y2={y} stroke="#ffffff08" strokeWidth="1" />
        })}
        {/* Vertical grid at π intervals */}
        {[0.5, 1, 1.5, 2].map(n => (
          <line key={n} x1={toSvgX(n * Math.PI)} y1={20} x2={toSvgX(n * Math.PI)} y2={H - 20} stroke="#ffffff08" strokeWidth="1" />
        ))}
        {/* Axes */}
        <line x1={30} y1={toSvgY(0)} x2={W - 20} y2={toSvgY(0)} stroke="#ffffff30" strokeWidth="1.5" />
        <line x1={30} y1={20} x2={30} y2={H - 20} stroke="#ffffff30" strokeWidth="1.5" />
        {/* X labels */}
        {piLabels.map(l => (
          <text key={l.label} x={l.x} y={toSvgY(0) + 14} textAnchor="middle" fill="#ffffff40" fontSize="8">{l.label}</text>
        ))}
        {/* Amplitude dashed lines */}
        <line x1={30} y1={toSvgY(amplitude + vertical)} x2={W - 20} y2={toSvgY(amplitude + vertical)} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
        <line x1={30} y1={toSvgY(-amplitude + vertical)} x2={W - 20} y2={toSvgY(-amplitude + vertical)} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
        {/* Curve */}
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Equation label */}
        <text x={W - 22} y={18} textAnchor="end" fill={color} fontSize="9" fontWeight="600">
          y = {amplitude !== 1 ? amplitude : ''}{func}({frequency !== 1 ? frequency : ''}x{phase !== 0 ? (phase > 0 ? '+' : '') + fmt(phase) : ''}){vertical !== 0 ? (vertical > 0 ? '+' : '') + fmt(vertical) : ''}
        </text>
      </svg>

      {/* Sliders */}
      <div className="space-y-2">
        {[
          { key: 'amplitude', label: 'Amplitude (A)', min: -4, max: 4, step: 0.5 },
          { key: 'frequency', label: 'Frequency (B)', min: 0.5, max: 4, step: 0.5 },
          { key: 'phase',     label: 'Phase shift (C)', min: -3.14, max: 3.14, step: 0.25 },
          { key: 'vertical',  label: 'Vertical shift (D)', min: -3, max: 3, step: 0.5 },
        ].map(({ key, label, min, max, step }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-36 text-slate-400 shrink-0 text-xs">{label}</span>
            <input type="range" min={min} max={max} step={step}
              value={state[key] as number}
              onChange={e => onChange({ ...state, [key]: parseFloat(e.target.value) })}
              className="flex-1 accent-indigo-500" />
            <span className="w-10 text-right text-slate-300 font-mono text-xs">{fmt(state[key] as number)}</span>
          </div>
        ))}
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Amplitude</p>
          <p className="text-white font-semibold mt-0.5" style={{ fontSize: 10 }}>|{fmt(amplitude)}|</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Period</p>
          <p className="text-white font-semibold mt-0.5" style={{ fontSize: 10 }}>{fmt(period)}r</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Phase shift</p>
          <p className="text-white font-semibold mt-0.5" style={{ fontSize: 10 }}>{phase !== 0 ? `${fmt(-phase / frequency)}` : '0'}</p>
        </div>
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
