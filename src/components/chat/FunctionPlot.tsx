import { useState } from 'react'

interface PlotConfig {
  functions: string[]
  xRange?: [number, number]
  yRange?: [number, number]
  title?: string
  labels?: string[]
  // Optional interactive parameter sliders: {"a": 1, "b": 0, "c": -4}
  params?: Record<string, number>
}

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#38bdf8']

function evalFn(expr: string, x: number, params: Record<string, number> = {}): number {
  let js = expr
    .replace(/\^/g, '**')
    .replace(/\bsin\b/g, 'Math.sin')
    .replace(/\bcos\b/g, 'Math.cos')
    .replace(/\btan\b/g, 'Math.tan')
    .replace(/\bsqrt\b/g, 'Math.sqrt')
    .replace(/\babs\b/g, 'Math.abs')
    .replace(/\bln\b/g, 'Math.log')
    .replace(/\blog\b/g, '(v => Math.log(v)/Math.log(10))')
    .replace(/\bexp\b/g, 'Math.exp')
    .replace(/\bpi\b/gi, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
  // Inject parameter values
  for (const [k, v] of Object.entries(params)) {
    js = js.replace(new RegExp(`\\b${k}\\b`, 'g'), String(v))
  }
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function('x', `"use strict"; return (${js})`)(x)
    return typeof result === 'number' ? result : NaN
  } catch {
    return NaN
  }
}

function sampleFn(expr: string, xMin: number, xMax: number, params: Record<string, number>, steps = 300): [number, number][] {
  const points: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin)
    const y = evalFn(expr, x, params)
    points.push([x, y])
  }
  return points
}

function toPolylines(
  points: [number, number][],
  xMin: number, xMax: number, yMin: number, yMax: number,
  W: number, H: number, PAD_L: number, PAD_R: number, PAD_T: number, PAD_B: number,
): string[] {
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const toSvgX = (x: number) => PAD_L + ((x - xMin) / (xMax - xMin)) * plotW
  const toSvgY = (y: number) => PAD_T + plotH - ((y - yMin) / (yMax - yMin)) * plotH

  const paths: string[] = []
  let current: string[] = []
  for (const [x, y] of points) {
    if (!isFinite(y) || y < yMin - (yMax - yMin) || y > yMax + (yMax - yMin)) {
      if (current.length > 1) paths.push(current.join(' '))
      current = []
      continue
    }
    const sx = toSvgX(x)
    const sy = toSvgY(Math.max(yMin, Math.min(yMax, y)))
    current.push(`${current.length === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`)
  }
  if (current.length > 1) paths.push(current.join(' '))
  return paths
}

