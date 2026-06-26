import type { WidgetProps } from '../types'

export interface QuadraticState extends Record<string, unknown> {
  a: number
  b: number
  c: number
}

export const defaultState: QuadraticState = { a: 1, b: 0, c: 0 }

function fmt(n: number) { return Number.isInteger(n) ? String(n) : n.toFixed(2) }
function roots(a: number, b: number, c: number) {
  const d = b * b - 4 * a * c
  if (d < 0) return null
  if (d === 0) return [-b / (2 * a)]
  return [(-b + Math.sqrt(d)) / (2 * a), (-b - Math.sqrt(d)) / (2 * a)]
}
function vertex(a: number, b: number, c: number) {
  const x = -b / (2 * a)
  return { x, y: a * x * x + b * x + c }
}
function f(a: number, b: number, c: number, x: number) { return a * x * x + b * x + c }

export default function QuadraticGraph({ state, onChange, onCheck }: WidgetProps<QuadraticState>) {
  const { a, b, c } = state

  // Build SVG path
  const W = 360, H = 200
  const xRange = 6   // show x from -6 to 6
  const toSvgX = (x: number) => W / 2 + (x / xRange) * (W / 2 - 20)
  const vy = vertex(a, b, c).y
  const yRange = Math.max(Math.abs(vy) * 1.4, 10)
  const toSvgY = (y: number) => H / 2 - (y / yRange) * (H / 2 - 20)

  const steps = 120
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const x = -xRange + (2 * xRange * i) / steps
    return `${toSvgX(x)},${toSvgY(f(a, b, c, x))}`
  }).join(' ')

  const v = vertex(a, b, c)
  const rs = roots(a, b, c)
  const disc = b * b - 4 * a * c

  // Equation string
  const eqTerms: string[] = []
  if (a !== 0) eqTerms.push(`${a === 1 ? '' : a === -1 ? '-' : a}x²`)
  if (b !== 0) eqTerms.push(`${b > 0 ? '+' : ''}${b === 1 ? '' : b === -1 ? '-' : b}x`)
  if (c !== 0) eqTerms.push(`${c > 0 ? '+' : ''}${c}`)
  const eq = `y = ${eqTerms.join('') || '0'}`

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      {/* SVG Graph */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0d0d1f' }}>
        {/* Grid */}
        {[-4, -2, 0, 2, 4].map(x => (
          <line key={x} x1={toSvgX(x)} y1={20} x2={toSvgX(x)} y2={H - 20} stroke="#ffffff08" strokeWidth="1" />
        ))}
        {[-4, -2, 0, 2, 4].map(y => {
          const sy = toSvgY(y * yRange / 5)
          return <line key={y} x1={20} y1={sy} x2={W - 20} y2={sy} stroke="#ffffff08" strokeWidth="1" />
        })}
        {/* Axes */}
        <line x1={20} y1={toSvgY(0)} x2={W - 20} y2={toSvgY(0)} stroke="#ffffff30" strokeWidth="1.5" />
        <line x1={toSvgX(0)} y1={20} x2={toSvgX(0)} y2={H - 20} stroke="#ffffff30" strokeWidth="1.5" />
        {/* X labels */}
        {[-4, -2, 2, 4].map(x => <text key={x} x={toSvgX(x)} y={toSvgY(0) + 12} textAnchor="middle" fill="#ffffff40" fontSize="8">{x}</text>)}
        {/* Curve */}
        <polyline points={pts} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Vertex */}
        <circle cx={toSvgX(v.x)} cy={toSvgY(v.y)} r="4" fill="#f59e0b" />
        <text x={toSvgX(v.x) + 6} y={toSvgY(v.y) - 4} fill="#f59e0b" fontSize="8">
          V({fmt(v.x)}, {fmt(v.y)})
        </text>
        {/* Roots */}
        {rs?.map((r, i) => (
          <g key={i}>
            <circle cx={toSvgX(r)} cy={toSvgY(0)} r="4" fill="#34d399" />
            <text x={toSvgX(r)} y={toSvgY(0) + 16} textAnchor="middle" fill="#34d399" fontSize="8">
              ({fmt(r)}, 0)
            </text>
          </g>
        ))}
        {/* Equation label */}
        <text x={W - 22} y={24} textAnchor="end" fill="#818cf8" fontSize="9" fontWeight="600">{eq}</text>
      </svg>

      {/* Sliders */}
      <div className="space-y-2">
        {([['a', 'a (opens ' + (a >= 0 ? '↑' : '↓') + ')'], ['b', 'b (shift)'], ['c', 'c (y-intercept)']] as const).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-28 text-slate-400 shrink-0">{label}</span>
            <input
              type="range" min={-5} max={5} step={0.5}
              value={state[key] as number}
              onChange={e => onChange({ ...state, [key]: parseFloat(e.target.value) })}
              className="flex-1 accent-indigo-500"
            />
            <span className="w-8 text-right text-slate-300 font-mono">{fmt(state[key] as number)}</span>
          </div>
        ))}
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1.5 text-center">
          <p className="text-xs text-amber-400/60" style={{ fontSize: 9 }}>Vertex</p>
          <p className="text-amber-400 font-mono font-semibold mt-0.5" style={{ fontSize: 10 }}>({fmt(v.x)}, {fmt(v.y)})</p>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-2 py-1.5 text-center">
          <p className="text-xs text-indigo-400/60" style={{ fontSize: 9 }}>Discriminant</p>
          <p className="text-indigo-400 font-mono font-semibold mt-0.5" style={{ fontSize: 10 }}>{fmt(disc)}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-1.5 text-center">
          <p className="text-xs text-green-400/60" style={{ fontSize: 9 }}>Roots</p>
          <p className="text-green-400 font-mono font-semibold mt-0.5" style={{ fontSize: 10 }}>
            {disc < 0 ? 'None' : disc === 0 ? `x=${fmt(v.x)}` : '2 real'}
          </p>
        </div>
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
