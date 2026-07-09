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
  colW: number
}

const STAGES: Stage[] = [
  {
    id: 'open-cast',
    label: 'Open-cast Mining',
    info: 'Surface rock and soil (overburden) is removed to expose the mineral deposit. Zimbabwe\'s Great Dyke platinum mines use this method. Large amounts of material must be moved.',
    color: '#f59e0b',
    x: 10,
    colW: 185,
  },
  {
    id: 'shaft',
    label: 'Shaft Mining',
    info: 'A vertical shaft is sunk into the earth, with horizontal tunnels (stopes) branching off at different depths. Gold mines in Bulawayo and Zvishavane use shaft mining to reach deep ore bodies.',
    color: '#6366f1',
    x: 205,
    colW: 190,
  },
  {
    id: 'alluvial',
    label: 'Alluvial Mining',
    info: 'Minerals washed downstream by rivers are extracted from riverbeds and sediment. Gold panning in Zimbabwe\'s rivers is a traditional form of alluvial mining still practised today.',
    color: '#06b6d4',
    x: 405,
    colW: 185,
  },
]

export function MiningWidget({ value, onChange, onSizeChange }: Props) {
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

  const cardH = 300
  const cardY = 20

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
      <svg
        viewBox="0 0 600 340"
        style={{ flex: 1, minHeight: 0, width: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {STAGES.map(stage => {
          const isSelected = sel === stage.id
          const isVisited = value.visitedStages.includes(stage.id)
          const cx = stage.x + stage.colW / 2

          return (
            <g key={stage.id} style={{ cursor: 'pointer' }} onClick={() => select(stage.id)}>
              {/* Card background */}
              <rect
                x={stage.x}
                y={cardY}
                width={stage.colW}
                height={cardH}
                rx={12}
                fill={isSelected ? `${stage.color}18` : isVisited ? `${stage.color}0a` : 'rgba(255,255,255,0.04)'}
                stroke={isSelected ? stage.color : isVisited ? `${stage.color}55` : 'rgba(255,255,255,0.12)'}
                strokeWidth={isSelected ? 2 : 1}
              />

              {/* Title */}
              <text
                x={cx}
                y={cardY + 22}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={isSelected ? stage.color : 'rgba(255,255,255,0.75)'}
                fontFamily="Inter,system-ui,sans-serif"
              >
                {stage.label}
              </text>

              {/* Illustration */}
              {stage.id === 'open-cast' && (
                <g>
                  {/* Terraced pit — nested trapezoids */}
                  <polygon points={`${cx-70},230 ${cx+70},230 ${cx+55},200 ${cx-55},200`} fill="#92400e" opacity="0.7" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  <polygon points={`${cx-55},200 ${cx+55},200 ${cx+38},170 ${cx-38},170`} fill="#b45309" opacity="0.7" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  <polygon points={`${cx-38},170 ${cx+38},170 ${cx+22},142 ${cx-22},142`} fill="#d97706" opacity="0.7" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  <polygon points={`${cx-22},142 ${cx+22},142 ${cx+10},118 ${cx-10},118`} fill="#f59e0b" opacity="0.7" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  {/* Excavator arm hint */}
                  <line x1={cx-60} y1={230} x2={cx-80} y2={250} stroke="#f59e0b" strokeWidth="2" opacity="0.5" />
                  <rect x={cx-90} y={248} width={18} height={10} rx={2} fill="#f59e0b" opacity="0.5" />
                  {/* Label */}
                  <text x={cx} y={270} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="Inter,system-ui,sans-serif">Open pit</text>
                </g>
              )}

              {stage.id === 'shaft' && (
                <g>
                  {/* Ground line */}
                  <line x1={stage.x + 15} y1={115} x2={stage.x + stage.colW - 15} y2={115} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  {/* Vertical shaft */}
                  <rect x={cx - 12} y={115} width={24} height={145} fill="#4338ca" opacity="0.6" stroke="#6366f1" strokeWidth="1" />
                  {/* Horizontal tunnels */}
                  {[150, 185, 220].map((ty, i) => (
                    <g key={i}>
                      <rect x={cx - 12 - 45 + (i % 2 === 0 ? 0 : 45 + 12)} y={ty} width={45} height={12} fill="#4338ca" opacity="0.5" stroke="#6366f1" strokeWidth="0.5" />
                      {/* Ore dots */}
                      <circle cx={cx - 12 - 22 + (i % 2 === 0 ? 0 : 45 + 12)} cy={ty + 6} r={3} fill="#fbbf24" opacity="0.7" />
                    </g>
                  ))}
                  {/* Headgear / winding tower */}
                  <polygon points={`${cx-8},115 ${cx+8},115 ${cx},90`} fill="#6366f1" opacity="0.7" />
                  <line x1={cx} y1={90} x2={cx} y2={80} stroke="#6366f1" strokeWidth="2" opacity="0.7" />
                  {/* Lift cage */}
                  <rect x={cx - 8} y={135} width={16} height={18} rx={2} fill="#818cf8" opacity="0.6" />
                  {/* Shaft depth label */}
                  <text x={cx} y={270} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="Inter,system-ui,sans-serif">Underground shaft</text>
                </g>
              )}

              {stage.id === 'alluvial' && (
                <g>
                  {/* River bed */}
                  <path d={`M${stage.x+15},215 Q${cx-30},190 ${cx},200 Q${cx+30},210 ${stage.x+stage.colW-15},195`} stroke="#06b6d4" strokeWidth="3" fill="none" opacity="0.7" />
                  <path d={`M${stage.x+15},230 Q${cx-30},215 ${cx},220 Q${cx+30},225 ${stage.x+stage.colW-15},215`} stroke="#0e7490" strokeWidth="2" fill="none" opacity="0.6" />
                  {/* Riverbank fill */}
                  <path d={`M${stage.x+15},265 L${stage.x+15},230 Q${cx},220 ${stage.x+stage.colW-15},215 L${stage.x+stage.colW-15},265 Z`} fill="#164e63" opacity="0.4" />
                  {/* Sediment / gold particles */}
                  {[
                    [cx-50, 240], [cx-30, 248], [cx-10, 242], [cx+10, 250],
                    [cx+30, 243], [cx+50, 246], [cx-40, 258], [cx+40, 255],
                  ].map(([px, py], i) => (
                    <circle key={i} cx={px} cy={py} r={i % 3 === 0 ? 5 : 3} fill={i % 3 === 0 ? '#fbbf24' : '#94a3b8'} opacity="0.8" />
                  ))}
                  {/* Pan */}
                  <ellipse cx={cx} cy={175} rx={28} ry={10} fill="none" stroke="#94a3b8" strokeWidth="2" opacity="0.6" />
                  <path d={`M${cx-28},175 Q${cx},190 ${cx+28},175`} fill="rgba(6,182,212,0.15)" stroke="#06b6d4" strokeWidth="1" />
                  <circle cx={cx} cy={184} r={5} fill="#fbbf24" opacity="0.8" />
                  {/* Label */}
                  <text x={cx} y={270} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="Inter,system-ui,sans-serif">River panning</text>
                </g>
              )}

              {/* Visited dot */}
              {isVisited && !isSelected && (
                <circle cx={stage.x + stage.colW - 14} cy={cardY + 14} r={5} fill={stage.color} opacity={0.75} />
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
            Click on each type of mining to learn how it works and where it is used in Zimbabwe.
          </p>
        )}
      </div>
    </div>
  )
}
