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
  hx: number
  hy: number
  hw: number
  hh: number
}

const STAGES: Stage[] = [
  {
    id: 'evaporation',
    label: 'Evaporation',
    info: 'The sun heats water in lakes, rivers and the ocean. Water molecules gain energy and escape as water vapour into the atmosphere.',
    color: '#f97316',
    hx: 20, hy: 195, hw: 120, hh: 75,
  },
  {
    id: 'condensation',
    label: 'Condensation',
    info: 'As water vapour rises, it cools down. The cooled vapour condenses around tiny dust particles, forming water droplets that make clouds.',
    color: '#94a3b8',
    hx: 210, hy: 30, hw: 160, hh: 80,
  },
  {
    id: 'precipitation',
    label: 'Precipitation',
    info: 'When water droplets in clouds combine and become heavy enough, they fall as rain, hail or snow — this is precipitation.',
    color: '#3b82f6',
    hx: 220, hy: 115, hw: 140, hh: 120,
  },
  {
    id: 'runoff',
    label: 'Surface Runoff',
    info: 'Rain water flows over the surface of the land back into rivers, lakes and eventually the ocean, completing the water cycle.',
    color: '#22c55e',
    hx: 20, hy: 270, hw: 560, hh: 40,
  },
]

export function WaterCycleWidget({ value, onChange, onSizeChange }: Props) {
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
          <linearGradient id="wc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0f2238" />
          </linearGradient>
          <linearGradient id="wc-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.9" />
          </linearGradient>
          <marker id="wc-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.45)" />
          </marker>
        </defs>

        {/* Sky background */}
        <rect x="0" y="0" width="600" height="340" fill="url(#wc-sky)" rx="8" />

        {/* Water / lake at bottom */}
        <rect x="0" y="265" width="600" height="75" fill="url(#wc-water)" />
        <text x="90" y="300" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.5)" fontFamily="Inter,system-ui,sans-serif">Ocean / Lake</text>

        {/* Mountain on right */}
        <polygon points="420,265 530,130 600,265" fill="#2d6a2d" opacity="0.7" />
        <polygon points="530,130 565,180 495,180" fill="white" opacity="0.3" />

        {/* Sun */}
        <circle cx="545" cy="55" r="38" fill="#fbbf24" opacity="0.85" />
        <circle cx="545" cy="55" r="30" fill="#fde68a" opacity="0.7" />
        {[0,45,90,135,180,225,270,315].map((deg, i) => {
          const rad = deg * Math.PI / 180
          const x1 = 545 + 42 * Math.cos(rad)
          const y1 = 55 + 42 * Math.sin(rad)
          const x2 = 545 + 52 * Math.cos(rad)
          const y2 = 55 + 52 * Math.sin(rad)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
        })}

        {/* Cloud (condensation zone) */}
        <ellipse cx="280" cy="78" rx="60" ry="28" fill="rgba(255,255,255,0.18)" />
        <ellipse cx="248" cy="85" rx="42" ry="24" fill="rgba(255,255,255,0.18)" />
        <ellipse cx="315" cy="85" rx="42" ry="24" fill="rgba(255,255,255,0.18)" />
        <ellipse cx="280" cy="92" rx="65" ry="22" fill="rgba(255,255,255,0.18)" />

        {/* Evaporation arrows */}
        <g opacity="0.7">
          <line x1="60" y1="255" x2="55" y2="210" stroke="#f97316" strokeWidth="2" markerEnd="url(#wc-arrow)" strokeDasharray="5 3" />
          <line x1="90" y1="258" x2="88" y2="210" stroke="#f97316" strokeWidth="2" markerEnd="url(#wc-arrow)" strokeDasharray="5 3" />
          <line x1="120" y1="255" x2="122" y2="210" stroke="#f97316" strokeWidth="2" markerEnd="url(#wc-arrow)" strokeDasharray="5 3" />
        </g>

        {/* Condensation arrow toward cloud */}
        <path d="M130,200 Q160,140 230,110" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#wc-arrow)" opacity="0.7" />

        {/* Precipitation rain drops */}
        {[240,255,270,285,300,315,330].map((x, i) => {
          const yStart = 115 + (i % 3) * 12
          return (
            <g key={i} opacity="0.8">
              <line x1={x} y1={yStart} x2={x - 4} y2={yStart + 22} stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#wc-arrow)" />
            </g>
          )
        })}

        {/* Runoff arrow */}
        <path d="M420,268 Q300,270 160,268" stroke="#22c55e" strokeWidth="2.5" fill="none" markerEnd="url(#wc-arrow)" opacity="0.8" />

        {/* Clickable hotspot overlays */}
        {STAGES.map(stage => {
          const isSelected = sel === stage.id
          const isVisited = value.visitedStages.includes(stage.id)
          return (
            <g key={stage.id} style={{ cursor: 'pointer' }} onClick={() => select(stage.id)}>
              <rect
                x={stage.hx}
                y={stage.hy}
                width={stage.hw}
                height={stage.hh}
                rx={8}
                fill={isSelected ? `${stage.color}20` : 'transparent'}
                stroke={isSelected ? stage.color : isVisited ? `${stage.color}55` : `${stage.color}30`}
                strokeWidth={isSelected ? 2 : 1}
                strokeDasharray={isSelected ? 'none' : '5 3'}
              />
              <text
                x={stage.hx + stage.hw / 2}
                y={stage.hy + stage.hh / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fontWeight={isSelected ? '700' : '600'}
                fill={isSelected ? stage.color : `${stage.color}cc`}
                fontFamily="Inter,system-ui,sans-serif"
              >
                {stage.label}
              </text>
              {isVisited && !isSelected && (
                <circle cx={stage.hx + stage.hw - 10} cy={stage.hy + 10} r={4} fill={stage.color} opacity={0.7} />
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
            Click on each stage of the water cycle to learn what happens at that step.
          </p>
        )}
      </div>
    </div>
  )
}
