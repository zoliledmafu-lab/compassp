import { useEffect, useRef } from 'react'
import type { ProcessDiagramWidgetState } from '../../lib/learningTypes'

interface Props {
  value: ProcessDiagramWidgetState
  onChange: (s: ProcessDiagramWidgetState) => void
  onSizeChange: (w: number, h: number) => void
  equation?: string
}

interface Stage {
  id: string
  label: string
  info: string
  color: string
  x: number
  y: number
  w: number
  h: number
}

const STAGES: Stage[] = [
  {
    id: 'burner',
    label: 'Bunsen Burner',
    info: 'Provides heat to the flask. Temperature is controlled by the air-hole on the barrel.',
    color: '#f97316',
    x: 55, y: 248, w: 100, h: 72,
  },
  {
    id: 'flask',
    label: 'Distilling Flask',
    info: 'Contains the liquid mixture. The component with the lowest boiling point vaporises first.',
    color: '#38bdf8',
    x: 40, y: 140, w: 130, h: 95,
  },
  {
    id: 'thermometer',
    label: 'Thermometer',
    info: 'Measures the vapour temperature at the flask neck — tells you exactly which substance is distilling.',
    color: '#a78bfa',
    x: 248, y: 22, w: 104, h: 75,
  },
  {
    id: 'condenser',
    label: 'Liebig Condenser',
    info: 'Cold water flows through the outer jacket, cooling vapour in the inner tube back into liquid.',
    color: '#4ade80',
    x: 370, y: 108, w: 160, h: 88,
  },
  {
    id: 'receiver',
    label: 'Receiving Flask',
    info: 'Collects the purified distillate — the separated liquid component drips in here.',
    color: '#fbbf24',
    x: 432, y: 228, w: 130, h: 82,
  },
]

export function DistillationWidget({ value, onChange, onSizeChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cbRef = useRef(onSizeChange)
  cbRef.current = onSizeChange

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      cbRef.current(width, height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const select = (id: string) => {
    const visited = value.visitedStages.includes(id)
      ? value.visitedStages
      : [...value.visitedStages, id]
    onChange({ selectedStage: id, visitedStages: visited })
  }

  const sel = value.selectedStage
  const selStage = STAGES.find(s => s.id === sel)

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
      <svg
        viewBox="0 0 600 340"
        style={{ flex: 1, minHeight: 0, width: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker id="dist-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.45)" />
          </marker>
        </defs>

        {/* Connection arrows */}
        {/* Burner → Flask: up */}
        <line x1="105" y1="246" x2="105" y2="237" stroke="rgba(255,255,255,0.22)" strokeWidth="2" markerEnd="url(#dist-arrow)" />

        {/* Flask → Thermometer: diagonal */}
        <line x1="165" y1="152" x2="252" y2="90" stroke="rgba(255,255,255,0.22)" strokeWidth="2" markerEnd="url(#dist-arrow)" />

        {/* Thermometer → Condenser: right then down */}
        <path d="M350,58 L370,58 L370,150" stroke="rgba(255,255,255,0.22)" strokeWidth="2" fill="none" markerEnd="url(#dist-arrow)" />

        {/* Condenser → Receiver: down */}
        <line x1="497" y1="196" x2="497" y2="226" stroke="rgba(255,255,255,0.22)" strokeWidth="2" markerEnd="url(#dist-arrow)" />

        {/* Water labels on condenser */}
        <text x="538" y="128" fontSize="9" fill="#38bdf8" fontFamily="Inter,system-ui,sans-serif">Water in ↑</text>
        <text x="536" y="188" fontSize="9" fill="#38bdf8" fontFamily="Inter,system-ui,sans-serif">Water out ↓</text>

        {/* Stage boxes */}
        {STAGES.map(stage => {
          const isSelected = sel === stage.id
          const isVisited = value.visitedStages.includes(stage.id)
          return (
            <g key={stage.id} style={{ cursor: 'pointer' }} onClick={() => select(stage.id)}>
              <rect
                x={stage.x}
                y={stage.y}
                width={stage.w}
                height={stage.h}
                rx={8}
                fill={isSelected ? `${stage.color}26` : isVisited ? `${stage.color}10` : 'rgba(255,255,255,0.05)'}
                stroke={isSelected ? stage.color : isVisited ? `${stage.color}55` : 'rgba(255,255,255,0.15)'}
                strokeWidth={isSelected ? 2 : 1}
              />
              <text
                x={stage.x + stage.w / 2}
                y={stage.y + stage.h / 2 - 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fontWeight={isSelected ? '700' : '500'}
                fill={isSelected ? stage.color : isVisited ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.55)'}
                fontFamily="Inter,system-ui,sans-serif"
              >
                {stage.label}
              </text>
              {isVisited && !isSelected && (
                <circle cx={stage.x + stage.w - 10} cy={stage.y + 10} r={4} fill={stage.color} opacity={0.7} />
              )}
            </g>
          )
        })}
      </svg>

      {/* Info panel */}
      <div style={{
        flexShrink: 0,
        margin: '4px 8px 8px',
        padding: '10px 14px',
        background: selStage ? `${selStage.color}14` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${selStage ? `${selStage.color}40` : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12,
        minHeight: 52,
        transition: 'all 0.2s ease',
      }}>
        {selStage ? (
          <>
            <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, color: selStage.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {selStage.label}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>
              {selStage.info}
            </p>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
            Click on any part of the distillation apparatus to learn what it does.
          </p>
        )}
      </div>
    </div>
  )
}
