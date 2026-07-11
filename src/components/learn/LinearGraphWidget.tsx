import { useCallback, useEffect, useRef, useState } from 'react'
import type { LinearWidgetState } from '../../lib/learningTypes'

interface Props {
  gridRange: number
  equation?: string
  value: LinearWidgetState
  onChange: (state: LinearWidgetState) => void
  onSizeChange?: (w: number, h: number) => void
}

// Slope handle sits at x = gridRange * 0.45 (fixed x, drag moves y only → changes slope)
// Intercept handle sits at x = 0 (drag moves y only → changes intercept)

export function LinearGraphWidget({ gridRange, equation, value, onChange, onSizeChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 360, h: 360 })
  const [drag, setDrag] = useState<'intercept' | 'slope' | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      const s = Math.min(width, height)
      setSize({ w: s, h: s })
      onSizeChange?.(s, s)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [onSizeChange])

  const pad = 44
  const toX = useCallback((gx: number) => size.w / 2 + (gx / gridRange) * (size.w / 2 - pad), [size, gridRange])
  const toY = useCallback((gy: number) => size.h / 2 - (gy / gridRange) * (size.h / 2 - pad), [size, gridRange])
  const fromPxY = useCallback((py: number) => {
    const gy = -((py - size.h / 2) / (size.h / 2 - pad)) * gridRange
    return Math.round(gy * 4) / 4
  }, [size, gridRange])

  const SLOPE_GX = gridRange * 0.45

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!drag) return
    const rect = containerRef.current?.querySelector('svg')?.getBoundingClientRect()
    if (!rect) return
    const py = e.clientY - rect.top
    const gy = fromPxY(py)

    if (drag === 'intercept') {
      const clamped = Math.max(-gridRange * 0.85, Math.min(gridRange * 0.85, gy))
      onChange({ ...value, intercept: clamped })
    } else {
      const newSlope = (gy - value.intercept) / SLOPE_GX
      const clamped = Math.max(-gridRange, Math.min(gridRange, newSlope))
      onChange({ ...value, slope: Math.round(clamped * 4) / 4 })
    }
  }, [drag, value, onChange, fromPxY, SLOPE_GX, gridRange])

  useEffect(() => {
    if (!drag) return
    const up = () => setDrag(null)
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); handleMouseMove(e.touches[0] as unknown as MouseEvent) }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', up)
    }
  }, [drag, handleMouseMove])

  // Grid lines
  const step = gridRange <= 6 ? 1 : 2
  const gridLines: number[] = []
  for (let v = -gridRange; v <= gridRange; v += step) gridLines.push(v)

  // Compute line endpoints (extends to grid boundary)
  const x1g = -gridRange, y1g = value.slope * x1g + value.intercept
  const x2g = gridRange,  y2g = value.slope * x2g + value.intercept

  // Intercept handle position (at x=0)
  const ihX = toX(0)
  const ihY = toY(value.intercept)

  // Slope handle position (at x=SLOPE_GX)
  const shX = toX(SLOPE_GX)
  const shY = toY(value.slope * SLOPE_GX + value.intercept)

  const slopeStr = value.slope === 0 ? '0'
    : value.slope === Math.round(value.slope)
      ? String(value.slope)
      : value.slope.toFixed(2)

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center" style={{ background: 'transparent', borderRadius: 16, overflow: 'hidden' }}>
      <svg
        width={size.w} height={size.h}
        style={{ cursor: drag ? 'grabbing' : 'default', userSelect: 'none' }}
      >
        {/* Grid */}
        {gridLines.map(v => (
          <g key={v}>
            <line x1={toX(v)} y1={pad / 2} x2={toX(v)} y2={size.h - pad / 2} stroke={v === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'} strokeWidth={v === 0 ? 1.5 : 0.75} />
            <line x1={pad / 2} y1={toY(v)} x2={size.w - pad / 2} y2={toY(v)} stroke={v === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'} strokeWidth={v === 0 ? 1.5 : 0.75} />
            {v !== 0 && (
              <>
                <text x={toX(v)} y={toY(0) + 14} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.3)">{v}</text>
                <text x={toX(0) - 8} y={toY(v) + 4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.3)">{v}</text>
              </>
            )}
          </g>
        ))}

        {/* Axis arrows */}
        <polygon points={`${toX(gridRange) + 4},${toY(0)} ${toX(gridRange)},${toY(0) - 5} ${toX(gridRange)},${toY(0) + 5}`} fill="rgba(255,255,255,0.3)" />
        <polygon points={`${toX(0)},${toY(gridRange) - 4} ${toX(0) - 5},${toY(gridRange)} ${toX(0) + 5},${toY(gridRange)}`} fill="rgba(255,255,255,0.3)" />
        <text x={toX(gridRange) + 10} y={toY(0) + 4} fontSize={11} fill="rgba(255,255,255,0.45)" fontStyle="italic">x</text>
        <text x={toX(0) + 6} y={toY(gridRange) - 6} fontSize={11} fill="rgba(255,255,255,0.45)" fontStyle="italic">y</text>

        {/* The line — clipped to SVG bounds */}
        <clipPath id="grid-clip">
          <rect x={pad / 2} y={pad / 2} width={size.w - pad} height={size.h - pad} />
        </clipPath>
        <line
          x1={toX(x1g)} y1={toY(y1g)} x2={toX(x2g)} y2={toY(y2g)}
          stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round"
          clipPath="url(#grid-clip)"
        />

        {/* Dashed slope guide from intercept to slope handle */}
        <line x1={ihX} y1={ihY} x2={shX} y2={shY} stroke="#6366f1" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />

        {/* Slope handle */}
        <circle
          cx={shX} cy={shY} r={13}
          fill="#6366f1" stroke="white" strokeWidth={2}
          style={{ cursor: 'grab' }}
          onMouseDown={e => { e.stopPropagation(); setDrag('slope') }}
          onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setDrag('slope') }}
        />
        <text x={shX} y={shY + 4} textAnchor="middle" fontSize={8} fill="white" fontWeight="700">m</text>

        {/* Intercept handle */}
        <circle
          cx={ihX} cy={ihY} r={13}
          fill="#0d9488" stroke="white" strokeWidth={2}
          style={{ cursor: 'grab' }}
          onMouseDown={e => { e.stopPropagation(); setDrag('intercept') }}
          onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setDrag('intercept') }}
        />
        <line x1={ihX - 5} y1={ihY} x2={ihX + 5} y2={ihY} stroke="white" strokeWidth={1.5} />
        <line x1={ihX} y1={ihY - 5} x2={ihX} y2={ihY + 5} stroke="white" strokeWidth={1.5} />

        {/* Labels */}
        <text x={ihX + 14} y={ihY - 8} fontSize={10} fill="#5eead4" fontWeight="600">
          c = {value.intercept}
        </text>
        <text x={shX + 14} y={shY + 4} fontSize={10} fill="#6366f1" fontWeight="600">
          m = {slopeStr}
        </text>
      </svg>

      {equation && (
        <div className="mt-1 mb-3 text-sm font-medium" style={{ fontFamily: 'Georgia, serif', color: 'rgba(255,255,255,0.55)' }}>
          {equation}
        </div>
      )}
    </div>
  )
}
