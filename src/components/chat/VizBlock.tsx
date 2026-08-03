// Rich visualization components for Compass chat
// Handles: timeline, bar, pie, process, comparison

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

// ─── VizBlock router ──────────────────────────────────────────────────────────

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
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 overflow-x-auto">
        {children}
      </div>
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineViz({ config }: { config: VizConfig }) {
  const events = config.events ?? []
  if (events.length === 0) return null

  const W = 560
  const H = 200
  const padX = 40
  const midY = 110
  const n = events.length

  return (
    <VizWrapper title={config.title}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto', minWidth: Math.min(W, n * 80) }}>
        <defs>
          <linearGradient id="tl-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Main timeline line */}
        <line x1={padX} y1={midY} x2={W - padX} y2={midY} stroke="url(#tl-line)" strokeWidth="2.5" />

        {events.map((ev, i) => {
          const x = n === 1 ? W / 2 : padX + (i / (n - 1)) * (W - padX * 2)
          const color = PALETTE[i % PALETTE.length]
          const above = i % 2 === 0

          return (
            <g key={i}>
              {/* Connector */}
              <line
                x1={x} y1={above ? midY - 14 : midY + 14}
                x2={x} y2={above ? midY - 42 : midY + 42}
                stroke={color} strokeWidth="1.5" strokeDasharray="4 3"
              />
              {/* Outer glow ring */}
              <circle cx={x} cy={midY} r="11" fill={color} fillOpacity="0.15" />
              {/* Main dot */}
              <circle cx={x} cy={midY} r="7" fill={color} />
              <circle cx={x} cy={midY} r="3" fill="white" fillOpacity="0.8" />

              {/* Year badge */}
              <rect
                x={x - 20} y={above ? midY - 36 : midY + 26}
                width="40" height="16" rx="8"
                fill={color} fillOpacity="0.2"
                stroke={color} strokeWidth="1" strokeOpacity="0.5"
              />
              <text
                x={x} y={above ? midY - 24 : midY + 38}
                textAnchor="middle" fontSize="9" fontWeight="700" fill={color}
              >
                {ev.year}
              </text>

              {/* Label */}
              <text
                x={x} y={above ? midY - 50 : midY + 58}
                textAnchor="middle" fontSize="9.5" fill="#cbd5e1"
                style={{ maxWidth: '80px' }}
              >
                {ev.label.length > 14 ? ev.label.slice(0, 13) + '…' : ev.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Full labels below if truncated */}
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
  const data = config.data ?? []
  if (data.length === 0) return null

  const max = Math.max(...data.map(d => d.value))
  const BAR_H = 32
  const GAP = 12
  const LABEL_W = 110
  const BAR_W = 300
  const VAL_W = 60
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
            <linearGradient key={i} id={`bar-g-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity="0.9" />
              <stop offset="100%" stopColor={PALETTE[(i + 1) % PALETTE.length]} stopOpacity="0.6" />
            </linearGradient>
          ))}
        </defs>

        {data.map((d, i) => {
          const y = i * (BAR_H + GAP) + 5
          const barLen = max > 0 ? (d.value / max) * BAR_W : 0
          const color = d.color ?? PALETTE[i % PALETTE.length]

          return (
            <g key={i}>
              {/* Label */}
              <text x={LABEL_W - 8} y={y + BAR_H / 2 + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
                {d.label.length > 13 ? d.label.slice(0, 12) + '…' : d.label}
              </text>

              {/* Track */}
              <rect x={LABEL_W} y={y} width={BAR_W} height={BAR_H} rx="6" fill="white" fillOpacity="0.05" />

              {/* Bar */}
              <rect
                x={LABEL_W} y={y}
                width={Math.max(barLen, 4)} height={BAR_H}
                rx="6" fill={`url(#bar-g-${i})`}
                style={{ filter: `drop-shadow(0 0 4px ${color}44)` }}
              />

              {/* Value */}
              <text x={LABEL_W + BAR_W + 8} y={y + BAR_H / 2 + 4} fontSize="11" fontWeight="600" fill={color}>
                {d.value}{config.unit ?? ''}
              </text>
            </g>
          )
        })}
      </svg>
    </VizWrapper>
  )
}

// ─── Pie Chart ────────────────────────────────────────────────────────────────

function PieChartViz({ config }: { config: VizConfig }) {
  const data = config.data ?? []
  if (data.length === 0) return null

  const total = data.reduce((s, d) => s + d.value, 0)
  const CX = 120, CY = 110, R = 90, INNER_R = 42

  // Build pie slices
  type Slice = { d: string; color: string; label: string; value: number; pct: number; midAngle: number }
  const slices: Slice[] = []
  let angle = -Math.PI / 2

  data.forEach((pt, i) => {
    const pct = pt.value / total
    const sweep = pct * 2 * Math.PI
    const midAngle = angle + sweep / 2
    const x1 = CX + R * Math.cos(angle)
    const y1 = CY + R * Math.sin(angle)
    const x2 = CX + R * Math.cos(angle + sweep)
    const y2 = CY + R * Math.sin(angle + sweep)
    const xi1 = CX + INNER_R * Math.cos(angle)
    const yi1 = CY + INNER_R * Math.sin(angle)
    const xi2 = CX + INNER_R * Math.cos(angle + sweep)
    const yi2 = CY + INNER_R * Math.sin(angle + sweep)
    const large = sweep > Math.PI ? 1 : 0

    slices.push({
      d: `M${xi1},${yi1} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${xi2},${yi2} A${INNER_R},${INNER_R} 0 ${large} 0 ${xi1},${yi1} Z`,
      color: pt.color ?? PALETTE[i % PALETTE.length],
      label: pt.label,
      value: pt.value,
      pct: Math.round(pct * 100),
      midAngle,
    })
    angle += sweep
  })

  const W = 380, H = 220

  return (
    <VizWrapper title={config.title}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
        <defs>
          <filter id="pie-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Slices */}
        {slices.map((s, i) => (
          <path
            key={i}
            d={s.d}
            fill={s.color}
            stroke="#0a0a14"
            strokeWidth="2"
            style={{ filter: 'url(#pie-shadow)' }}
          />
        ))}

        {/* Centre label */}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="#e2e8f0">Total</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize="11" fill="#94a3b8">{total}{config.unit ?? ''}</text>

        {/* Legend */}
        {slices.map((s, i) => {
          const lx = 260
          const ly = 30 + i * 26
          return (
            <g key={i}>
              <rect x={lx} y={ly} width="14" height="14" rx="3" fill={s.color} />
              <text x={lx + 20} y={ly + 11} fontSize="11" fill="#cbd5e1">
                {s.label.length > 16 ? s.label.slice(0, 15) + '…' : s.label}
              </text>
              <text x={W - 8} y={ly + 11} textAnchor="end" fontSize="11" fontWeight="600" fill={s.color}>
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
  const rawSteps = config.steps ?? []
  if (rawSteps.length === 0) return null

  const steps: ProcessStep[] = rawSteps.map(s =>
    typeof s === 'string' ? { step: s } : s
  )

  const PER_ROW = Math.min(steps.length, 4)
  const rows: ProcessStep[][] = []
  for (let i = 0; i < steps.length; i += PER_ROW) rows.push(steps.slice(i, i + PER_ROW))

  return (
    <VizWrapper title={config.title}>
      <div className="flex flex-col gap-3">
        {rows.map((row, ri) => (
          <div key={ri} className="flex items-stretch gap-0">
            {row.map((step, si) => {
              const globalIdx = ri * PER_ROW + si
              const color = PALETTE[globalIdx % PALETTE.length]
              const isLast = si === row.length - 1 && ri === rows.length - 1

              return (
                <div key={si} className="flex items-center flex-1 min-w-0">
                  {/* Step box */}
                  <div
                    className="flex-1 min-w-0 rounded-xl p-3 border text-center relative"
                    style={{
                      borderColor: color + '44',
                      background: color + '12',
                      boxShadow: `inset 0 1px 0 ${color}22`,
                    }}
                  >
                    {/* Number badge */}
                    <div
                      className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: color, color: 'white', fontSize: '10px' }}
                    >
                      {globalIdx + 1}
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mt-1 leading-tight">{step.step}</p>
                    {step.detail && (
                      <p className="text-xs text-slate-500 mt-1 leading-tight">{step.detail}</p>
                    )}
                  </div>

                  {/* Arrow */}
                  {!isLast && si < row.length - 1 && (
                    <div className="shrink-0 px-1 text-slate-600 text-lg font-light">→</div>
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
  const rows = config.rows ?? []
  if (rows.length === 0) return null

  const labelA = config.labelA ?? 'Option A'
  const labelB = config.labelB ?? 'Option B'

  return (
    <VizWrapper title={config.title}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left text-slate-500 font-medium w-1/4">Aspect</th>
              <th
                className="py-2 px-3 text-center font-semibold w-[37.5%]"
                style={{ color: PALETTE[0] }}
              >
                {labelA}
              </th>
              <th
                className="py-2 px-3 text-center font-semibold w-[37.5%]"
                style={{ color: PALETTE[1] }}
              >
                {labelB}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                <td className="py-2 px-3 text-slate-400 font-medium border-t border-white/5">
                  {row.aspect}
                </td>
                <td
                  className="py-2 px-3 text-center border-t border-white/5"
                  style={{ color: PALETTE[0] + 'cc' }}
                >
                  {row.a}
                </td>
                <td
                  className="py-2 px-3 text-center border-t border-white/5"
                  style={{ color: PALETTE[1] + 'cc' }}
                >
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
