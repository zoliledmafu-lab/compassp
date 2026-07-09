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
    id: 'igneous',
    label: 'Igneous Rock',
    info: 'Formed when magma (molten rock) cools and solidifies. Intrusive igneous rocks (like granite) cool slowly underground; extrusive (like basalt) cool quickly at the surface from volcanic eruptions.',
    color: '#f97316',
    x: 230, y: 30, w: 140, h: 70,
  },
  {
    id: 'sedimentary',
    label: 'Sedimentary Rock',
    info: 'Formed from layers of sediment — fragments of rock, shells and organic matter — that compact and cement over millions of years. Sandstone and limestone are common sedimentary rocks.',
    color: '#d97706',
    x: 20, y: 245, w: 150, h: 80,
  },
  {
    id: 'metamorphic',
    label: 'Metamorphic Rock',
    info: 'Existing rocks transformed by intense heat and pressure deep in the Earth\'s crust, without melting. Marble (from limestone) and quartzite (from sandstone) are examples.',
    color: '#8b5cf6',
    x: 430, y: 245, w: 150, h: 80,
  },
  {
    id: 'magma',
    label: 'Magma',
    info: 'Molten rock deep within the Earth\'s mantle and crust. When magma reaches the surface through volcanoes, it is called lava. Cooling magma forms igneous rocks.',
    color: '#ef4444',
    x: 200, y: 232, w: 200, h: 60,
  },
]

interface Arrow {
  d: string
  label: string
  labelX: number
  labelY: number
}

const ARROWS: Arrow[] = [
  // Igneous → Sedimentary (left arc)
  {
    d: 'M 230,80 Q 60,130 95,245',
    label: 'weathering & erosion',
    labelX: 72,
    labelY: 175,
  },
  // Sedimentary → Metamorphic (bottom)
  {
    d: 'M 170,285 Q 300,320 430,285',
    label: 'heat & pressure',
    labelX: 270,
    labelY: 322,
  },
  // Metamorphic → Igneous (right arc)
  {
    d: 'M 505,245 Q 560,130 370,70',
    label: 'melting → cooling',
    labelX: 530,
    labelY: 163,
  },
  // Magma → Igneous (upward)
  {
    d: 'M 300,232 L 300,102',
    label: 'cooling & crystallisation',
    labelX: 308,
    labelY: 168,
  },
  // Sedimentary → Magma (down-right)
  {
    d: 'M 170,270 Q 220,262 200,262',
    label: 'subduction',
    labelX: 148,
    labelY: 265,
  },
  // Metamorphic → Magma (down-left)
  {
    d: 'M 430,270 Q 400,260 400,262',
    label: 'melting',
    labelX: 403,
    labelY: 257,
  },
]

export function RockCycleWidget({ value, onChange, onSizeChange }: Props) {
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
          <marker id="rc-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.35)" />
          </marker>
        </defs>

        {/* Background process arrows */}
        {ARROWS.map((arrow, i) => (
          <g key={i}>
            <path
              d={arrow.d}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#rc-arrow)"
              strokeDasharray="6 3"
            />
            <text
              x={arrow.labelX}
              y={arrow.labelY}
              textAnchor="middle"
              fontSize="8"
              fill="rgba(255,255,255,0.28)"
              fontFamily="Inter,system-ui,sans-serif"
              fontStyle="italic"
            >
              {arrow.label}
            </text>
          </g>
        ))}

        {/* Stage boxes */}
        {STAGES.map(stage => {
          const isSelected = sel === stage.id
          const isVisited = value.visitedStages.includes(stage.id)
          const cx = stage.x + stage.w / 2
          const cy = stage.y + stage.h / 2

          return (
            <g key={stage.id} style={{ cursor: 'pointer' }} onClick={() => select(stage.id)}>
              <rect
                x={stage.x}
                y={stage.y}
                width={stage.w}
                height={stage.h}
                rx={10}
                fill={isSelected ? `${stage.color}22` : isVisited ? `${stage.color}0e` : 'rgba(255,255,255,0.05)'}
                stroke={isSelected ? stage.color : isVisited ? `${stage.color}60` : 'rgba(255,255,255,0.15)'}
                strokeWidth={isSelected ? 2.5 : 1}
              />

              {/* Rock texture hint for igneous */}
              {stage.id === 'igneous' && (
                <g opacity="0.3">
                  {[0,1,2,3,4].map(i => (
                    <circle key={i} cx={stage.x + 20 + i * 22} cy={cy - 2} r={3} fill={stage.color} />
                  ))}
                </g>
              )}

              {/* Layering hint for sedimentary */}
              {stage.id === 'sedimentary' && (
                <g opacity="0.25">
                  {[0,1,2].map(i => (
                    <line key={i} x1={stage.x + 12} y1={stage.y + 18 + i * 14} x2={stage.x + stage.w - 12} y2={stage.y + 18 + i * 14} stroke={stage.color} strokeWidth="2" />
                  ))}
                </g>
              )}

              {/* Swirl hint for metamorphic */}
              {stage.id === 'metamorphic' && (
                <ellipse cx={cx} cy={cy - 5} rx={28} ry={8} fill="none" stroke={stage.color} strokeWidth="1.5" opacity="0.25" />
              )}

              {/* Heat waves for magma */}
              {stage.id === 'magma' && (
                <g opacity="0.3">
                  {[0,1,2].map(i => (
                    <path key={i} d={`M${stage.x+25+i*50},${stage.y+8} Q${stage.x+38+i*50},${stage.y+2} ${stage.x+50+i*50},${stage.y+8}`} fill="none" stroke={stage.color} strokeWidth="1.5" />
                  ))}
                </g>
              )}

              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={stage.id === 'magma' ? '13' : '11'}
                fontWeight={isSelected ? '700' : '600'}
                fill={isSelected ? stage.color : isVisited ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)'}
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
            Click on each rock type or the magma zone to learn how rocks form and change over time.
          </p>
        )}
      </div>
    </div>
  )
}
