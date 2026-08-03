interface PlotConfig {
  functions: string[]
  xRange?: [number, number]
  yRange?: [number, number]
  title?: string
  labels?: string[]
}

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#38bdf8']

function evalFn(expr: string, x: number): number {
  const js = expr
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
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function('x', `"use strict"; return (${js})`)(x)
    return typeof result === 'number' ? result : NaN
  } catch {
    return NaN
  }
}

function sampleFn(expr: string, xMin: number, xMax: number, steps = 300): [number, number][] {
  const points: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin)
    const y = evalFn(expr, x)
    points.push([x, y])
  }
  return points
}

function toPolylines(
  points: [number, number][],
  xMin: number, xMax: number, yMin: number, yMax: number,
  w: number, h: number,
  pad: number,
): string[] {
  const innerW = w - pad * 2
  const innerH = h - pad * 2
  const toSvgX = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * innerW
  const toSvgY = (y: number) => pad + innerH - ((y - yMin) / (yMax - yMin)) * innerH

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
  const W = 540
  const H = 320
  const PAD = 50

  const xMin = config.xRange?.[0] ?? -5
  const xMax = config.xRange?.[1] ?? 5

  // Auto yRange: sample all functions to find bounds
  let allY: number[] = []
  const allPoints = config.functions.map(fn => {
    const pts = sampleFn(fn, xMin, xMax)
    allY = allY.concat(pts.map(([, y]) => y).filter(isFinite))
    return pts
  })

  let yMin = config.yRange?.[0] ?? (allY.length ? Math.min(...allY) : -5)
  let yMax = config.yRange?.[1] ?? (allY.length ? Math.max(...allY) : 5)

  // Pad y range by 10%
  const yPad = (yMax - yMin) * 0.1 || 1
  yMin = yMin - yPad
  yMax = yMax + yPad

  const toSvgX = (x: number) => PAD + ((x - xMin) / (xMax - xMin)) * (W - PAD * 2)
  const toSvgY = (y: number) => PAD + (H - PAD * 2) - ((y - yMin) / (yMax - yMin)) * (H - PAD * 2)

  // Grid lines
  const xTicks: number[] = []
  const yTicks: number[] = []
  const xStep = niceTick((xMax - xMin) / 5)
  const yStep = niceTick((yMax - yMin) / 5)
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) xTicks.push(parseFloat(x.toFixed(10)))
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) yTicks.push(parseFloat(y.toFixed(10)))

  // Axes positions (clamped to plot area)
  const axisX = toSvgX(Math.max(xMin, Math.min(xMax, 0)))
  const axisY = toSvgY(Math.max(yMin, Math.min(yMax, 0)))

  return (
    <div className="my-3 overflow-x-auto">
      {config.title && (
        <p className="text-xs text-slate-400 text-center mb-1 font-medium">{config.title}</p>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ maxWidth: W, display: 'block', margin: '0 auto' }}
        className="rounded-xl bg-white/5 border border-white/8"
      >
        {/* Grid */}
        {xTicks.map(x => (
          <line key={`gx${x}`} x1={toSvgX(x)} y1={PAD} x2={toSvgX(x)} y2={H - PAD}
            stroke="#ffffff18" strokeWidth="1" />
        ))}
        {yTicks.map(y => (
          <line key={`gy${y}`} x1={PAD} y1={toSvgY(y)} x2={W - PAD} y2={toSvgY(y)}
            stroke="#ffffff18" strokeWidth="1" />
        ))}

        {/* Axes */}
        <line x1={PAD} y1={axisY} x2={W - PAD} y2={axisY} stroke="#475569" strokeWidth="1.5" />
        <line x1={axisX} y1={PAD} x2={axisX} y2={H - PAD} stroke="#475569" strokeWidth="1.5" />

        {/* Tick labels */}
        {xTicks.map(x => x !== 0 && (
          <text key={`tx${x}`} x={toSvgX(x)} y={axisY + 14} textAnchor="middle"
            fontSize="10" fill="#64748b">{fmt(x)}</text>
        ))}
        {yTicks.map(y => y !== 0 && (
          <text key={`ty${y}`} x={axisX - 6} y={toSvgY(y) + 3} textAnchor="end"
            fontSize="10" fill="#64748b">{fmt(y)}</text>
        ))}

        {/* Axis labels */}
        <text x={W - PAD + 12} y={axisY + 4} fontSize="11" fill="#94a3b8" fontStyle="italic">x</text>
        <text x={axisX} y={PAD - 8} textAnchor="middle" fontSize="11" fill="#94a3b8" fontStyle="italic">y</text>

        {/* Clip area for curves */}
        <clipPath id="plot-clip">
          <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} />
        </clipPath>

        {/* Function curves */}
        {allPoints.map((pts, i) => {
          const color = COLORS[i % COLORS.length]
          const polylines = toPolylines(pts, xMin, xMax, yMin, yMax, W, H, PAD)
          return polylines.map((d, j) => (
            <path key={`fn${i}-${j}`} d={d} fill="none" stroke={color} strokeWidth="2.2"
              strokeLinejoin="round" strokeLinecap="round" clipPath="url(#plot-clip)" />
          ))
        })}
      </svg>

      {/* Legend */}
      {config.functions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {config.functions.map((fn, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="inline-block w-5 h-0.5 rounded" style={{ background: COLORS[i % COLORS.length] }} />
              {config.labels?.[i] ?? `y = ${fn}`}
            </span>
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
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(1)
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
