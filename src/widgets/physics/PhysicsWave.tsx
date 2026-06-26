import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface PhysicsWaveState extends Record<string, unknown> {
  amplitude: number
  wavelength: number
  phase: number
  showLabels: boolean
}

export const defaultState: PhysicsWaveState = {
  amplitude: 1.5,
  wavelength: 2,
  phase: 0,
  showLabels: true,
}

function fmt(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(2) }

export default function PhysicsWave({ state, onChange, onCheck }: WidgetProps<PhysicsWaveState>) {
  const { amplitude, wavelength, phase, showLabels } = state

  const W = 360, H = 160
  const midY = H / 2
  const scaleX = W / (2 * wavelength)   // map 2 wavelengths across width
  const scaleY = (H / 2 - 18) / 4       // max amplitude=4 fits in half-height

  const toSvgX = (x: number) => x * scaleX
  const toSvgY = (y: number) => midY - y * scaleY

  const steps = 200
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const x = (2 * wavelength * i) / steps
    const y = amplitude * Math.sin((2 * Math.PI / wavelength) * x + phase)
    return `${toSvgX(x).toFixed(2)},${toSvgY(y).toFixed(2)}`
  }).join(' ')

  // Label positions
  const ampTopY = toSvgY(amplitude)
  const ampBotY = toSvgY(-amplitude)
  const lambdaX1 = toSvgX(0)
  const lambdaX2 = toSvgX(wavelength)
  const frequency = 1 / wavelength

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      <div className="flex items-center justify-between">
        <span className="text-slate-300 font-semibold">Wave Diagram</span>
        <button
          onClick={() => onChange({ ...state, showLabels: !showLabels })}
          className={`px-2 py-0.5 rounded text-xs transition-all ${showLabels ? 'bg-indigo-600/70 text-white' : 'bg-white/10 text-slate-400'}`}
        >
          {showLabels ? 'Labels ON' : 'Labels OFF'}
        </button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0d0d1f' }}>
        {/* Grid */}
        <line x1={0} y1={midY} x2={W} y2={midY} stroke="#ffffff25" strokeWidth="1" />
        {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(n => (
          <line key={n} x1={toSvgX(n * wavelength)} y1={8} x2={toSvgX(n * wavelength)} y2={H - 8}
            stroke="#ffffff08" strokeWidth="1" />
        ))}

        {/* Wave */}
        <polyline points={pts} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinejoin="round" />

        {showLabels && (
          <>
            {/* Amplitude arrow (vertical) */}
            <line x1={18} y1={midY} x2={18} y2={ampTopY} stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
            <line x1={18} y1={midY} x2={18} y2={ampBotY} stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
            <text x={24} y={midY - (midY - ampTopY) / 2 + 3} fill="#34d399" fontSize="9" fontWeight="600">A={fmt(amplitude)}</text>

            {/* Wavelength arrow (horizontal) */}
            <line x1={lambdaX1} y1={H - 12} x2={lambdaX2} y2={H - 12} stroke="#f59e0b" strokeWidth="1.5" />
            <line x1={lambdaX1} y1={H - 16} x2={lambdaX1} y2={H - 8} stroke="#f59e0b" strokeWidth="1.5" />
            <line x1={lambdaX2} y1={H - 16} x2={lambdaX2} y2={H - 8} stroke="#f59e0b" strokeWidth="1.5" />
            <text x={(lambdaX1 + lambdaX2) / 2} y={H - 2} textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="600">λ={fmt(wavelength)}</text>

            {/* Dashed amplitude lines */}
            <line x1={0} y1={ampTopY} x2={W} y2={ampTopY} stroke="#34d399" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <line x1={0} y1={ampBotY} x2={W} y2={ampBotY} stroke="#34d399" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          </>
        )}

        {/* Arrow marker */}
        <defs>
          <marker id="arrow-green" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill="#34d399" />
          </marker>
        </defs>

        {/* Equation */}
        <text x={W - 8} y={16} textAnchor="end" fill="#818cf8" fontSize="9" fontWeight="600">
          y = {fmt(amplitude)}·sin(2π/{fmt(wavelength)}·x{phase !== 0 ? (phase >= 0 ? '+' : '') + fmt(phase) : ''})
        </text>
      </svg>

      {/* Sliders */}
      <div className="space-y-2">
        {([
          { key: 'amplitude', label: 'Amplitude (A)', min: 0.5, max: 4, step: 0.1 },
          { key: 'wavelength', label: 'Wavelength (λ)', min: 0.5, max: 4, step: 0.1 },
          { key: 'phase', label: 'Phase (φ)', min: -Math.PI, max: Math.PI, step: 0.1 },
        ] as const).map(({ key, label, min, max, step }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-32 text-slate-400 shrink-0">{label}</span>
            <input type="range" min={min} max={max} step={step}
              value={state[key] as number}
              onChange={e => onChange({ ...state, [key]: parseFloat(e.target.value) })}
              className="flex-1 accent-indigo-500" />
            <span className="w-10 text-right text-slate-300 font-mono">{fmt(state[key] as number)}</span>
          </div>
        ))}
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Amplitude</p>
          <p className="text-white font-semibold mt-0.5">{fmt(amplitude)} units</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Wavelength</p>
          <p className="text-white font-semibold mt-0.5">{fmt(wavelength)} units</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
          <p className="text-slate-500" style={{ fontSize: 9 }}>Frequency</p>
          <p className="text-white font-semibold mt-0.5">{fmt(frequency)} Hz</p>
        </div>
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
