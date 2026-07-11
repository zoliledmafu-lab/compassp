import { useCallback, useEffect, useRef, useState } from 'react'
import type { CircleWidgetState } from '../../lib/learningTypes'

interface Props {
  gridRange: number
  equation?: string
  value: CircleWidgetState
  onChange: (state: CircleWidgetState) => void
  onSizeChange?: (w: number, h: number) => void
}

export function CircleGraphWidget({ gridRange, equation, value, onChange, onSizeChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 360, h: 360 })
  const [drag, setDrag]   = useState<'center' | 'radius' | null>(null)

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

  const pad = 40
  const toX = useCallback((gx: number) => size.w / 2 + (gx / gridRange) * (size.w / 2 - pad), [size, gridRange])
  const toY = useCallback((gy: number) => size.h / 2 - (gy / gridRange) * (size.h / 2 - pad), [size, gridRange])
  const toR = useCallback((r: number) => (r / gridRange) * (size.w / 2 - pad), [size, gridRange])
  const fromPx = useCallback((px: number, py: number) => {
    const gx = ((px - size.w / 2) / (size.w / 2 - pad)) * gridRange
    const gy = -((py - size.h / 2) / (size.h / 2 - pad)) * gridRange
    return { gx: Math.round(gx * 2) / 2, gy: Math.round(gy * 2) / 2 }
  }, [size, gridRange])

  const svgPoint = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = (e.currentTarget ?? e.target) as SVGSVGElement
    const rect = svg.getBoundingClientRect()
    return { px: e.clientX - rect.left, py: e.clientY - rect.top }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!drag) return
    const rect = containerRef.current?.querySelector('svg')?.getBoundingClientRect()
    if (!rect) return
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    if (drag === 'center') {
      const { gx, gy } = fromPx(px, py)
      onChange({ ...value, center: { x: gx, y: gy } })
    } else {
      const dx = px - toX(value.center.x)
      const dy = py - toY(value.center.y)
      const pixelR = Math.sqrt(dx * dx + dy * dy)
      const gridR = (pixelR / (size.w / 2 - pad)) * gridRange
      const r = Math.max(0.5, Math.round(gridR * 2) / 2)
      onChange({ ...value, radius: r })
    }
  }, [drag, value, onChange, fromPx, toX, toY, size, gridRange])

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
  const step = gridRange <= 6 ? 1 : gridRange <= 10 ? 2 : 2
  const gridLines: number[] = []
  for (let v = -gridRange; v <= gridRange; v += step) gridLines.push(v)

  const cx = toX(value.center.x)
  const cy = toY(value.center.y)
  const cr = toR(value.radius)
  // Radius handle at east side of circle
  const rhx = toX(value.center.x + value.radius)
  const rhy = toY(value.center.y)

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center" style={{ background: 'transparent', borderRadius: 16, overflow: 'hidden' }}>
      <svg
        width={size.w} height={size.h}
        style={{ cursor: drag ? 'grabbing' : 'default', userSelect: 'none' }}
        onMouseDown={e => { void svgPoint(e) /* keep ts happy */ }}
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

        {/* Student's circle */}
        {value.radius > 0 && (
          <circle cx={cx} cy={cy} r={cr} stroke="#6366f1" strokeWidth={2.5} fill="rgba(99,102,241,0.08)" />
        )}

        {/* Radius line */}
        {value.radius > 0 && (
          <line x1={cx} y1={cy} x2={rhx} y2={rhy} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
        )}

        {/* Radius handle */}
        <circle
          cx={rhx} cy={rhy} r={12}
          fill="#6366f1" stroke="white" strokeWidth={2}
          style={{ cursor: 'grab' }}
          onMouseDown={e => { e.stopPropagation(); setDrag('radius') }}
          onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setDrag('radius') }}
        />

        {/* Centre dot */}
        <circle
          cx={cx} cy={cy} r={13}
          fill="#0d9488" stroke="white" strokeWidth={2.5}
          style={{ cursor: 'grab' }}
          onMouseDown={e => { e.stopPropagation(); setDrag('center') }}
          onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setDrag('center') }}
        />
        {/* Centre crosshair */}
        <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} stroke="white" strokeWidth={1.5} />
        <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 5} stroke="white" strokeWidth={1.5} />

        {/* Coord labels */}
        <text x={cx + 10} y={cy - 10} fontSize={10} fill="#5eead4" fontWeight="600">
          ({value.center.x}, {value.center.y})
        </text>
        {value.radius > 0 && (
          <text x={(cx + rhx) / 2} y={cy - 8} fontSize={10} fill="#6366f1" fontWeight="600" textAnchor="middle">
            r = {value.radius}
          </text>
        )}
      </svg>

      {/* Equation label */}
      {equation && (
        <div className="mt-2 mb-3 text-sm font-medium" style={{ fontFamily: 'Georgia, serif', letterSpacing: 0.3, color: 'rgba(255,255,255,0.55)' }}>
          {equation}
        </div>
      )}
    </div>
  )
}
