import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface ForceEntry {
  id: string
  angle: number
  magnitude: number
  label: string
}

export interface ForceDiagramState extends Record<string, unknown> {
  forces: ForceEntry[]
}

export const defaultState: ForceDiagramState = {
  forces: [
    { id: 'f1', angle: 90, magnitude: 20, label: 'Weight' },
    { id: 'f2', angle: 270, magnitude: 20, label: 'Normal' },
  ],
}

const FORCE_COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#a78bfa']

function fmt(n: number) { return n.toFixed(1) }

export default function ForceDiagram({ state, onChange, onCheck }: WidgetProps<ForceDiagramState>) {
  const { forces } = state
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('Force')

  const W = 360, H = 220
  const cx = W / 2, cy = H / 2
  const boxSize = 24
  const scale = 2.5  // pixels per Newton

  // Compute resultant
  const rx = forces.reduce((s, f) => s + f.magnitude * Math.cos((f.angle * Math.PI) / 180), 0)
  const ry = forces.reduce((s, f) => s + f.magnitude * Math.sin((f.angle * Math.PI) / 180), 0)
  const rMag = Math.sqrt(rx * rx + ry * ry)

  const arrowHead = (x1: number, y1: number, x2: number, y2: number, color: string, id: string) => {
    const dx = x2 - x1, dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1) return null
    const ux = dx / len, uy = dy / len
    const px = -uy, py = ux
    const tipX = x2, tipY = y2
    const baseX = x2 - ux * 10, baseY = y2 - uy * 10
    return (
      <polygon key={`ah-${id}`}
        points={`${tipX},${tipY} ${baseX + px * 4},${baseY + py * 4} ${baseX - px * 4},${baseY - py * 4}`}
        fill={color} />
    )
  }

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      <span className="text-slate-300 font-semibold">Force Diagram</span>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0d0d1f' }}>
        {/* Center box */}
        <rect x={cx - boxSize} y={cy - boxSize} width={boxSize * 2} height={boxSize * 2}
          fill="#1e1e3a" stroke="#ffffff40" strokeWidth="1.5" rx="3" />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#ffffff80" fontSize="8">Object</text>

        {/* Force arrows */}
        {forces.map((f, i) => {
          const color = FORCE_COLORS[i % FORCE_COLORS.length]
          const rad = (f.angle * Math.PI) / 180
          const len = f.magnitude * scale
          const tipX = cx + len * Math.cos(rad)
          const tipY = cy - len * Math.sin(rad)  // SVG Y is flipped
          const startX = cx + boxSize * Math.cos(rad)
          const startY = cy - boxSize * Math.sin(rad)
          const labelX = tipX + 14 * Math.cos(rad)
          const labelY = tipY - 14 * Math.sin(rad)
          return (
            <g key={f.id}>
              <line x1={startX} y1={startY} x2={tipX - 8 * Math.cos(rad)} y2={tipY + 8 * Math.sin(rad)}
                stroke={color} strokeWidth="2" />
              {arrowHead(startX, startY, tipX, tipY, color, f.id)}
              <text x={labelX} y={labelY} textAnchor="middle" fill={color} fontSize="8" fontWeight="600">
                {f.label}
              </text>
              <text x={labelX} y={labelY + 9} textAnchor="middle" fill={color} fontSize="7" opacity="0.8">
                {f.magnitude}N
              </text>
            </g>
          )
        })}

        {/* Resultant arrow */}
        {rMag > 0.5 && (
          <g>
            <line x1={cx} y1={cy}
              x2={cx + rMag * scale * (rx / rMag) - 8 * (rx / rMag)}
              y2={cy - rMag * scale * (ry / rMag) + 8 * (ry / rMag)}
              stroke="#fbbf24" strokeWidth="2" strokeDasharray="5 3" />
            {arrowHead(cx, cy,
              cx + rMag * scale * (rx / rMag),
              cy - rMag * scale * (ry / rMag),
              '#fbbf24', 'resultant')}
            <text x={cx + rMag * scale * (rx / rMag) + 16 * (rx / rMag)}
              y={cy - rMag * scale * (ry / rMag) + 5}
              fill="#fbbf24" fontSize="8" fontWeight="600">R={fmt(rMag)}N</text>
          </g>
        )}
      </svg>

      {/* Force controls */}
      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {forces.map((f, i) => {
          const color = FORCE_COLORS[i % FORCE_COLORS.length]
          return (
            <div key={f.id} className="bg-white/5 rounded-lg p-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <input
                  value={f.label}
                  onChange={e => onChange({ ...state, forces: forces.map(x => x.id === f.id ? { ...x, label: e.target.value } : x) })}
                  className="flex-1 bg-white/10 rounded px-1.5 py-0.5 text-white text-xs outline-none"
                  maxLength={16}
                />
                <button
                  onClick={() => onChange({ ...state, forces: forces.filter(x => x.id !== f.id) })}
                  className="text-slate-500 hover:text-red-400 font-bold px-1"
                >×</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 text-slate-400">Angle</span>
                <input type="range" min={0} max={360} step={5}
                  value={f.angle}
                  onChange={e => onChange({ ...state, forces: forces.map(x => x.id === f.id ? { ...x, angle: parseInt(e.target.value) } : x) })}
                  className="flex-1 accent-indigo-500" />
                <span className="w-8 text-right font-mono text-slate-300">{f.angle}°</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 text-slate-400">Magnitude</span>
                <input type="range" min={1} max={50} step={1}
                  value={f.magnitude}
                  onChange={e => onChange({ ...state, forces: forces.map(x => x.id === f.id ? { ...x, magnitude: parseInt(e.target.value) } : x) })}
                  className="flex-1 accent-indigo-500" />
                <span className="w-8 text-right font-mono text-slate-300">{f.magnitude}N</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add force */}
      {forces.length < 5 && (
        adding ? (
          <div className="flex gap-2">
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Label"
              className="flex-1 bg-white/10 rounded px-2 py-1 text-white text-xs outline-none"
              maxLength={16}
            />
            <button onClick={() => {
              const id = 'f' + Date.now()
              onChange({ ...state, forces: [...forces, { id, angle: 0, magnitude: 10, label: newLabel || 'Force' }] })
              setAdding(false)
              setNewLabel('Force')
            }} className="px-3 py-1 bg-indigo-600/70 rounded text-xs text-white">Add</button>
            <button onClick={() => setAdding(false)} className="px-2 py-1 bg-white/10 rounded text-xs text-slate-400">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all">
            + Add Force
          </button>
        )
      )}

      {/* Info strip */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Resultant X</p>
          <p className="text-white font-semibold mt-0.5">{fmt(rx)} N</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Resultant Y</p>
          <p className="text-white font-semibold mt-0.5">{fmt(ry)} N</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Net Force</p>
          <p className="text-white font-semibold mt-0.5">{fmt(rMag)} N</p>
        </div>
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
