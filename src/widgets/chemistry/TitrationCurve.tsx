import type { WidgetProps } from '../types'

export interface TitrationState extends Record<string, unknown> {
  acidType: 'strong' | 'weak'
  baseType: 'strong' | 'weak'
  concentration: number
}

export const defaultState: TitrationState = {
  acidType: 'strong',
  baseType: 'strong',
  concentration: 0.1,
}

function fmt(n: number) { return n.toFixed(2) }

function getTitrationCurve(acidType: 'strong' | 'weak', baseType: 'strong' | 'weak'): {
  points: string
  epPH: number
  epVol: number
} {
  const W = 360, H = 200
  const padL = 36, padR = 16, padT = 12, padB = 24
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const toX = (v: number) => padL + (v / 50) * plotW
  const toY = (ph: number) => H - padB - (ph / 14) * plotH

  // Equivalence point pH
  const epPH =
    acidType === 'strong' && baseType === 'strong' ? 7
    : acidType === 'weak' && baseType === 'strong' ? 9
    : acidType === 'strong' && baseType === 'weak' ? 5
    : 7  // weak/weak ≈ 7

  const epVol = 25  // ml

  // Sigmoid curve generation
  const pts: string[] = []
  for (let i = 0; i <= 100; i++) {
    const v = (i / 100) * 50  // 0-50 mL
    let ph: number

    if (acidType === 'strong' && baseType === 'strong') {
      // Sharp sigmoid at 25 mL, pH 1→13
      const d = v - epVol
      ph = 7 + 6 * Math.tanh(d / 1.5)
    } else if (acidType === 'weak' && baseType === 'strong') {
      // Gentler, equivalence pH≈9
      const d = v - epVol
      ph = 9 + 5 * Math.tanh(d / 3)
    } else if (acidType === 'strong' && baseType === 'weak') {
      // Equivalence pH≈5
      const d = v - epVol
      ph = 5 + 5 * Math.tanh(d / 2)
    } else {
      // Very gradual weak/weak
      const d = v - epVol
      ph = 7 + 3 * Math.tanh(d / 5)
    }
    ph = Math.max(0.5, Math.min(13.5, ph))
    pts.push(`${toX(v).toFixed(2)},${toY(ph).toFixed(2)}`)
  }

  return { points: pts.join(' '), epPH, epVol }
}

export default function TitrationCurve({ state, onChange, onCheck }: WidgetProps<TitrationState>) {
  const { acidType, baseType, concentration } = state

  const W = 360, H = 200
  const padL = 36, padR = 16, padT = 12, padB = 24
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const toX = (v: number) => padL + (v / 50) * plotW
  const toY = (ph: number) => H - padB - (ph / 14) * plotH

  const { points, epPH, epVol } = getTitrationCurve(acidType, baseType)

  const indicator =
    acidType === 'strong' && baseType === 'strong' ? 'Methyl orange or Phenolphthalein'
    : acidType === 'weak' && baseType === 'strong' ? 'Phenolphthalein'
    : acidType === 'strong' && baseType === 'weak' ? 'Methyl orange'
    : 'No sharp indicator — pH paper'

  const yLabels = [0, 2, 4, 6, 7, 8, 10, 12, 14]

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      <span className="text-slate-300 font-semibold">Titration Curve</span>

      {/* Type selectors */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-slate-500 mb-1" style={{ fontSize: 10 }}>Acid type</p>
          <div className="flex gap-1">
            {(['strong', 'weak'] as const).map(t => (
              <button key={t} onClick={() => onChange({ ...state, acidType: t })}
                className={`flex-1 py-1 rounded text-xs transition-all ${acidType === t ? 'bg-indigo-600/70 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-slate-500 mb-1" style={{ fontSize: 10 }}>Base type</p>
          <div className="flex gap-1">
            {(['strong', 'weak'] as const).map(t => (
              <button key={t} onClick={() => onChange({ ...state, baseType: t })}
                className={`flex-1 py-1 rounded text-xs transition-all ${baseType === t ? 'bg-indigo-600/70 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0d0d1f' }}>
        {/* Grid */}
        {yLabels.map(ph => (
          <g key={ph}>
            <line x1={padL} y1={toY(ph)} x2={W - padR} y2={toY(ph)}
              stroke={ph === 7 ? '#ffffff20' : '#ffffff08'} strokeWidth={ph === 7 ? 1.5 : 1} />
            <text x={padL - 4} y={toY(ph) + 3} textAnchor="end" fill="#ffffff40" fontSize="7">{ph}</text>
          </g>
        ))}

        {/* Methyl orange range (pH 3.1-4.4) */}
        <rect x={padL} y={toY(4.4)} width={plotW} height={toY(3.1) - toY(4.4)}
          fill="#f59e0b" opacity="0.08" />
        <line x1={padL} y1={toY(4)} x2={W - padR} y2={toY(4)}
          stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
        <text x={W - padR - 2} y={toY(4) - 3} textAnchor="end" fill="#f59e0b" fontSize="7" opacity="0.8">MO pH≈4</text>

        {/* Phenolphthalein range (pH 8.2-10) */}
        <rect x={padL} y={toY(10)} width={plotW} height={toY(8.2) - toY(10)}
          fill="#a78bfa" opacity="0.08" />
        <line x1={padL} y1={toY(8.3)} x2={W - padR} y2={toY(8.3)}
          stroke="#a78bfa" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
        <text x={W - padR - 2} y={toY(8.3) - 3} textAnchor="end" fill="#a78bfa" fontSize="7" opacity="0.8">PP pH≈8.3</text>

        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#ffffff30" strokeWidth="1.5" />
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#ffffff30" strokeWidth="1.5" />

        {/* Axis labels */}
        <text x={padL - 28} y={H / 2} textAnchor="middle" fill="#ffffff50" fontSize="8"
          transform={`rotate(-90, ${padL - 28}, ${H / 2})`}>pH</text>
        <text x={W / 2} y={H - 4} textAnchor="middle" fill="#ffffff50" fontSize="8">Volume of base added (mL)</text>

        {/* X labels */}
        {[0, 10, 20, 25, 30, 40, 50].map(v => (
          <text key={v} x={toX(v)} y={H - padB + 10} textAnchor="middle" fill="#ffffff30" fontSize="7">{v}</text>
        ))}

        {/* Curve */}
        <polyline points={points} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinejoin="round" />

        {/* Equivalence point */}
        <circle cx={toX(epVol)} cy={toY(epPH)} r="5" fill="#f59e0b" />
        <line x1={toX(epVol)} y1={padT} x2={toX(epVol)} y2={toY(epPH)}
          stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        <text x={toX(epVol) + 8} y={toY(epPH) - 6} fill="#f59e0b" fontSize="8" fontWeight="600">
          EP pH={epPH}
        </text>
      </svg>

      {/* Concentration slider */}
      <div className="flex items-center gap-2">
        <span className="w-32 text-slate-400 shrink-0">Concentration (M)</span>
        <input type="range" min={0.05} max={1.0} step={0.05}
          value={concentration}
          onChange={e => onChange({ ...state, concentration: parseFloat(e.target.value) })}
          className="flex-1 accent-indigo-500" />
        <span className="w-10 text-right text-slate-300 font-mono">{fmt(concentration)}</span>
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-2 gap-1.5 text-center">
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Equivalence pH</p>
          <p className="text-white font-semibold mt-0.5">{epPH}</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Indicator</p>
          <p className="text-white font-semibold mt-0.5" style={{ fontSize: 9 }}>{indicator}</p>
        </div>
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
