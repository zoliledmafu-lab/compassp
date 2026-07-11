import { useCallback, useEffect, useRef, useState } from 'react'
import type { BarChartWidgetState } from '../../lib/learningTypes'

interface Props {
  gridRange: number
  labels?: string[]
  yMax?: number
  yLabel?: string
  barColor?: string
  equation?: string
  value: BarChartWidgetState
  onChange: (state: BarChartWidgetState) => void
  onSizeChange?: (w: number, h: number) => void
}

export function BarChartWidget({
  labels = [], yMax = 100, yLabel = '', barColor = '#6366f1', equation,
  value, onChange, onSizeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize]     = useState({ w: 400, h: 340 })
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      const w = Math.min(width, 600)
      const h = Math.min(height, 400)
      setSize({ w, h })
      onSizeChange?.(w, h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [onSizeChange])

  const padL = 52, padR = 16, padT = 24, padB = 44
  const chartW = size.w - padL - padR
  const chartH = size.h - padT - padB
  const n = labels.length || value.bars.length || 1
  const barW = Math.max(8, (chartW / n) * 0.65)
  const gap  = chartW / n

  const toSvgY = useCallback((v: number) => padT + chartH - (v / yMax) * chartH, [chartH, padT, yMax])
  const fromSvgY = useCallback((py: number) => {
    const v = ((padT + chartH - py) / chartH) * yMax
    return Math.max(0, Math.min(yMax, Math.round(v)))
  }, [chartH, padT, yMax])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragIdx === null) return
    const rect = containerRef.current?.querySelector('svg')?.getBoundingClientRect()
    if (!rect) return
    const py = e.clientY - rect.top
    const newBars = [...value.bars]
    newBars[dragIdx] = fromSvgY(py)
    onChange({ bars: newBars })
  }, [dragIdx, value.bars, onChange, fromSvgY])

  useEffect(() => {
    if (dragIdx === null) return
    const up = () => setDragIdx(null)
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
  }, [dragIdx, handleMouseMove])

  // Y-axis ticks
  const yTicks: number[] = []
  const yStep = yMax <= 20 ? 5 : yMax <= 50 ? 10 : yMax <= 200 ? 25 : 50
  for (let v = 0; v <= yMax; v += yStep) yTicks.push(v)

  // Bar colors — use gradient fill per bar based on height
  const parseHex = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }
  const rgb = (() => { try { return parseHex(barColor) } catch { return { r: 99, g: 102, b: 241 } } })()

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center"
      style={{ background: 'transparent', borderRadius: 16, overflow: 'hidden', minHeight: 200 }}
    >
      <svg
        width={size.w} height={size.h}
        style={{ cursor: dragIdx !== null ? 'grabbing' : 'default', userSelect: 'none' }}
      >
        <defs>
          <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`rgb(${rgb.r},${rgb.g},${rgb.b})`} stopOpacity="0.9" />
            <stop offset="100%" stopColor={`rgb(${rgb.r},${rgb.g},${rgb.b})`} stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* Y-axis grid lines + labels */}
        {yTicks.map(t => {
          const ty = toSvgY(t)
          return (
            <g key={t}>
              <line x1={padL} y1={ty} x2={size.w - padR} y2={ty} stroke="rgba(255,255,255,0.06)" strokeWidth={0.75} />
              <text x={padL - 6} y={ty + 4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.3)">{t}</text>
            </g>
          )
        })}

        {/* Y-axis */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />

        {/* Y-axis label */}
        {yLabel && (
          <text
            x={12} y={padT + chartH / 2}
            textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.4)" fontWeight="600"
            transform={`rotate(-90, 12, ${padT + chartH / 2})`}
          >
            {yLabel}
          </text>
        )}

        {/* X-axis */}
        <line x1={padL} y1={padT + chartH} x2={size.w - padR} y2={padT + chartH} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />

        {/* Bars */}
        {value.bars.map((barVal, i) => {
          const bx = padL + i * gap + (gap - barW) / 2
          const by = toSvgY(barVal)
          const bh = (padT + chartH) - by
          const handleY = by

          return (
            <g key={i}>
              {/* Bar body */}
              <rect
                x={bx} y={by} width={barW} height={Math.max(0, bh)}
                fill="url(#bar-grad)" rx={3}
              />

              {/* Value label on bar */}
              {barVal > yMax * 0.08 && (
                <text
                  x={bx + barW / 2} y={by + 14}
                  textAnchor="middle" fontSize={9} fill="white" fontWeight="700"
                >
                  {barVal}
                </text>
              )}

              {/* X-axis label */}
              <text
                x={bx + barW / 2} y={padT + chartH + 16}
                textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.4)" fontWeight="500"
              >
                {labels[i] ?? `${i + 1}`}
              </text>

              {/* Draggable handle at bar top */}
              <circle
                cx={bx + barW / 2} cy={handleY} r={12}
                fill={barColor} stroke="white" strokeWidth={2}
                style={{ cursor: 'ns-resize' }}
                onMouseDown={e => { e.stopPropagation(); setDragIdx(i) }}
                onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setDragIdx(i) }}
              />
            </g>
          )
        })}
      </svg>

      {equation && (
        <div className="mt-1 mb-2 text-sm font-medium" style={{ fontFamily: 'Georgia, serif', color: 'rgba(255,255,255,0.55)' }}>
          {equation}
        </div>
      )}
    </div>
  )
}
