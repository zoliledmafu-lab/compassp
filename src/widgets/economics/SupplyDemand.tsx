import type { WidgetProps } from '../types'

export interface SupplyDemandState extends Record<string, unknown> {
  demandShift: number
  supplyShift: number
  showSurplus: boolean
}

export const defaultState: SupplyDemandState = {
  demandShift: 0,
  supplyShift: 0,
  showSurplus: false,
}

function fmt(n: number) { return n.toFixed(1) }

export default function SupplyDemand({ state, onChange, onCheck }: WidgetProps<SupplyDemandState>) {
  const { demandShift, supplyShift, showSurplus } = state

  const W = 360, H = 200
  const padL = 32, padR = 16, padT = 12, padB = 28
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  // Axes run 0–100 for both P and Q
  const toX = (q: number) => padL + (q / 100) * plotW
  const toY = (p: number) => H - padB - (p / 100) * plotH

  // Base lines: demand goes top-left to bottom-right, supply bottom-left to top-right
  // Demand: P = 90 - 0.8*Q  → at Q=0 P=90, at Q=112 P=0
  // Supply: P = 10 + 0.8*Q  → at Q=0 P=10, at Q=112 P=100
  // Equilibrium base: intersection 90-0.8Q = 10+0.8Q → 80=1.6Q → Q=50, P=50

  // With shifts (shift moves the Q-intercept)
  const dSlope = -0.8
  const sSlope = 0.8

  // Demand: P = 90 - 0.8*(Q - demandShift) = (90 + 0.8*demandShift) - 0.8*Q
  const dIntercept = 90 + 0.8 * demandShift
  // Supply: P = 10 + 0.8*(Q - supplyShift) = (10 - 0.8*supplyShift) + 0.8*Q
  const sIntercept = 10 - 0.8 * supplyShift

  // Equilibrium: dIntercept + dSlope*Q = sIntercept + sSlope*Q
  // dIntercept - sIntercept = (sSlope - dSlope)*Q
  const eqQ = (dIntercept - sIntercept) / (sSlope - dSlope)
  const eqP = sIntercept + sSlope * eqQ

  // Line endpoints (clamp P to 0–100)
  // Demand: Q from 0 to 100
  const dQ0 = 0, dP0 = Math.min(100, dIntercept)
  const dQ1 = (dIntercept) / 0.8  // P=0
  const dP1 = 0

  // Supply: Q from 0 to 100
  const sQ0 = Math.max(0, -sIntercept / sSlope)  // P=0
  const sP0 = 0
  const sQ1 = (100 - sIntercept) / sSlope  // P=100
  const sP1 = 100

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      <span className="text-slate-300 font-semibold">Supply &amp; Demand</span>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0d0d1f' }}>
        {/* Grid */}
        {[25, 50, 75].map(v => (
          <g key={v}>
            <line x1={toX(v)} y1={padT} x2={toX(v)} y2={H - padB} stroke="#ffffff08" strokeWidth="1" />
            <line x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)} stroke="#ffffff08" strokeWidth="1" />
          </g>
        ))}

        {/* Surplus/shortage shading */}
        {showSurplus && eqQ > 0 && eqP > 0 && eqP < 100 && (
          <>
            {/* Example: shade above EQ price (surplus) */}
            <polygon
              points={`${toX(eqQ)},${toY(eqP)} ${toX(Math.min(dQ1, 100))},${toY(0)} ${toX(Math.min(sQ1, 100))},${toY(100)}`}
              fill="#22c55e" opacity="0.07" />
          </>
        )}

        {/* Demand line */}
        <line x1={toX(dQ0)} y1={toY(dP0)} x2={toX(Math.min(dQ1, 100))} y2={toY(Math.max(dP1, 0))}
          stroke="#818cf8" strokeWidth="2.5" />
        <text x={toX(Math.min(dQ1 * 0.85, 95))} y={toY(dIntercept * 0.15 + 4)} fill="#818cf8" fontSize="9" fontWeight="600">D</text>

        {/* Supply line */}
        <line x1={toX(Math.max(sQ0, 0))} y1={toY(sP0)} x2={toX(Math.min(sQ1, 100))} y2={toY(Math.min(sP1, 100))}
          stroke="#34d399" strokeWidth="2.5" />
        <text x={toX(Math.min(sQ1 * 0.9, 95))} y={toY(Math.min(sP1 * 0.9, 96))} fill="#34d399" fontSize="9" fontWeight="600">S</text>

        {/* Equilibrium dashed lines */}
        {eqQ > 0 && eqQ < 100 && eqP > 0 && eqP < 100 && (
          <>
            <line x1={padL} y1={toY(eqP)} x2={toX(eqQ)} y2={toY(eqP)}
              stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" />
            <line x1={toX(eqQ)} y1={toY(eqP)} x2={toX(eqQ)} y2={H - padB}
              stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={toX(eqQ)} cy={toY(eqP)} r="5" fill="#f59e0b" />
            <text x={padL - 4} y={toY(eqP) + 3} textAnchor="end" fill="#f59e0b" fontSize="8" fontWeight="600">P*</text>
            <text x={toX(eqQ)} y={H - padB + 12} textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="600">Q*</text>
          </>
        )}

        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#ffffff30" strokeWidth="1.5" />
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#ffffff30" strokeWidth="1.5" />
        <text x={padL - 6} y={padT + 6} textAnchor="end" fill="#ffffff50" fontSize="9" fontWeight="600">P</text>
        <text x={W - padR} y={H - padB + 14} textAnchor="middle" fill="#ffffff50" fontSize="9" fontWeight="600">Q</text>
      </svg>

      {/* Shift buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'D+', title: 'Demand increases', action: () => onChange({ ...state, demandShift: Math.min(demandShift + 15, 60) }), color: '#818cf8' },
          { label: 'D−', title: 'Demand decreases', action: () => onChange({ ...state, demandShift: Math.max(demandShift - 15, -60) }), color: '#818cf8' },
          { label: 'S+', title: 'Supply increases', action: () => onChange({ ...state, supplyShift: Math.min(supplyShift + 15, 60) }), color: '#34d399' },
          { label: 'S−', title: 'Supply decreases', action: () => onChange({ ...state, supplyShift: Math.max(supplyShift - 15, -60) }), color: '#34d399' },
        ].map(({ label, action, color }) => (
          <button key={label} onClick={action}
            className="py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 bg-white/5 border border-white/10"
            style={{ color }}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onChange({ ...state, showSurplus: !showSurplus })}
          className={`px-3 py-1 rounded text-xs transition-all ${showSurplus ? 'bg-green-600/50 text-white' : 'bg-white/10 text-slate-400'}`}>
          {showSurplus ? 'Surplus ON' : 'Show Surplus'}
        </button>
        <button onClick={() => onChange({ ...state, demandShift: 0, supplyShift: 0 })}
          className="px-3 py-1 rounded text-xs bg-white/5 text-slate-400 hover:text-white transition-all">
          Reset
        </button>
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Eq. Price (P*)</p>
          <p className="text-white font-semibold mt-0.5">{fmt(eqP)}</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Eq. Quantity (Q*)</p>
          <p className="text-white font-semibold mt-0.5">{fmt(eqQ)}</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Shifts</p>
          <p className="text-white font-semibold mt-0.5" style={{ fontSize: 9 }}>
            D{demandShift >= 0 ? '+' : ''}{demandShift} S{supplyShift >= 0 ? '+' : ''}{supplyShift}
          </p>
        </div>
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
