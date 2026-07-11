import { useCallback, useEffect, useRef, useState } from 'react'
import type { NumberLineWidgetState } from '../../lib/learningTypes'

interface Zone {
  min: number
  max: number
  color: string
  label: string
}

interface Props {
  gridRange: number
  min?: number
  max?: number
  unit?: string
  zones?: Zone[]
  equation?: string
  value: NumberLineWidgetState
  onChange: (state: NumberLineWidgetState) => void
  onSizeChange?: (w: number, h: number) => void
}

export function NumberLineWidget({
  min = 0, max = 14, unit = '', zones = [], equation,
  value, onChange, onSizeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 360, h: 260 })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      const w = Math.min(width, 560)
      const h = Math.min(height, 320)
      setSize({ w, h })
      onSizeChange?.(w, h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [onSizeChange])

  const pad = 48
  const lineY = size.h * 0.52
  const lineX1 = pad
  const lineX2 = size.w - pad

  const toSvgX = useCallback((v: number) => lineX1 + ((v - min) / (max - min)) * (lineX2 - lineX1), [min, max, lineX1, lineX2])
  const fromSvgX = useCallback((px: number) => {
    const raw = min + ((px - lineX1) / (lineX2 - lineX1)) * (max - min)
    return Math.max(min, Math.min(max, Math.round(raw * 2) / 2))
  }, [min, max, lineX1, lineX2])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return
    const rect = containerRef.current?.querySelector('svg')?.getBoundingClientRect()
    if (!rect) return
    const px = e.clientX - rect.left
    onChange({ value: fromSvgX(px) })
  }, [dragging, fromSvgX, onChange])

  useEffect(() => {
    if (!dragging) return
    const up = () => setDragging(false)
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
  }, [dragging, handleMouseMove])

  const markerX = toSvgX(value.value)

  // Tick spacing
  const range = max - min
  const tickStep = range <= 14 ? 1 : range <= 30 ? 5 : 10
  const ticks: number[] = []
  for (let v = min; v <= max; v += tickStep) ticks.push(v)

  // Zone label at marker position
  const currentZone = zones.find(z => value.value >= z.min && value.value <= z.max)
  const markerColor = currentZone?.color ?? '#6366f1'

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center"
      style={{ background: 'transparent', borderRadius: 16, overflow: 'hidden', minHeight: 200 }}
    >
      <svg
        width={size.w} height={size.h}
        style={{ cursor: dragging ? 'grabbing' : 'default', userSelect: 'none' }}
      >
        {/* Colored zones */}
        {zones.map((z, i) => {
          const zx1 = toSvgX(Math.max(z.min, min))
          const zx2 = toSvgX(Math.min(z.max, max))
          return (
            <g key={i}>
              <rect
                x={zx1} y={lineY - 18} width={zx2 - zx1} height={36}
                fill={z.color} opacity={0.18} rx={4}
              />
              <text
                x={(zx1 + zx2) / 2} y={lineY + 36}
                textAnchor="middle" fontSize={9} fill={z.color} fontWeight="600" opacity={0.85}
              >
                {z.label}
              </text>
            </g>
          )
        })}

        {/* Track line */}
        <line x1={lineX1} y1={lineY} x2={lineX2} y2={lineY} stroke="rgba(255,255,255,0.2)" strokeWidth={3} strokeLinecap="round" />

        {/* Tick marks + labels */}
        {ticks.map(t => {
          const tx = toSvgX(t)
          const isMajor = range <= 14 || t % (tickStep * 2) === 0
          return (
            <g key={t}>
              <line x1={tx} y1={lineY - (isMajor ? 10 : 5)} x2={tx} y2={lineY + (isMajor ? 10 : 5)} stroke="rgba(255,255,255,0.25)" strokeWidth={isMajor ? 1.5 : 0.75} />
              {isMajor && (
                <text x={tx} y={lineY - 16} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.45)" fontWeight="500">
                  {t}{unit}
                </text>
              )}
            </g>
          )
        })}

        {/* Marker line */}
        <line x1={markerX} y1={lineY - 28} x2={markerX} y2={lineY + 28} stroke={markerColor} strokeWidth={2} strokeDasharray="4 3" opacity={0.6} />

        {/* Draggable marker */}
        <g
          onMouseDown={e => { e.stopPropagation(); setDragging(true) }}
          onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setDragging(true) }}
          style={{ cursor: 'grab' }}
        >
          <circle cx={markerX} cy={lineY} r={20} fill={markerColor} stroke="white" strokeWidth={2.5} />
          <text x={markerX} y={lineY + 5} textAnchor="middle" fontSize={11} fill="white" fontWeight="700">
            {value.value}
          </text>
        </g>

        {/* Zone badge above marker */}
        {currentZone && (
          <>
            <rect
              x={markerX - 28} y={lineY - 62} width={56} height={22}
              rx={8} fill={currentZone.color}
            />
            <text x={markerX} y={lineY - 46} textAnchor="middle" fontSize={10} fill="white" fontWeight="700">
              {currentZone.label}
            </text>
          </>
        )}
      </svg>

      {equation && (
        <div className="mt-1 mb-3 text-sm font-medium" style={{ fontFamily: 'Georgia, serif', color: 'rgba(255,255,255,0.55)' }}>
          {equation}
        </div>
      )}
    </div>
  )
}
