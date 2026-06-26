import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface TechGraphicsState extends Record<string, unknown> {
  shape: string
  dimensions: Record<string, number>
  showProjection: boolean
}

type ShapeDef = {
  name: string
  params: Array<{ key: string; label: string; min: number; max: number; default: number }>
  area: (d: Record<string, number>) => number
  perimeter: (d: Record<string, number>) => number
  svgPath: (d: Record<string, number>, cx: number, cy: number, scale: number) => string
}

export const SHAPES: Record<string, ShapeDef> = {
  rectangle: {
    name: 'Rectangle', params: [{ key: 'w', label: 'Width', min: 10, max: 200, default: 80 }, { key: 'h', label: 'Height', min: 10, max: 200, default: 50 }],
    area: d => d.w * d.h,
    perimeter: d => 2 * (d.w + d.h),
    svgPath: (d, cx, cy, sc) => `M${cx - d.w*sc/2},${cy - d.h*sc/2} h${d.w*sc} v${d.h*sc} h${-d.w*sc} Z`,
  },
  circle: {
    name: 'Circle', params: [{ key: 'r', label: 'Radius', min: 5, max: 100, default: 50 }],
    area: d => Math.PI * d.r * d.r,
    perimeter: d => 2 * Math.PI * d.r,
    svgPath: (d, cx, cy, sc) => {
      const r = d.r * sc
      return `M${cx},${cy - r} A${r},${r} 0 1,1 ${cx - 0.001},${cy - r}`
    },
  },
  triangle: {
    name: 'Triangle', params: [{ key: 'b', label: 'Base', min: 10, max: 200, default: 80 }, { key: 'h', label: 'Height', min: 10, max: 200, default: 60 }],
    area: d => 0.5 * d.b * d.h,
    perimeter: d => d.b + 2 * Math.sqrt((d.b / 2) ** 2 + d.h ** 2),
    svgPath: (d, cx, cy, sc) => `M${cx},${cy - d.h*sc/2} L${cx + d.b*sc/2},${cy + d.h*sc/2} L${cx - d.b*sc/2},${cy + d.h*sc/2} Z`,
  },
  trapezium: {
    name: 'Trapezium', params: [{ key: 'a', label: 'Top', min: 10, max: 150, default: 50 }, { key: 'b', label: 'Bottom', min: 10, max: 200, default: 90 }, { key: 'h', label: 'Height', min: 10, max: 150, default: 50 }],
    area: d => 0.5 * (d.a + d.b) * d.h,
    perimeter: d => { const leg = Math.sqrt(((d.b - d.a) / 2) ** 2 + d.h ** 2); return d.a + d.b + 2 * leg },
    svgPath: (d, cx, cy, sc) => `M${cx - d.a*sc/2},${cy - d.h*sc/2} L${cx + d.a*sc/2},${cy - d.h*sc/2} L${cx + d.b*sc/2},${cy + d.h*sc/2} L${cx - d.b*sc/2},${cy + d.h*sc/2} Z`,
  },
}

export const defaultState: TechGraphicsState = {
  shape: 'rectangle',
  dimensions: { w: 80, h: 50 },
  showProjection: false,
}

function fmt(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(2) }

export default function ShapeProperties({ state, onChange, onCheck }: WidgetProps<TechGraphicsState>) {
  const [view, setView] = useState<'2d' | 'properties'>('2d')
  const def = SHAPES[state.shape]
  const dims = state.dimensions
  const scale = 0.8

  const switchShape = (s: string) => {
    const d: Record<string, number> = {}
    SHAPES[s].params.forEach(p => { d[p.key] = p.default })
    onChange({ ...state, shape: s, dimensions: d })
  }

  const W = 360, H = 180, cx = 180, cy = 90

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      {/* Shape selector */}
      <div className="flex gap-1">
        {Object.keys(SHAPES).map(s => (
          <button key={s} onClick={() => switchShape(s)}
            className={`flex-1 py-1 rounded-lg text-[10px] capitalize transition-all border ${state.shape === s ? 'border-slate-400/50 bg-white/15 text-white' : 'border-white/10 text-slate-500 hover:text-white'}`}>
            {SHAPES[s].name}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
        {(['2d', 'properties'] as const).map(t => (
          <button key={t} onClick={() => setView(t)} className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-all ${view === t ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-white'}`}>
            {t === '2d' ? '2D View' : 'Properties'}
          </button>
        ))}
      </div>

      {view === '2d' && (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0d0d1f' }}>
          <path d={def.svgPath(dims, cx, cy, scale)} fill="rgba(99,102,241,0.15)" stroke="#818cf8" strokeWidth="2" />
          {/* Dimension labels */}
          {def.name === 'Rectangle' && (
            <>
              <text x={cx} y={cy + dims.h*scale/2 + 16} textAnchor="middle" fill="#ffffff60" fontSize="9">w = {fmt(dims.w)}</text>
              <text x={cx + dims.w*scale/2 + 12} y={cy} textAnchor="start" fill="#ffffff60" fontSize="9">h = {fmt(dims.h)}</text>
            </>
          )}
          {def.name === 'Circle' && (
            <>
              <line x1={cx} y1={cy} x2={cx + dims.r*scale} y2={cy} stroke="#ffffff40" strokeWidth="1" strokeDasharray="3 2" />
              <text x={cx + dims.r*scale/2} y={cy - 6} textAnchor="middle" fill="#ffffff60" fontSize="9">r = {fmt(dims.r)}</text>
            </>
          )}
          {def.name === 'Triangle' && (
            <text x={cx} y={cy + dims.h*scale/2 + 14} textAnchor="middle" fill="#ffffff60" fontSize="9">b = {fmt(dims.b)}</text>
          )}
        </svg>
      )}

      {view === 'properties' && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
              <p className="text-[10px] text-indigo-400/60">Area</p>
              <p className="text-sm font-bold text-indigo-300 mt-0.5">{fmt(def.area(dims))} units²</p>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2">
              <p className="text-[10px] text-cyan-400/60">Perimeter</p>
              <p className="text-sm font-bold text-cyan-300 mt-0.5">{fmt(def.perimeter(dims))} units</p>
            </div>
          </div>
        </div>
      )}

      {/* Dimension sliders */}
      <div className="space-y-2">
        {def.params.map(p => (
          <div key={p.key} className="flex items-center gap-2">
            <span className="w-16 text-slate-400 shrink-0 text-[10px]">{p.label}</span>
            <input type="range" min={p.min} max={p.max}
              value={dims[p.key] ?? p.default}
              onChange={e => onChange({ ...state, dimensions: { ...dims, [p.key]: parseFloat(e.target.value) } })}
              className="flex-1 accent-indigo-500" />
            <span className="w-10 text-right text-slate-300 font-mono text-[10px]">{fmt(dims[p.key] ?? p.default)}</span>
          </div>
        ))}
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-slate-600/70 hover:bg-slate-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
