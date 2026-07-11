import { useCallback, useEffect, useRef, useState } from 'react'
import type { PythagorasWidgetState } from '../../lib/learningTypes'

interface Props {
  gridRange: number   // max side value displayable
  equation?: string
  value: PythagorasWidgetState
  onChange: (state: PythagorasWidgetState) => void
  onSizeChange?: (w: number, h: number) => void
}

export function PythagorasWidget({ gridRange, equation, value, onChange, onSizeChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 360, h: 360 })
  const [drag, setDrag] = useState<'a' | 'b' | null>(null)

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

  const pad = 52
  // Origin = bottom-left of the triangle
  const originX = pad + 10
  const originY = size.h - pad

  const toSvgX = useCallback((g: number) => originX + (g / gridRange) * (size.w - originX - pad), [originX, size, gridRange, pad])
  const toSvgY = useCallback((g: number) => originY - (g / gridRange) * (originY - pad), [originY, pad, gridRange])

  const fromSvgX = useCallback((px: number) => {
    const g = ((px - originX) / (size.w - originX - pad)) * gridRange
    return Math.max(0.5, Math.min(gridRange * 0.95, Math.round(g * 2) / 2))
  }, [originX, size, gridRange, pad])

  const fromSvgY = useCallback((py: number) => {
    const g = ((originY - py) / (originY - pad)) * gridRange
    return Math.max(0.5, Math.min(gridRange * 0.95, Math.round(g * 2) / 2))
  }, [originY, pad, gridRange])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!drag) return
    const rect = containerRef.current?.querySelector('svg')?.getBoundingClientRect()
    if (!rect) return
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    if (drag === 'a') {
      onChange({ ...value, a: fromSvgX(px) })
    } else {
      onChange({ ...value, b: fromSvgY(py) })
    }
  }, [drag, value, onChange, fromSvgX, fromSvgY])

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

  // Triangle vertices in SVG coords
  const O  = { x: originX, y: originY }           // right angle at origin
  const A  = { x: toSvgX(value.a), y: originY }   // base point
  const B  = { x: originX, y: toSvgY(value.b) }   // height point

  // Grid
  const step = gridRange <= 8 ? 1 : gridRange <= 14 ? 2 : 4
  const gridVals: number[] = []
  for (let v = 0; v <= gridRange; v += step) gridVals.push(v)

  const hyp = Math.sqrt(value.a ** 2 + value.b ** 2)

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center" style={{ background: 'transparent', borderRadius: 16, overflow: 'hidden' }}>
      <svg
        width={size.w} height={size.h}
        style={{ cursor: drag ? 'grabbing' : 'default', userSelect: 'none' }}
      >
        {/* Grid lines */}
        {gridVals.map(v => (
          <g key={v}>
            <line x1={toSvgX(v)} y1={pad} x2={toSvgX(v)} y2={originY} stroke={v === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'} strokeWidth={0.75} />
            <line x1={originX} y1={toSvgY(v)} x2={size.w - pad} y2={toSvgY(v)} stroke={v === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'} strokeWidth={0.75} />
            {v > 0 && (
              <>
                <text x={toSvgX(v)} y={originY + 14} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.3)">{v}</text>
                <text x={originX - 6} y={toSvgY(v) + 4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.3)">{v}</text>
              </>
            )}
          </g>
        ))}

        {/* Axes */}
        <line x1={originX} y1={pad / 2} x2={originX} y2={originY} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
        <line x1={originX} y1={originY} x2={size.w - pad / 2} y2={originY} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />

        {/* Triangle fill */}
        <polygon
          points={`${O.x},${O.y} ${A.x},${A.y} ${B.x},${B.y}`}
          fill="rgba(99,102,241,0.07)" stroke="none"
        />

        {/* Base (leg a) */}
        <line x1={O.x} y1={O.y} x2={A.x} y2={A.y} stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" />

        {/* Height (leg b) */}
        <line x1={O.x} y1={O.y} x2={B.x} y2={B.y} stroke="#0d9488" strokeWidth={2.5} strokeLinecap="round" />

        {/* Hypotenuse */}
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#d97706" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="8 4" />

        {/* Right angle marker */}
        <rect x={O.x} y={O.y - 12} width={12} height={12} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />

        {/* Side labels */}
        <text x={(O.x + A.x) / 2} y={O.y + 18} textAnchor="middle" fontSize={11} fill="#a5b4fc" fontWeight="700">
          a = {value.a}
        </text>
        <text x={O.x - 18} y={(O.y + B.y) / 2 + 4} textAnchor="middle" fontSize={11} fill="#5eead4" fontWeight="700">
          b = {value.b}
        </text>
        <text
          x={(A.x + B.x) / 2 + 14}
          y={(A.y + B.y) / 2}
          textAnchor="start" fontSize={10} fill="#fcd34d" fontWeight="700"
        >
          c ≈ {hyp.toFixed(2)}
        </text>

        {/* Base handle (a) */}
        <circle
          cx={A.x} cy={A.y} r={14}
          fill="#6366f1" stroke="white" strokeWidth={2.5}
          style={{ cursor: 'ew-resize' }}
          onMouseDown={e => { e.stopPropagation(); setDrag('a') }}
          onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setDrag('a') }}
        />
        <line x1={A.x - 5} y1={A.y} x2={A.x + 5} y2={A.y} stroke="white" strokeWidth={1.5} />

        {/* Height handle (b) */}
        <circle
          cx={B.x} cy={B.y} r={14}
          fill="#0d9488" stroke="white" strokeWidth={2.5}
          style={{ cursor: 'ns-resize' }}
          onMouseDown={e => { e.stopPropagation(); setDrag('b') }}
          onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setDrag('b') }}
        />
        <line x1={B.x} y1={B.y - 5} x2={B.x} y2={B.y + 5} stroke="white" strokeWidth={1.5} />
      </svg>

      {equation && (
        <div className="mt-1 mb-3 text-sm font-medium" style={{ fontFamily: 'Georgia, serif', color: 'rgba(255,255,255,0.55)' }}>
          {equation}
        </div>
      )}
    </div>
  )
}
