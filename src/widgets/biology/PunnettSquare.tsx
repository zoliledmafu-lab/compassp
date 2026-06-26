import type { WidgetProps } from '../types'

export interface PunnettState extends Record<string, unknown> {
  parent1: string
  parent2: string
  trait: string
}

export const defaultState: PunnettState = {
  parent1: 'Tt',
  parent2: 'Tt',
  trait: 'Tallness',
}

function parseAlleles(genotype: string): [string, string] | null {
  const clean = genotype.trim()
  if (clean.length !== 2) return null
  return [clean[0], clean[1]]
}

function isDominant(allele: string) { return allele === allele.toUpperCase() }

function genoColor(a1: string, a2: string): string {
  if (isDominant(a1) && isDominant(a2)) return '#16a34a'  // green - dominant hom
  if (!isDominant(a1) && !isDominant(a2)) return '#dc2626'  // red - recessive
  return '#d97706'  // amber - hetero
}

export default function PunnettSquare({ state, onChange, onCheck }: WidgetProps<PunnettState>) {
  const { parent1, parent2, trait } = state

  const p1 = parseAlleles(parent1)
  const p2 = parseAlleles(parent2)
  const valid = p1 !== null && p2 !== null

  const offspring = valid ? [
    [p1[0] + p2[0], p1[0] + p2[1]],
    [p1[1] + p2[0], p1[1] + p2[1]],
  ] : null

  // Sort genotype so dominant comes first
  function sortGeno(g: string) {
    const [a, b] = [g[0], g[1]]
    if (!isDominant(a) && isDominant(b)) return b + a
    return g
  }

  const genoList = offspring ? offspring.flat().map(sortGeno) : []

  // Count genotypes
  const genoCounts: Record<string, number> = {}
  genoList.forEach(g => { genoCounts[g] = (genoCounts[g] || 0) + 1 })

  // Phenotype counts
  const dominantCount = genoList.filter(g => isDominant(g[0])).length
  const recessiveCount = genoList.filter(g => !isDominant(g[0])).length

  const cellSize = 60
  const padL = 40, padT = 40

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      {/* Trait input */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 shrink-0">Trait</span>
        <input value={trait} onChange={e => onChange({ ...state, trait: e.target.value })}
          className="flex-1 bg-white/10 rounded px-2 py-1 text-white text-xs outline-none" maxLength={30} />
      </div>

      {/* Parent inputs */}
      <div className="grid grid-cols-2 gap-2">
        {(['parent1', 'parent2'] as const).map((key, i) => (
          <div key={key}>
            <p className="text-slate-500 mb-1" style={{ fontSize: 10 }}>Parent {i + 1}</p>
            <input
              value={state[key] as string}
              onChange={e => {
                const val = e.target.value.slice(0, 2)
                onChange({ ...state, [key]: val })
              }}
              className={`w-full bg-white/10 rounded px-2 py-1.5 text-white text-sm font-mono text-center outline-none border ${
                parseAlleles(state[key] as string) ? 'border-white/10' : 'border-red-500/60'
              }`}
              maxLength={2}
              placeholder="Tt"
            />
          </div>
        ))}
      </div>

      {/* Punnett grid */}
      {valid && offspring ? (
        <svg viewBox={`0 0 ${padL + cellSize * 2 + 8} ${padT + cellSize * 2 + 8}`}
          className="w-full rounded-lg" style={{ background: '#0d0d1f', maxHeight: 180 }}>
          {/* Parent alleles top */}
          <text x={padL + cellSize * 0.5} y={20} textAnchor="middle" fill="#a78bfa" fontSize="14" fontWeight="700">{p1[0]}</text>
          <text x={padL + cellSize * 1.5} y={20} textAnchor="middle" fill="#a78bfa" fontSize="14" fontWeight="700">{p1[1]}</text>

          {/* Parent alleles left */}
          <text x={16} y={padT + cellSize * 0.5 + 5} textAnchor="middle" fill="#34d399" fontSize="14" fontWeight="700">{p2[0]}</text>
          <text x={16} y={padT + cellSize * 1.5 + 5} textAnchor="middle" fill="#34d399" fontSize="14" fontWeight="700">{p2[1]}</text>

          {/* Grid lines */}
          <line x1={padL} y1={padT} x2={padL + cellSize * 2} y2={padT} stroke="#ffffff30" strokeWidth="1.5" />
          <line x1={padL} y1={padT + cellSize} x2={padL + cellSize * 2} y2={padT + cellSize} stroke="#ffffff20" strokeWidth="1" />
          <line x1={padL} y1={padT + cellSize * 2} x2={padL + cellSize * 2} y2={padT + cellSize * 2} stroke="#ffffff30" strokeWidth="1.5" />
          <line x1={padL} y1={padT} x2={padL} y2={padT + cellSize * 2} stroke="#ffffff30" strokeWidth="1.5" />
          <line x1={padL + cellSize} y1={padT} x2={padL + cellSize} y2={padT + cellSize * 2} stroke="#ffffff20" strokeWidth="1" />
          <line x1={padL + cellSize * 2} y1={padT} x2={padL + cellSize * 2} y2={padT + cellSize * 2} stroke="#ffffff30" strokeWidth="1.5" />

          {/* Offspring cells */}
          {offspring.map((row, ri) =>
            row.map((geno, ci) => {
              const sorted = sortGeno(geno)
              const color = genoColor(sorted[0], sorted[1])
              const cx = padL + ci * cellSize + cellSize / 2
              const cy = padT + ri * cellSize + cellSize / 2
              return (
                <g key={`${ri}-${ci}`}>
                  <rect x={padL + ci * cellSize + 2} y={padT + ri * cellSize + 2}
                    width={cellSize - 4} height={cellSize - 4} rx="4" fill={color} opacity="0.15" />
                  <text x={cx} y={cy + 6} textAnchor="middle" fill={color} fontSize="16" fontWeight="700">{sorted}</text>
                </g>
              )
            })
          )}
        </svg>
      ) : (
        <div className="bg-white/5 rounded-lg p-4 text-center text-slate-500">
          Enter valid 2-character genotypes (e.g. Tt, TT, tt)
        </div>
      )}

      {/* Genotype counts */}
      {valid && (
        <div className="space-y-1">
          <p className="text-slate-400" style={{ fontSize: 10 }}>Genotype ratios:</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(genoCounts).map(([g, n]) => (
              <span key={g} className="px-2 py-0.5 rounded font-mono text-xs"
                style={{ background: genoColor(g[0], g[1]) + '30', color: genoColor(g[0], g[1]) }}>
                {g}: {n}
              </span>
            ))}
          </div>
          <p className="text-slate-400 mt-1" style={{ fontSize: 10 }}>
            Phenotype ratio: {trait} — <span className="text-green-400">{dominantCount} dominant</span> : <span className="text-red-400">{recessiveCount} recessive</span>
          </p>
        </div>
      )}

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
