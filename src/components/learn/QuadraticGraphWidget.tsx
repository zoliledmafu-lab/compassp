import { useCallback, useEffect, useRef, useState } from 'react'
import type { QuadraticWidgetState } from '../../lib/learningTypes'

interface Props {
  gridRange: number
  equation?: string
  value: QuadraticWidgetState
  onChange: (state: QuadraticWidgetState) => void
  onSizeChange?: (w: number, h: number) => void
}

export function QuadraticGraphWidget({ gridRange, equation, value, onChange, onSizeChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 360, h: 360 })
  const [drag, setDrag] = useState<'vertex' | 'width' | null>(null)

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
  const toX  = useCallback((gx: number) => size.w / 2 + (gx / gridRange) * (size.w / 2 - pad), [size, gridRange])
  const toY  = useCallback((gy: number) => size.h / 2 - (gy / gridRange) * (size.h / 2 - pad), [size, gridRange])
  const fromPx = useCallback((px: number, py: number) => {
    const gx = ((px - size.w / 2) / (size.w / 2 - pad)) * gridRange
    const gy = -((py - size.h / 2) / (size.h / 2 - pad)) * gridRange
    return { gx: Math.round(gx * 4) / 4, gy: Math.round(gy * 4) / 4 }
  }, [size, gridRange])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!drag) return
    const rect = containerRef.current?.querySelector('svg')?.getBoundingClientRect()
    if (!rect) return
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const { gx, gy } = fromPx(px, py)

    if (drag === 'vertex') {
      const clampH = Math.max(-gridRange * 0.8, Math.min(gridRange * 0.8, gx))
      const clampK = Math.max(-gridRange * 0.8, Math.min(gridRange * 0.8, gy))
      onChange({ ...value, h: clampH, k: clampK })
    } else {
      // Width handle is fixed at x = h+1; only gy changes → newA = gy - k
      const newA = gy - value.k
      // Clamp and prevent a near 0 (flat degenerate parabola)
      const clampedA = newA > 0
        ? Math.max(0.1, Math.min(gridRange * 0.8, newA))
        : Math.min(-0.1, Math.max(-gridRange * 0.8, newA))
      onChange({ ...value, a: Math.round(clampedA * 4) / 4 })
    }
  }, [drag, value, onChange, fromPx, gridRange])

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

  // Grid
  const step = gridRange <= 6 ? 1 : 2
  const gridLines: number[] = []
  for (let v = -gridRange; v <= gridRange; v += step) gridLines.push(v)

  // Parabola path: y = a*(x-h)^2 + k
  const numPoints = 80
  const parabPoints: string[] = []
  for (let i = 0; i <= numPoints; i++) {
    const gx = -gridRange + (i / numPoints) * 2 * gridRange
    const gy = value.a * (gx - value.h) ** 2 + value.k
    const sx = toX(gx)
    const sy = toY(gy)
    parabPoints.push(`${sx},${sy}`)
  }
  const parabolaPath = `M ${parabPoints.join(' L ')}`

  // Vertex handle
  const vx = toX(value.h)
  const vy = toY(value.k)

  // Width handle (1 unit right of vertex)
  const wx = toX(value.h + 1)
  const wy = toY(value.a + value.k)

  const aStr = value.a === Math.round(value.a) ? String(value.a) : value.a.toFixed(2)

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

        {/* Parabola */}
        <clipPath id="qgrid-clip">
          <rect x={pad / 2} y={pad / 2} width={size.w - pad} height={size.h - pad} />
        </clipPath>
        <path
          d={parabolaPath}
          stroke="#6366f1" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"
          clipPath="url(#qgrid-clip)"
        />

        {/* Guide line from vertex to width handle */}
        <line x1={vx} y1={vy} x2={wx} y2={wy} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7} />

        {/* Width handle */}
        <circle
          cx={wx} cy={wy} r={12}
          fill="#f59e0b" stroke="white" strokeWidth={2}
          style={{ cursor: 'grab' }}
          onMouseDown={e => { e.stopPropagation(); setDrag('width') }}
          onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setDrag('width') }}
        />
        <text x={wx} y={wy + 4} textAnchor="middle" fontSize={8} fill="white" fontWeight="700">a</text>

        {/* Vertex handle */}
        <circle
          cx={vx} cy={vy} r={13}
          fill="#0d9488" stroke="white" strokeWidth={2.5}
          style={{ cursor: 'grab' }}
          onMouseDown={e => { e.stopPropagation(); setDrag('vertex') }}
          onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setDrag('vertex') }}
        />
        <line x1={vx - 5} y1={vy} x2={vx + 5} y2={vy} stroke="white" strokeWidth={1.5} />
        <line x1={vx} y1={vy - 5} x2={vx} y2={vy + 5} stroke="white" strokeWidth={1.5} />

        {/* Labels */}
        <text x={vx + 12} y={vy - 8} fontSize={10} fill="#5eead4" fontWeight="600">
          ({value.h}, {value.k})
        </text>
        <text x={wx + 12} y={wy + 4} fontSize={10} fill="#fcd34d" fontWeight="600">
          a = {aStr}
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
