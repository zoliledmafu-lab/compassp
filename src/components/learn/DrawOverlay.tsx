import type { DrawAnnotation } from '../../lib/learningTypes'

interface Props {
  annotations: DrawAnnotation[]
  gridRange: number
  width: number
  height: number
}

export function DrawOverlay({ annotations, gridRange, width, height }: Props) {
  if (!width || !height) return null

  // Map grid coords → pixel coords
  const pad = 40
  const toX = (gx: number) => width / 2 + (gx / gridRange) * (width / 2 - pad)
  const toY = (gy: number) => height / 2 - (gy / gridRange) * (height / 2 - pad)
  const toR = (gr: number) => (gr / gridRange) * (width / 2 - pad)

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}
    >
      <defs>
        <marker id="arrow-head" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#f59e0b" />
        </marker>
      </defs>

      {annotations.filter(a => a.type !== 'erase').map(a => {
        const px = toX(a.target.x)
        const py = toY(a.target.y)
        const col = a.style.color
        const op  = a.style.opacity
        const sw  = a.style.strokeWidth ?? 2.5

        switch (a.type) {
          case 'circle':
            return (
              <circle
                key={a.id}
                cx={px} cy={py}
                r={a.target.r != null ? toR(a.target.r) : 20}
                stroke={col} strokeWidth={sw} fill="none"
                opacity={op}
                strokeDasharray={a.style.dashArray}
              />
            )

          case 'ghost_sketch':
            return (
              <circle
                key={a.id}
                cx={px} cy={py}
                r={a.target.r != null ? toR(a.target.r) : 20}
                stroke={col} strokeWidth={sw + 0.5} fill="none"
                opacity={op}
                strokeDasharray={a.style.dashArray ?? '10 6'}
              >
                <animate attributeName="opacity" values={`${op};${op * 0.5};${op}`} dur="3s" repeatCount="indefinite" />
              </circle>
            )

          case 'arrow': {
            const tx = a.target.x2 != null ? toX(a.target.x2) : px + 40
            const ty = a.target.y2 != null ? toY(a.target.y2) : py - 40
            return (
              <line
                key={a.id}
                x1={px} y1={py} x2={tx} y2={ty}
                stroke={col} strokeWidth={sw} opacity={op}
                markerEnd="url(#arrow-head)"
                strokeLinecap="round"
              />
            )
          }

          case 'highlight': {
            const rw = a.target.x2 != null ? toR(a.target.x2) : 40
            const rh = a.target.y2 != null ? toR(a.target.y2) : 40
            return (
              <rect
                key={a.id}
                x={px - rw / 2} y={py - rh / 2}
                width={rw} height={rh}
                fill={col} opacity={op}
                rx={6}
              />
            )
          }

          case 'label':
            return (
              <g key={a.id} opacity={op}>
                <rect x={px - 4} y={py - 16} width={(a.text?.length ?? 4) * 7 + 8} height={20} rx={4} fill="rgba(0,0,0,0.65)" />
                <text x={px} y={py - 2} fontSize={12} fill={col} fontWeight="600" fontFamily="system-ui">{a.text}</text>
              </g>
            )

          default:
            return null
        }
      })}
    </svg>
  )
}
