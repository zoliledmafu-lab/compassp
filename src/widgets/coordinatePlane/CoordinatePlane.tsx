import React, { useCallback, useRef, useState } from 'react'
import type { WidgetProps } from '../types'
import {
  computeLinear, worldToSvg, svgToWorld, lineEndpoints, snapToHalf, clamp, fmt,
  SVG_W, SVG_H, PAD_LEFT, PAD_RIGHT, PAD_TOP, PAD_BOTTOM, DEFAULT_RANGE,
} from './math'

// ─── State shape ─────────────────────────────────────────────────

export interface CoordinatePlaneState extends Record<string, unknown> {
  pointA: { x: number; y: number }
  pointB: { x: number; y: number }
}

export const defaultState: CoordinatePlaneState = {
  pointA: { x: -3, y: -2 },
  pointB: { x: 3,  y:  4 },
}

// ─── Grid helpers ─────────────────────────────────────────────────

function GridLines() {
  const r = DEFAULT_RANGE
  const lines: React.ReactNode[] = []
  const labels: React.ReactNode[] = []

  for (let x = Math.ceil(r.xMin); x <= r.xMax; x++) {
    const { sx } = worldToSvg(x, 0, r)
    lines.push(
      <line key={`vg${x}`} x1={sx} y1={PAD_TOP} x2={sx} y2={SVG_H - PAD_BOTTOM}
        stroke="#e5e7eb" strokeWidth={x === 0 ? 1.5 : 0.75} />
    )
    if (x !== 0) {
      const { sy } = worldToSvg(0, 0, r)
      labels.push(
        <text key={`vl${x}`} x={sx} y={sy + 14} fontSize={9} textAnchor="middle"
          fill="#9ca3af" className="select-none">{x}</text>
      )
    }
  }

  for (let y = Math.ceil(r.yMin); y <= r.yMax; y++) {
    const { sy } = worldToSvg(0, y, r)
    lines.push(
      <line key={`hg${y}`} x1={PAD_LEFT} y1={sy} x2={SVG_W - PAD_RIGHT} y2={sy}
        stroke="#e5e7eb" strokeWidth={y === 0 ? 1.5 : 0.75} />
    )
    if (y !== 0) {
      const { sx } = worldToSvg(0, 0, r)
      labels.push(
        <text key={`hl${y}`} x={sx - 6} y={sy + 3.5} fontSize={9} textAnchor="end"
          fill="#9ca3af" className="select-none">{y}</text>
      )
    }
  }

  return <>{lines}{labels}</>
}

function Axes() {
  const r = DEFAULT_RANGE
  const { sx: ox, sy: oy } = worldToSvg(0, 0, r)
  return (
    <>
      {/* x-axis */}
      <line x1={PAD_LEFT} y1={oy} x2={SVG_W - PAD_RIGHT} y2={oy}
        stroke="#6b7280" strokeWidth={1.5} markerEnd="url(#arrow)" />
      {/* y-axis */}
      <line x1={ox} y1={SVG_H - PAD_BOTTOM} x2={ox} y2={PAD_TOP}
        stroke="#6b7280" strokeWidth={1.5} markerEnd="url(#arrow)" />
      {/* axis labels */}
      <text x={SVG_W - PAD_RIGHT + 4} y={oy + 4} fontSize={11} fill="#6b7280"
        className="select-none">x</text>
      <text x={ox + 5} y={PAD_TOP - 2} fontSize={11} fill="#6b7280"
        className="select-none">y</text>
    </>
  )
}

// ─── Draggable point ──────────────────────────────────────────────

interface DotProps {
  id: 'A' | 'B'
  wx: number
  wy: number
  color: string
  onDragEnd: (id: 'A' | 'B', wx: number, wy: number) => void
  onDragging: (id: 'A' | 'B', wx: number, wy: number) => void
  readonly?: boolean
  svgRef: React.RefObject<SVGSVGElement | null>
}

