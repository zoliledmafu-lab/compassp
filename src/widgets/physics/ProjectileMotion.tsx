import type { WidgetProps } from '../types'

export interface ProjectileState extends Record<string, unknown> {
  angle: number
  speed: number
  gravity: number
}

export const defaultState: ProjectileState = {
  angle: 45,
  speed: 20,
  gravity: 9.8,
}

function fmt(n: number) { return n.toFixed(1) }

export default function ProjectileMotion({ state, onChange, onCheck }: WidgetProps<ProjectileState>) {
  const { angle, speed, gravity } = state

  const W = 360, H = 200
  const angleRad = (angle * Math.PI) / 180
  const vx = speed * Math.cos(angleRad)
  const vy = speed * Math.sin(angleRad)
  const T = (2 * vy) / gravity
  const R = vx * T
  const maxH = (vy * vy) / (2 * gravity)

  // Map to SVG coords
  const padL = 36, padR = 16, padT = 16, padB = 28
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const toSvgX = (x: number) => padL + (x / Math.max(R, 0.01)) * plotW
  const toSvgY = (y: number) => H - padB - (y / Math.max(maxH, 0.01)) * plotH

  const steps = 50
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const t = (T * i) / steps
    const x = vx * t
    const y = vy * t - 0.5 * gravity * t * t
    return `${toSvgX(Math.max(0, x)).toFixed(2)},${toSvgY(Math.max(0, y)).toFixed(2)}`
  }).join(' ')

  const peakX = toSvgX(vx * (vy / gravity))
  const peakY = toSvgY(maxH)
  const landX = toSvgX(R)
  const groundY = toSvgY(0)

  // Angle arc
  const arcR = 24
  const arcX = padL
  const arcY = groundY
  const arcPath = `M ${arcX + arcR} ${arcY} A ${arcR} ${arcR} 0 0 0 ${arcX + arcR * Math.cos(angleRad)} ${arcY - arcR * Math.sin(angleRad)}`

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      <span className="text-slate-300 font-semibold">Projectile Motion</span>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0d0d1f' }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={padL} y1={toSvgY(f * maxH)} x2={W - padR} y2={toSvgY(f * maxH)}
            stroke="#ffffff08" strokeWidth="1" />
        ))}

        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={groundY} stroke="#ffffff30" strokeWidth="1.5" />
        <line x1={padL} y1={groundY} x2={W - padR} y2={groundY} stroke="#ffffff30" strokeWidth="1.5" />

        {/* Axis labels */}
        <text x={padL - 4} y={padT + 8} textAnchor="end" fill="#ffffff50" fontSize="8">H</text>
        <text x={W - padR} y={groundY + 14} textAnchor="middle" fill="#ffffff50" fontSize="8">Q</text>

        {/* Y axis ticks */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <text key={f} x={padL - 3} y={toSvgY(f * maxH) + 3} textAnchor="end" fill="#ffffff30" fontSize="7">
            {(f * maxH).toFixed(0)}
          </text>
        ))}

        {/* Max height dashed */}
        <line x1={padL} y1={peakY} x2={peakX} y2={peakY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <line x1={peakX} y1={peakY} x2={peakX} y2={groundY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <text x={padL + 4} y={peakY - 4} fill="#f59e0b" fontSize="8">H={fmt(maxH)}m</text>

        {/* Angle arc */}
        <path d={arcPath} fill="none" stroke="#818cf8" strokeWidth="1.5" opacity="0.8" />
        <text x={arcX + arcR + 8} y={arcY - 8} fill="#818cf8" fontSize="8">{angle}°</text>

        {/* Trajectory */}
        <polyline points={pts} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinejoin="round" />

        {/* Peak dot (amber) */}
        <circle cx={peakX} cy={peakY} r="4" fill="#f59e0b" />

        {/* Landing dot (green) */}
        <circle cx={landX} cy={groundY} r="4" fill="#22c55e" />
        <text x={landX} y={groundY + 14} textAnchor="middle" fill="#22c55e" fontSize="8">R={fmt(R)}m</text>

        {/* Launch dot */}
        <circle cx={padL} cy={groundY} r="3" fill="#818cf8" />
      </svg>

      {/* Sliders */}
      <div className="space-y-2">
        {([
          { key: 'angle', label: 'Angle (θ)', min: 1, max: 89, step: 1, unit: '°' },
          { key: 'speed', label: 'Speed (v₀)', min: 5, max: 50, step: 1, unit: ' m/s' },
          { key: 'gravity', label: 'Gravity (g)', min: 1.6, max: 20, step: 0.1, unit: ' m/s²' },
        ] as const).map(({ key, label, min, max, step, unit }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-32 text-slate-400 shrink-0">{label}</span>
            <input type="range" min={min} max={max} step={step}
              value={state[key] as number}
              onChange={e => onChange({ ...state, [key]: parseFloat(e.target.value) })}
              className="flex-1 accent-indigo-500" />
            <span className="w-14 text-right text-slate-300 font-mono">{fmt(state[key] as number)}{unit}</span>
          </div>
        ))}
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { label: 'Range', value: fmt(R) + ' m' },
          { label: 'Max Height', value: fmt(maxH) + ' m' },
          { label: 'Flight Time', value: fmt(T) + ' s' },
          { label: 'Angle', value: angle + '°' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/5 border border-white/8 rounded-lg px-1 py-1.5">
            <p className="text-slate-500" style={{ fontSize: 9 }}>{label}</p>
            <p className="text-white font-semibold mt-0.5" style={{ fontSize: 10 }}>{value}</p>
          </div>
        ))}
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