export function FunctionPlot({ config }: { config: PlotConfig }) {
  const [hoverSvgX, setHoverSvgX] = useState<number | null>(null)
  const [liveParams, setLiveParams] = useState<Record<string, number>>(config.params ?? {})

  const W = 540
  const H = 300
  const PAD_L = 52, PAD_R = 20, PAD_T = 20, PAD_B = 36
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B

  const xMin = config.xRange?.[0] ?? -5
  const xMax = config.xRange?.[1] ?? 5

  // Sample all functions with current params
  let allY: number[] = []
  const allPoints = config.functions.map(fn => {
    const pts = sampleFn(fn, xMin, xMax, liveParams)
    allY = allY.concat(pts.map(([, y]) => y).filter(isFinite))
    return pts
  })

  let yMin = config.yRange?.[0] ?? (allY.length ? Math.min(...allY) : -5)
  let yMax = config.yRange?.[1] ?? (allY.length ? Math.max(...allY) : 5)
  const yPad = (yMax - yMin) * 0.12 || 1
  yMin = yMin - yPad
  yMax = yMax + yPad

  const toSvgX = (x: number) => PAD_L + ((x - xMin) / (xMax - xMin)) * plotW
  const toSvgY = (y: number) => PAD_T + plotH - ((y - yMin) / (yMax - yMin)) * plotH
  const toMathX = (svgX: number) => xMin + ((svgX - PAD_L) / plotW) * (xMax - xMin)

  // Grid ticks
  const xTicks: number[] = []
  const yTicks: number[] = []
  const xStep = niceTick((xMax - xMin) / 5)
  const yStep = niceTick((yMax - yMin) / 5)
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep)
    xTicks.push(+x.toFixed(10))
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep)
    yTicks.push(+y.toFixed(10))

  const axisX = toSvgX(Math.max(xMin, Math.min(xMax, 0)))
  const axisY = toSvgY(Math.max(yMin, Math.min(yMax, 0)))

  // Hover state
  const hoverMathX = hoverSvgX !== null ? toMathX(hoverSvgX) : null
  const hoverYValues = hoverMathX !== null
    ? config.functions.map(fn => evalFn(fn, hoverMathX, liveParams))
    : []

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * W
    const clamped = Math.max(PAD_L, Math.min(W - PAD_R, svgX))
    setHoverSvgX(clamped)
  }

  // Tooltip: flip to left side when near right edge
  const tooltipLeft = hoverSvgX !== null && hoverSvgX > W * 0.65
  const tooltipLines = hoverYValues.filter(isFinite).length
  const tooltipH = 18 + tooltipLines * 15
  const tooltipW = 80

  return (
    <div className="my-3">
      {config.title && (
        <p className="text-xs text-slate-400 text-center mb-1 font-medium">{config.title}</p>
      )}

      <div
        className="rounded-xl border border-white/8 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ maxWidth: W, display: 'block', margin: '0 auto', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverSvgX(null)}
        >
          {/* Clip */}
          <clipPath id="fp-clip">
            <rect x={PAD_L} y={PAD_T} width={plotW} height={plotH} />
          </clipPath>

          {/* Grid */}
          {xTicks.map(x => (
            <line key={`gx${x}`} x1={toSvgX(x)} y1={PAD_T} x2={toSvgX(x)} y2={PAD_T + plotH}
              stroke="#ffffff12" strokeWidth="1" />
          ))}
          {yTicks.map(y => (
            <line key={`gy${y}`} x1={PAD_L} y1={toSvgY(y)} x2={PAD_L + plotW} y2={toSvgY(y)}
              stroke="#ffffff12" strokeWidth="1" />
          ))}

          {/* Axes */}
          <line x1={PAD_L} y1={axisY} x2={PAD_L + plotW} y2={axisY} stroke="#334155" strokeWidth="1.5" />
          <line x1={axisX} y1={PAD_T} x2={axisX} y2={PAD_T + plotH} stroke="#334155" strokeWidth="1.5" />

          {/* Tick labels */}
          {xTicks.map(x => x !== 0 && (
            <text key={`tx${x}`} x={toSvgX(x)} y={axisY + 14} textAnchor="middle" fontSize="9" fill="#475569">
              {fmt(x)}
            </text>
          ))}
          {yTicks.map(y => y !== 0 && (
            <text key={`ty${y}`} x={axisX - 5} y={toSvgY(y) + 3} textAnchor="end" fontSize="9" fill="#475569">
              {fmt(y)}
            </text>
          ))}

          {/* Axis labels */}
          <text x={PAD_L + plotW + 10} y={axisY + 4} fontSize="11" fill="#64748b" fontStyle="italic">x</text>
          <text x={axisX} y={PAD_T - 6} textAnchor="middle" fontSize="11" fill="#64748b" fontStyle="italic">y</text>

          {/* Function curves */}
          {allPoints.map((pts, i) => {
            const color = COLORS[i % COLORS.length]
            const polylines = toPolylines(pts, xMin, xMax, yMin, yMax, W, H, PAD_L, PAD_R, PAD_T, PAD_B)
            return polylines.map((d, j) => (
              <path key={`fn${i}-${j}`} d={d} fill="none" stroke={color} strokeWidth="2.2"
                strokeLinejoin="round" strokeLinecap="round" clipPath="url(#fp-clip)"
                style={{ filter: `drop-shadow(0 0 3px ${color}66)` }}
              />
            ))
          })}

          {/* ── Hover crosshair ── */}
          {hoverSvgX !== null && hoverMathX !== null && (
            <>
              {/* Vertical line */}
              <line
                x1={hoverSvgX} y1={PAD_T} x2={hoverSvgX} y2={PAD_T + plotH}
                stroke="#ffffff30" strokeWidth="1" strokeDasharray="5 4"
              />

              {/* Dots on each curve */}
              {config.functions.map((fn, i) => {
                const y = hoverYValues[i]
                if (!isFinite(y) || y < yMin || y > yMax) return null
                return (
                  <circle
                    key={i}
                    cx={hoverSvgX} cy={toSvgY(y)}
                    r="4.5" fill={COLORS[i % COLORS.length]}
                    stroke="#0f172a" strokeWidth="1.5"
                  />
                )
              })}

              {/* Tooltip */}
              {tooltipLines > 0 && (
                <g transform={`translate(${tooltipLeft ? hoverSvgX - tooltipW - 10 : hoverSvgX + 10}, ${PAD_T + 4})`}>
                  <rect x={0} y={0} width={tooltipW} height={tooltipH} rx="6"
                    fill="#0f172a" stroke="#334155" strokeWidth="1" fillOpacity="0.95" />
                  <text x="8" y="13" fontSize="10" fill="#94a3b8">x = {fmt(hoverMathX)}</text>
                  {config.functions.map((fn, i) => {
                    const y = hoverYValues[i]
                    if (!isFinite(y)) return null
                    return (
                      <text key={i} x="8" y={28 + i * 15} fontSize="10" fill={COLORS[i % COLORS.length]} fontWeight="500">
                        y = {fmt(y)}
                      </text>
                    )
                  })}
                </g>
              )}
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      {config.functions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {config.functions.map((fn, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="inline-block w-5 h-[2px] rounded" style={{ background: COLORS[i % COLORS.length] }} />
              {config.labels?.[i] ?? `y = ${fn}`}
            </span>
          ))}
        </div>
      )}

      {/* Parameter sliders (if AI provided params) */}
      {Object.keys(liveParams).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-4 justify-center px-4">
          {Object.entries(liveParams).map(([k, v]) => (
            <label key={k} className="flex flex-col items-center gap-1 min-w-[100px]">
              <span className="text-xs text-slate-400 font-medium">
                <em>{k}</em> = <span style={{ color: COLORS[Object.keys(liveParams).indexOf(k) % COLORS.length] }}>{fmt(v)}</span>
              </span>
              <input
                type="range" min="-5" max="5" step="0.1" value={v}
                onChange={e => setLiveParams(p => ({ ...p, [k]: parseFloat(e.target.value) }))}
                className="w-full accent-indigo-400 cursor-pointer"
                style={{ accentColor: COLORS[Object.keys(liveParams).indexOf(k) % COLORS.length] }}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function niceTick(rough: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(rough))))
  const norm = rough / mag
  const nice = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10
  return nice * mag
}

function fmt(n: number): string {
  if (!isFinite(n)) return '–'
  if (Number.isInteger(n)) return String(n)
  return parseFloat(n.toFixed(2)).toString()
}

export function parseFunctionPlot(raw: string): PlotConfig | null {
  try {
    const cfg = JSON.parse(raw.trim()) as PlotConfig
    if (!Array.isArray(cfg.functions) || cfg.functions.length === 0) return null
    return cfg
  } catch {
    return null
  }
}
