// Rich, animated visualization components for Compass chat
import { useState, useEffect } from 'react'

const PALETTE = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#38bdf8', '#fb923c', '#4ade80', '#e879f9']

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimelineEvent {
  year: string | number
  label: string
  detail?: string
}

interface DataPoint {
  label: string
  value: number
  color?: string
}

interface ProcessStep {
  step: string
  detail?: string
}

interface ComparisonRow {
  aspect: string
  a: string
  b: string
}

export interface VizConfig {
  type: 'timeline' | 'bar' | 'pie' | 'process' | 'comparison'
  title?: string
  events?: TimelineEvent[]
  data?: DataPoint[]
  steps?: (string | ProcessStep)[]
  labelA?: string
  labelB?: string
  rows?: ComparisonRow[]
  unit?: string
}

export function parseVizBlock(raw: string): VizConfig | null {
  try {
    const cfg = JSON.parse(raw.trim()) as VizConfig
    if (!cfg.type) return null
    return cfg
  } catch {
    return null
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export function VizBlock({ config }: { config: VizConfig }) {
  switch (config.type) {
    case 'timeline':   return <TimelineViz config={config} />
    case 'bar':        return <BarChartViz config={config} />
    case 'pie':        return <PieChartViz config={config} />
    case 'process':    return <ProcessViz config={config} />
    case 'comparison': return <ComparisonViz config={config} />
    default:           return null
  }
}

// ─── Shared wrapper ───────────────────────────────────────────────────────────

function VizWrapper({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="my-4">
      {title && (
        <p className="text-center text-xs font-semibold text-slate-300 mb-3 tracking-wide uppercase">
          {title}
        </p>
      )}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
        overflowX: 'auto',
      }}>
        {children}
      </div>
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineViz({ config }: { config: VizConfig }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t) }, [])

  const events = config.events ?? []
  if (events.length === 0) return null

  const W = 560, H = 200, padX = 40, midY = 108, n = events.length

  return (
    <VizWrapper title={config.title}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
        <defs>
          <linearGradient id="tl-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Main line */}
        <line x1={padX} y1={midY} x2={W - padX} y2={midY} stroke="url(#tl-line)" strokeWidth="2.5" />

        {events.map((ev, i) => {
          const x = n === 1 ? W / 2 : padX + (i / (n - 1)) * (W - padX * 2)
          const color = PALETTE[i % PALETTE.length]
          const above = i % 2 === 0
          const delay = `${i * 100}ms`

          return (
            <g key={i} style={{ opacity: visible ? 1 : 0, transition: `opacity 0.5s ${delay}` }}>
              {/* Connector */}
              <line
                x1={x} y1={above ? midY - 14 : midY + 14}
                x2={x} y2={above ? midY - 44 : midY + 44}
                stroke={color} strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.6"
              />
              {/* Glow ring */}
              <circle cx={x} cy={midY} r="11" fill={color} fillOpacity="0.12" />
              {/* Dot */}
              <circle
                cx={x} cy={midY} r="7" fill={color}
                style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
              />
              <circle cx={x} cy={midY} r="3" fill="white" fillOpacity="0.85" />

              {/* Year badge */}
              <rect
                x={x - 20} y={above ? midY - 37 : midY + 26}
                width="40" height="16" rx="8"
                fill={color} fillOpacity="0.18"
                stroke={color} strokeWidth="1" strokeOpacity="0.5"
              />
              <text x={x} y={above ? midY - 25 : midY + 38}
                textAnchor="middle" fontSize="9" fontWeight="700" fill={color}>
                {ev.year}
              </text>

              {/* Label */}
              <text x={x} y={above ? midY - 52 : midY + 60}
                textAnchor="middle" fontSize="9.5" fill="#cbd5e1">
                {ev.label.length > 14 ? ev.label.slice(0, 13) + '…' : ev.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Full labels if truncated or detail exists */}
      {events.some(e => e.label.length > 14 || e.detail) && (
        <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(n, 4)}, 1fr)` }}>
          {events.map((ev, i) => (
            <div key={i} className="text-center">
              <span className="text-xs font-semibold" style={{ color: PALETTE[i % PALETTE.length] }}>{ev.year}</span>
              <p className="text-xs text-slate-400 leading-tight">{ev.label}</p>
              {ev.detail && <p className="text-xs text-slate-500 leading-tight mt-0.5">{ev.detail}</p>}
            </div>
          ))}
        </div>
      )}
    </VizWrapper>
  )
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChartViz({ config }: { config: VizConfig }) {
  const [mounted, setMounted] = useState(false)
  const [hovered, setHovered] = useState<number | null>(null)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])

  const data = config.data ?? []
  if (data.length === 0) return null

  const max = Math.max(...data.map(d => d.value))
  const BAR_H = 34, GAP = 10, LABEL_W = 110, BAR_W = 300, VAL_W = 70
  const totalH = data.length * (BAR_H + GAP) + 10

  return (
    <VizWrapper title={config.title}>
      <svg
        viewBox={`0 0 ${LABEL_W + BAR_W + VAL_W + 20} ${totalH}`}
        width="100%"
        style={{ maxWidth: LABEL_W + BAR_W + VAL_W + 20, display: 'block', margin: '0 auto' }}
      >
        <defs>
          {data.map((_, i) => (
            <linearGradient key={i} id={`bg-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity="0.9" />
              <stop offset="100%" stopColor={PALETTE[(i + 2) % PALETTE.length]} stopOpacity="0.55" />
            </linearGradient>
          ))}
        </defs>

        {data.map((d, i) => {
          const y = i * (BAR_H + GAP) + 5
          const targetLen = max > 0 ? (d.value / max) * BAR_W : 0
          const barLen = mounted ? Math.max(targetLen, 4) : 0
          const color = d.color ?? PALETTE[i % PALETTE.length]
          const isHov = hovered === i

          return (
            <g
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'default' }}
            >
              {/* Label */}
              <text x={LABEL_W - 8} y={y + BAR_H / 2 + 4}
                textAnchor="end" fontSize="11" fill={isHov ? '#e2e8f0' : '#94a3b8'}
                style={{ transition: 'fill 0.2s' }}>
                {d.label.length > 13 ? d.label.slice(0, 12) + '…' : d.label}
              </text>

              {/* Track */}
              <rect x={LABEL_W} y={y} width={BAR_W} height={BAR_H} rx="6"
                fill="white" fillOpacity={isHov ? 0.07 : 0.04}
                style={{ transition: 'fill-opacity 0.2s' }} />

              {/* Bar */}
              <rect
                x={LABEL_W} y={y + (isHov ? 2 : 4)}
                width={barLen} height={isHov ? BAR_H - 4 : BAR_H - 8}
                rx={isHov ? 7 : 6}
                fill={`url(#bg-${i})`}
                style={{
                  transition: mounted
                    ? `width 0.7s cubic-bezier(0.4,0,0.2,1) ${i * 60}ms, height 0.2s, y 0.2s`
                    : 'none',
                  filter: isHov ? `drop-shadow(0 0 6px ${color}66)` : `drop-shadow(0 0 3px ${color}33)`,
                }}
              />

              {/* Value */}
              <text
                x={LABEL_W + BAR_W + 8} y={y + BAR_H / 2 + 4}
                fontSize="11" fontWeight="600" fill={color}>
                {d.value}{config.unit ?? ''}
              </text>

              {/* Hover tooltip */}
              {isHov && (
                <g>
                  <rect
                    x={LABEL_W + Math.max(targetLen / 2, 20) - 30}
                    y={y - 26} width="60" height="20" rx="6"
                    fill="#0f172a" stroke={color} strokeWidth="1" strokeOpacity="0.6"
                  />
                  <text
                    x={LABEL_W + Math.max(targetLen / 2, 20)}
                    y={y - 11} textAnchor="middle" fontSize="10" fill={color} fontWeight="600">
                    {d.value}{config.unit ?? ''}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </VizWrapper>
  )
}

// ─── Pie Chart ────────────────────────────────────────────────────────────────

function PieChartViz({ config }: { config: VizConfig }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])

  const data = config.data ?? []
  if (data.length === 0) return null

  const total = data.reduce((s, d) => s + d.value, 0)
  const CX = 120, CY = 115, R = 88, INNER_R = 40

  type Slice = {
    d: string; hoverD: string; color: string
    label: string; value: number; pct: number
  }
  const slices: Slice[] = []
  let angle = -Math.PI / 2

  data.forEach((pt, i) => {
    const pct = pt.value / total
    const sweep = pct * 2 * Math.PI
    const isHov = hovered === i
    const r = isHov ? R + 6 : R
    const ir = isHov ? INNER_R - 2 : INNER_R

    const makeArc = (outerR: number, innerR: number) => {
      const x1 = CX + outerR * Math.cos(angle)
      const y1 = CY + outerR * Math.sin(angle)
      const x2 = CX + outerR * Math.cos(angle + sweep)
      const y2 = CY + outerR * Math.sin(angle + sweep)
      const xi1 = CX + innerR * Math.cos(angle)
      const yi1 = CY + innerR * Math.sin(angle)
      const xi2 = CX + innerR * Math.cos(angle + sweep)
      const yi2 = CY + innerR * Math.sin(angle + sweep)
      const large = sweep > Math.PI ? 1 : 0
      return `M${xi1},${yi1} L${x1},${y1} A${outerR},${outerR} 0 ${large} 1 ${x2},${y2} L${xi2},${yi2} A${innerR},${innerR} 0 ${large} 0 ${xi1},${yi1} Z`
    }

    slices.push({
      d: makeArc(R, INNER_R),
      hoverD: makeArc(R + 6, INNER_R - 2),
      color: pt.color ?? PALETTE[i % PALETTE.length],
      label: pt.label,
      value: pt.value,
      pct: Math.round(pct * 100),
    })
    angle += sweep
  })

  const W = 390, H = 230

  return (
    <VizWrapper title={config.title}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
        <defs>
          <filter id="pie-glow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Slices */}
        {slices.map((s, i) => {
          const isHov = hovered === i
          return (
            <path
              key={i}
              d={isHov ? s.hoverD : s.d}
              fill={s.color}
              stroke="#0a0a14"
              strokeWidth="2"
              fillOpacity={mounted ? 1 : 0}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                cursor: 'pointer',
                filter: isHov ? `url(#pie-glow) drop-shadow(0 0 8px ${s.color}88)` : 'none',
                transition: 'fill-opacity 0.4s, filter 0.2s, d 0.2s',
              }}
            />
          )
        })}

        {/* Centre */}
        <text x={CX} y={CY - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#e2e8f0">
          {hovered !== null ? slices[hovered].pct + '%' : 'Total'}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="10" fill="#94a3b8">
          {hovered !== null ? slices[hovered].label : total + (config.unit ?? '')}
        </text>

        {/* Legend */}
        {slices.map((s, i) => {
          const lx = 258, ly = 18 + i * 27
          const isHov = hovered === i
          return (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>
              <rect x={lx} y={ly} width="13" height="13" rx="3"
                fill={s.color} fillOpacity={isHov ? 1 : 0.75}
                style={{ transition: 'fill-opacity 0.2s' }} />
              <text x={lx + 18} y={ly + 10} fontSize="11"
                fill={isHov ? '#e2e8f0' : '#cbd5e1'}
                style={{ transition: 'fill 0.2s' }}>
                {s.label.length > 16 ? s.label.slice(0, 15) + '…' : s.label}
              </text>
              <text x={W - 8} y={ly + 10} textAnchor="end"
                fontSize="11" fontWeight="600" fill={s.color}>
                {s.pct}%
              </text>
            </g>
          )
        })}
      </svg>
    </VizWrapper>
  )
}

// ─── Process Steps ────────────────────────────────────────────────────────────

function ProcessViz({ config }: { config: VizConfig }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  const rawSteps = config.steps ?? []
  if (rawSteps.length === 0) return null

  const steps: ProcessStep[] = rawSteps.map(s => typeof s === 'string' ? { step: s } : s)

  const PER_ROW = Math.min(steps.length, 4)
  const rows: ProcessStep[][] = []
  for (let i = 0; i < steps.length; i += PER_ROW) rows.push(steps.slice(i, i + PER_ROW))

  return (
    <VizWrapper title={config.title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            {row.map((step, si) => {
              const globalIdx = ri * PER_ROW + si
              const color = PALETTE[globalIdx % PALETTE.length]
              const isLast = si === row.length - 1 && ri === rows.length - 1
              const delay = `${globalIdx * 80}ms`

              return (
                <div key={si} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  {/* Step box */}
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                    borderRadius: '12px',
                    padding: '12px',
                    border: `1px solid ${color}44`,
                    background: `${color}10`,
                    textAlign: 'center',
                    position: 'relative',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(8px)',
                    transition: `opacity 0.4s ${delay}, transform 0.4s ${delay}`,
                  }}>
                    {/* Number badge */}
                    <div style={{
                      position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                      width: '20px', height: '20px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: color, color: 'white', fontSize: '10px', fontWeight: '700',
                    }}>
                      {globalIdx + 1}
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0', marginTop: '4px', lineHeight: 1.3 }}>
                      {step.step}
                    </p>
                    {step.detail && (
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>
                        {step.detail}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  {!isLast && si < row.length - 1 && (
                    <div style={{ flexShrink: 0, padding: '0 4px', color: '#334155', fontSize: '18px', fontWeight: '300' }}>
                      →
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </VizWrapper>
  )
}

// ─── Comparison Table ─────────────────────────────────────────────────────────

function ComparisonViz({ config }: { config: VizConfig }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const rows = config.rows ?? []
  if (rows.length === 0) return null

  const labelA = config.labelA ?? 'Option A'
  const labelB = config.labelB ?? 'Option B'

  return (
    <VizWrapper title={config.title}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 500, width: '25%' }}>
                Aspect
              </th>
              <th style={{ padding: '8px 12px', textAlign: 'center', color: PALETTE[0], fontWeight: 600, width: '37.5%' }}>
                {labelA}
              </th>
              <th style={{ padding: '8px 12px', textAlign: 'center', color: PALETTE[1], fontWeight: 600, width: '37.5%' }}>
                {labelB}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: hovered === i ? 'rgba(255,255,255,0.05)' : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  transition: 'background 0.2s',
                  cursor: 'default',
                }}
              >
                <td style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 500, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {row.aspect}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', color: `${PALETTE[0]}cc` }}>
                  {row.a}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', color: `${PALETTE[1]}cc` }}>
                  {row.b}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VizWrapper>
  )
}