function DraggablePoint({ id, wx, wy, color, onDragEnd, onDragging, readonly, svgRef }: DotProps) {
  const r = DEFAULT_RANGE
  const { sx, sy } = worldToSvg(wx, wy, r)
  const dragging = useRef(false)

  const toWorld = useCallback((e: PointerEvent | React.PointerEvent) => {
    if (!svgRef.current) return null
    const rect = svgRef.current.getBoundingClientRect()
    const rawSx = e.clientX - rect.left
    const rawSy = e.clientY - rect.top
    const { wx: rawWx, wy: rawWy } = svgToWorld(rawSx, rawSy, r)
    return {
      wx: clamp(snapToHalf(rawWx), r.xMin + 0.5, r.xMax - 0.5),
      wy: clamp(snapToHalf(rawWy), r.yMin + 0.5, r.yMax - 0.5),
    }
  }, [svgRef, r])

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGCircleElement>) => {
    if (readonly) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
  }, [readonly])

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGCircleElement>) => {
    if (!dragging.current) return
    e.stopPropagation()
    const pos = toWorld(e)
    if (pos) onDragging(id, pos.wx, pos.wy)
  }, [id, onDragging, toWorld])

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGCircleElement>) => {
    if (!dragging.current) return
    e.stopPropagation()
    dragging.current = false
    const pos = toWorld(e)
    if (pos) onDragEnd(id, pos.wx, pos.wy)
  }, [id, onDragEnd, toWorld])

  return (
    <g>
      {/* invisible hit-test area */}
      <circle cx={sx} cy={sy} r={16} fill="transparent"
        className={readonly ? '' : 'cursor-grab active:cursor-grabbing'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      {/* visible dot */}
      <circle cx={sx} cy={sy} r={7} fill={color} stroke="white" strokeWidth={2}
        style={{ pointerEvents: 'none' }} />
      {/* label */}
      <text x={sx + 10} y={sy - 8} fontSize={12} fontWeight="600" fill={color}
        className="select-none" style={{ pointerEvents: 'none' }}>{id}</text>
      {/* coordinate tooltip */}
      <text x={sx + 10} y={sy + 4} fontSize={9} fill={color}
        className="select-none" style={{ pointerEvents: 'none' }}>
        ({fmt(wx)}, {fmt(wy)})
      </text>
    </g>
  )
}

// ─── Main component ───────────────────────────────────────────────

