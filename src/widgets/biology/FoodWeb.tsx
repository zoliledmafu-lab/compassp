import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface Organism {
  id: string
  name: string
  level: 'producer' | 'primary' | 'secondary' | 'tertiary'
}

export interface Connection {
  from: string
  to: string
}

export interface FoodWebState extends Record<string, unknown> {
  organisms: Organism[]
  connections: Connection[]
}

export const defaultState: FoodWebState = {
  organisms: [
    { id: 'o1', name: 'Grass', level: 'producer' },
    { id: 'o2', name: 'Rabbit', level: 'primary' },
    { id: 'o3', name: 'Fox', level: 'secondary' },
  ],
  connections: [
    { from: 'o1', to: 'o2' },
    { from: 'o2', to: 'o3' },
  ],
}

const LEVEL_COLORS: Record<string, string> = {
  producer: '#16a34a',
  primary: '#d97706',
  secondary: '#ea580c',
  tertiary: '#dc2626',
}

const LEVEL_Y: Record<string, number> = {
  producer: 160,
  primary: 110,
  secondary: 60,
  tertiary: 20,
}

type TrophicLevel = 'producer' | 'primary' | 'secondary' | 'tertiary'
const LEVELS: TrophicLevel[] = ['producer', 'primary', 'secondary', 'tertiary']

export default function FoodWeb({ state, onChange, onCheck }: WidgetProps<FoodWebState>) {
  const { organisms, connections } = state
  const [pending, setPending] = useState<string | null>(null)
  const [addName, setAddName] = useState('')
  const [addLevel, setAddLevel] = useState<TrophicLevel>('primary')
  const [showAdd, setShowAdd] = useState(false)

  const W = 360, H = 200

  // Position organisms horizontally within their level
  function getPos(org: Organism): { x: number; y: number } {
    const levelOrgs = organisms.filter(o => o.level === org.level)
    const idx = levelOrgs.findIndex(o => o.id === org.id)
    const count = levelOrgs.length
    const x = (W / (count + 1)) * (idx + 1)
    const y = LEVEL_Y[org.level]
    return { x, y }
  }

  function handleCircleClick(orgId: string) {
    if (pending === null) {
      setPending(orgId)
    } else if (pending === orgId) {
      setPending(null)
    } else {
      // Add connection from pending to orgId (avoid duplicates)
      const exists = connections.some(c => c.from === pending && c.to === orgId)
      if (!exists) {
        onChange({ ...state, connections: [...connections, { from: pending, to: orgId }] })
      }
      setPending(null)
    }
  }

  function removeOrg(id: string) {
    onChange({
      ...state,
      organisms: organisms.filter(o => o.id !== id),
      connections: connections.filter(c => c.from !== id && c.to !== id),
    })
    if (pending === id) setPending(null)
  }

  function addOrganism() {
    if (!addName.trim() || organisms.length >= 8) return
    const id = 'o' + Date.now()
    onChange({ ...state, organisms: [...organisms, { id, name: addName.trim(), level: addLevel }] })
    setAddName('')
    setShowAdd(false)
  }

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      <div className="flex items-center justify-between">
        <span className="text-slate-300 font-semibold">Food Web Builder</span>
        <span className="text-slate-500" style={{ fontSize: 9 }}>Click two organisms to connect</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0d0d1f' }}>
        {/* Level labels */}
        {LEVELS.map(lv => (
          <text key={lv} x={6} y={LEVEL_Y[lv] + 4} fill={LEVEL_COLORS[lv]} fontSize="7" opacity="0.8">
            {lv.charAt(0).toUpperCase() + lv.slice(1)}
          </text>
        ))}

        {/* Connection arrows */}
        {connections.map((c, i) => {
          const from = organisms.find(o => o.id === c.from)
          const to = organisms.find(o => o.id === c.to)
          if (!from || !to) return null
          const fp = getPos(from)
          const tp = getPos(to)
          const dx = tp.x - fp.x, dy = tp.y - fp.y
          const len = Math.sqrt(dx * dx + dy * dy)
          if (len < 1) return null
          const ux = dx / len, uy = dy / len
          const r = 16
          return (
            <line key={i}
              x1={fp.x + ux * r} y1={fp.y + uy * r}
              x2={tp.x - ux * r} y2={tp.y - uy * r}
              stroke="#ffffff40" strokeWidth="1.5"
              markerEnd="url(#fw-arrow)" />
          )
        })}

        {/* Arrow marker */}
        <defs>
          <marker id="fw-arrow" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
            <polygon points="0,0 5,2.5 0,5" fill="#ffffff40" />
          </marker>
        </defs>

        {/* Organism circles */}
        {organisms.map(org => {
          const { x, y } = getPos(org)
          const color = LEVEL_COLORS[org.level]
          const isPending = pending === org.id
          return (
            <g key={org.id} style={{ cursor: 'pointer' }} onClick={() => handleCircleClick(org.id)}>
              <circle cx={x} cy={y} r={16}
                fill={color} opacity={isPending ? 0.9 : 0.3}
                stroke={color} strokeWidth={isPending ? 2.5 : 1.5} />
              <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="7" fontWeight="600">{org.name}</text>
              {/* Remove button */}
              <text x={x + 14} y={y - 10} textAnchor="middle" fill="#ffffff60" fontSize="9"
                style={{ cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); removeOrg(org.id) }}>×</text>
            </g>
          )
        })}

        {pending && (
          <text x={W / 2} y={H - 4} textAnchor="middle" fill="#f59e0b" fontSize="8">
            Now click another organism to connect
          </text>
        )}
      </svg>

      {/* Add organism */}
      {showAdd ? (
        <div className="flex gap-2 items-end">
          <input value={addName} onChange={e => setAddName(e.target.value)}
            placeholder="Name" maxLength={16}
            className="flex-1 bg-white/10 rounded px-2 py-1 text-white text-xs outline-none" />
          <select value={addLevel} onChange={e => setAddLevel(e.target.value as TrophicLevel)}
            className="bg-white/10 rounded px-2 py-1 text-white text-xs outline-none">
            {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </select>
          <button onClick={addOrganism} className="px-2 py-1 bg-indigo-600/70 rounded text-xs text-white">Add</button>
          <button onClick={() => setShowAdd(false)} className="px-2 py-1 bg-white/10 rounded text-xs text-slate-400">✕</button>
        </div>
      ) : (
        organisms.length < 8 && (
          <button onClick={() => setShowAdd(true)}
            className="w-full py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all">
            + Add Organism
          </button>
        )
      )}

      {/* Energy pyramid note */}
      <div className="bg-white/5 rounded-lg px-3 py-2 text-slate-400" style={{ fontSize: 10 }}>
        Energy pyramid: ~10% of energy transfers to the next trophic level. Producers capture solar energy; each level has fewer organisms.
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
