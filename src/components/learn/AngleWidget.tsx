import { useCallback, useEffect, useRef, useState } from 'react'
import type { AngleWidgetState } from '../../lib/learningTypes'

interface Props {
  gridRange: number  // 180 = semicircle mode, 360 = full circle mode
  equation?: string
  value: AngleWidgetState
  onChange: (state: AngleWidgetState) => void
  onSizeChange?: (w: number, h: number) => void
}

export function AngleWidget({ gridRange, equation, value, onChange, onSizeChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 360, h: 360 })
  const [dragging, setDragging] = useState(false)

  const fullCircle = gridRange > 180

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

  // Protractor center and radius
  const cx = size.w / 2
  const cy = fullCircle ? size.h / 2 : size.h * 0.68
  const R  = Math.min(size.w, size.h) * (fullCircle ? 0.38 : 0.42)

  const degToRad = (d: number) => (d * Math.PI) / 180

  // Arm tip position (math convention: 0° = right, 90° = up)
  const armX = (deg: number) => cx + R * Math.cos(degToRad(deg))
  const armY = (deg: number) => cy - R * Math.sin(degToRad(deg))

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return
    const rect = containerRef.current?.querySelector('svg')?.getBoundingClientRect()
    if (!rect) return
    const dx = e.clientX - rect.left - cx
    const dy = cy - (e.clientY - rect.top)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    if (angle < 0) angle += 360
    // Clamp to valid range
    const maxAngle = fullCircle ? 359 : 180
    const clamped = Math.max(0, Math.min(maxAngle, angle))
    onChange({ angleDeg: Math.round(clamped) })
  }, [dragging, cx, cy, onChange, fullCircle])

  useEffect(() => {
    if (!dragging) return
    const up = () => setDragging(false)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', up) }
  }, [dragging, handleMouseMove])

  // Protractor arc
  const arcLarge = fullCircle ? 1 : (180 > 180 ? 1 : 0)
  const arcEndX = fullCircle ? cx + R - 0.01 : cx - R
  const arcEndY = fullCircle ? cy : cy
  const arcSweep = fullCircle ? 1 : 0

  // Arc path (semicircle or full circle)
  const arcPath = fullCircle
    ? `M ${cx + R} ${cy} A ${R} ${R} 0 1 0 ${cx + R - 0.01} ${cy}`
    : `M ${cx + R} ${cy} A ${R} ${R} 0 ${arcLarge} ${arcSweep} ${arcEndX} ${arcEndY}`

  // Tick marks
  const ticks: number[] = []
  const maxTick = fullCircle ? 350 : 180
  for (let t = 0; t <= maxTick; t += 10) ticks.push(t)

  // Angle arc (shows the student's angle in teal)
  const aRad = degToRad(value.angleDeg)
  const arcX = cx + R * 0.6 * Math.cos(aRad)
  const arcY = cy - R * 0.6 * Math.sin(aRad)
  const largeArc = value.angleDeg > 180 ? 1 : 0
  const anglePath = `M ${cx + R * 0.6} ${cy} A ${R * 0.6} ${R * 0.6} 0 ${largeArc} 0 ${arcX} ${arcY}`

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center" style={{ background: 'transparent', borderRadius: 16, overflow: 'hidden' }}>
      <svg
        width={size.w} height={size.h}
        style={{ cursor: dragging ? 'grabbing' : 'default', userSelect: 'none' }}
      >
        {/* Protractor outline */}
        <path d={arcPath} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} fill="rgba(255,255,255,0.03)" />
        {!fullCircle && (
          <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="#cbd5e1" strokeWidth={1.5} />
        )}

        {/* Tick marks */}
        {ticks.map(t => {
          const isLarge = t % 30 === 0
          const inner = R * (isLarge ? 0.88 : 0.93)
          const outer = R * 1.02
          const tx1 = cx + inner * Math.cos(degToRad(t))
          const ty1 = cy - inner * Math.sin(degToRad(t))
          const tx2 = cx + outer * Math.cos(degToRad(t))
          const ty2 = cy - outer * Math.sin(degToRad(t))
          return (
            <g key={t}>
              <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="rgba(255,255,255,0.25)" strokeWidth={isLarge ? 1.5 : 0.75} />
              {isLarge && (
                <text
                  x={cx + (R + 18) * Math.cos(degToRad(t))}
                  y={cy - (R + 18) * Math.sin(degToRad(t)) + 4}
                  textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.4)" fontWeight="500"
                >
                  {t}
                </text>
              )}
            </g>
          )
        })}

        {/* Base arm (0°, horizontal right) */}
        <line x1={cx} y1={cy} x2={cx + R} y2={cy} stroke="rgba(255,255,255,0.25)" strokeWidth={2} strokeLinecap="round" />

        {/* Angle arc fill */}
        {value.angleDeg > 1 && (
          <path d={anglePath} stroke="#0d9488" strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.75} />
        )}

        {/* Draggable arm */}
        <line
          x1={cx} y1={cy}
          x2={armX(value.angleDeg)} y2={armY(value.angleDeg)}
          stroke="#0d9488" strokeWidth={3} strokeLinecap="round"
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={5} fill="#0d9488" />

        {/* Draggable tip */}
        <circle
          cx={armX(value.angleDeg)} cy={armY(value.angleDeg)} r={10}
          fill="#0d9488" stroke="white" strokeWidth={2.5}
          style={{ cursor: 'grab' }}
          onMouseDown={e => { e.stopPropagation(); setDragging(true) }}
        />

        {/* Degree readout */}
        <rect x={cx - 30} y={cy - (fullCircle ? 20 : 28)} width={60} height={22} rx={8} fill="rgba(15,118,110,0.9)" />
        <text x={cx} y={cy - (fullCircle ? 12 : 20) + 8} textAnchor="middle" fontSize={13} fill="white" fontWeight="700">
          {Math.round(value.angleDeg)}°
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