export default function CoordinatePlane({ state, onChange, onCheck, readonly }: WidgetProps<CoordinatePlaneState>) {
  // Local draft state for smooth drag (before committing to onChange)
  const [draft, setDraft] = useState<CoordinatePlaneState | null>(null)
  const current = draft ?? state
  const svgRef = useRef<SVGSVGElement>(null)

  const result = computeLinear(
    { ...current.pointA, id: 'A', label: 'A', color: '#3b82f6' },
    { ...current.pointB, id: 'B', label: 'B', color: '#ef4444' },
  )

  const { x1, y1, x2, y2 } = lineEndpoints(result)

  const handleDragging = useCallback((id: 'A' | 'B', wx: number, wy: number) => {
    setDraft(prev => {
      const base = prev ?? state
      return id === 'A'
        ? { ...base, pointA: { x: wx, y: wy } }
        : { ...base, pointB: { x: wx, y: wy } }
    })
  }, [state])

  const handleDragEnd = useCallback((id: 'A' | 'B', wx: number, wy: number) => {
    const newState = id === 'A'
      ? { ...state, pointA: { x: wx, y: wy } }
      : { ...state, pointB: { x: wx, y: wy } }
    setDraft(null)
    onChange(newState)
  }, [state, onChange])

  return (
    <div className="flex flex-col gap-2 nodrag nopan select-none">
      {/* SVG graph */}
      <svg
        ref={svgRef}
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="rounded border border-gray-200 bg-white block"
        style={{ touchAction: 'none', maxWidth: '100%' }}
      >
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6"
            refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#6b7280" />
          </marker>
          {/* clip the line to the plot area */}
          <clipPath id="plot-clip">
            <rect x={PAD_LEFT} y={PAD_TOP} width={SVG_W - PAD_LEFT - PAD_RIGHT}
              height={SVG_H - PAD_TOP - PAD_BOTTOM} />
          </clipPath>
        </defs>

        <GridLines />
        <Axes />

        {/* The line through A and B */}
        <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#8b5cf6" strokeWidth={2} strokeDasharray="none"
          clipPath="url(#plot-clip)" style={{ pointerEvents: 'none' }} />

        <DraggablePoint id="A" wx={current.pointA.x} wy={current.pointA.y}
          color="#3b82f6" svgRef={svgRef}
          onDragging={handleDragging} onDragEnd={handleDragEnd} readonly={readonly} />
        <DraggablePoint id="B" wx={current.pointB.x} wy={current.pointB.y}
          color="#ef4444" svgRef={svgRef}
          onDragging={handleDragging} onDragEnd={handleDragEnd} readonly={readonly} />
      </svg>

      {/* Live equation panel */}
      <div className="rounded border border-purple-100 bg-purple-50 px-3 py-2 text-sm">
        <span className="font-mono font-semibold text-purple-700">{result.equation}</span>
        <span className="ml-4 text-purple-500 text-xs">{result.slopeLabel}</span>
        {result.interceptLabel && result.type !== 'vertical' && (
          <span className="ml-3 text-purple-500 text-xs">{result.interceptLabel}</span>
        )}
      </div>

      {/* Accessible coordinate inputs */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {(['A', 'B'] as const).map(id => {
          const pt = id === 'A' ? current.pointA : current.pointB
          const color = id === 'A' ? 'text-blue-600' : 'text-red-500'
          const borderColor = id === 'A' ? 'border-blue-200 focus:border-blue-400' : 'border-red-200 focus:border-red-400'
          return (
            <div key={id} className="flex items-center gap-1">
              <span className={`font-bold w-4 ${color}`}>{id}</span>
              <label className="text-gray-500">x</label>
              <input
                type="number"
                step="0.5"
                min={DEFAULT_RANGE.xMin}
                max={DEFAULT_RANGE.xMax}
                value={pt.x}
                readOnly={readonly}
                onChange={e => {
                  const v = clamp(snapToHalf(parseFloat(e.target.value) || 0), DEFAULT_RANGE.xMin, DEFAULT_RANGE.xMax)
                  const newState = id === 'A'
                    ? { ...state, pointA: { ...state.pointA, x: v } }
                    : { ...state, pointB: { ...state.pointB, x: v } }
                  onChange(newState)
                }}
                className={`w-14 border rounded px-1 py-0.5 text-center ${borderColor} outline-none text-xs`}
                aria-label={`Point ${id} x coordinate`}
              />
              <label className="text-gray-500">y</label>
              <input
                type="number"
                step="0.5"
                min={DEFAULT_RANGE.yMin}
                max={DEFAULT_RANGE.yMax}
                value={pt.y}
                readOnly={readonly}
                onChange={e => {
                  const v = clamp(snapToHalf(parseFloat(e.target.value) || 0), DEFAULT_RANGE.yMin, DEFAULT_RANGE.yMax)
                  const newState = id === 'A'
                    ? { ...state, pointA: { ...state.pointA, y: v } }
                    : { ...state, pointB: { ...state.pointB, y: v } }
                  onChange(newState)
                }}
                className={`w-14 border rounded px-1 py-0.5 text-center ${borderColor} outline-none text-xs`}
                aria-label={`Point ${id} y coordinate`}
              />
            </div>
          )
        })}
      </div>

      {/* Check button */}
      {!readonly && (
        <button
          onClick={onCheck}
          className="mt-1 w-full rounded bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 active:bg-purple-800 transition-colors"
        >
          Check with Compass
        </button>
      )}
    </div>
  )
}
