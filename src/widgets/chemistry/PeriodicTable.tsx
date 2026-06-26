import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface PeriodicTableState extends Record<string, unknown> {
  selectedGroup: number | null
  searchElement: string
}

export const defaultState: PeriodicTableState = {
  selectedGroup: null,
  searchElement: '',
}

interface Element {
  number: number
  symbol: string
  name: string
  mass: number
  group: number
  period: number
  category: 'metal' | 'nonmetal' | 'noble' | 'metalloid'
  config: string
  uses: string
  col: number
  row: number
}

const ELEMENTS: Element[] = [
  { number:1,  symbol:'H',  name:'Hydrogen',   mass:1.008,  group:1,  period:1, category:'nonmetal',  config:'1s¹',        uses:'Fuel, water, acids',              col:1,  row:1 },
  { number:2,  symbol:'He', name:'Helium',     mass:4.003,  group:18, period:1, category:'noble',     config:'1s²',        uses:'Balloons, cooling',               col:18, row:1 },
  { number:3,  symbol:'Li', name:'Lithium',    mass:6.941,  group:1,  period:2, category:'metal',     config:'[He]2s¹',    uses:'Batteries, medicine',             col:1,  row:2 },
  { number:4,  symbol:'Be', name:'Beryllium',  mass:9.012,  group:2,  period:2, category:'metal',     config:'[He]2s²',    uses:'Alloys, aerospace',               col:2,  row:2 },
  { number:5,  symbol:'B',  name:'Boron',      mass:10.81,  group:13, period:2, category:'metalloid', config:'[He]2s²2p¹', uses:'Glass, semiconductors',           col:13, row:2 },
  { number:6,  symbol:'C',  name:'Carbon',     mass:12.01,  group:14, period:2, category:'nonmetal',  config:'[He]2s²2p²', uses:'Life, fuels, diamonds',           col:14, row:2 },
  { number:7,  symbol:'N',  name:'Nitrogen',   mass:14.01,  group:15, period:2, category:'nonmetal',  config:'[He]2s²2p³', uses:'Air (78%), fertilisers',          col:15, row:2 },
  { number:8,  symbol:'O',  name:'Oxygen',     mass:16.00,  group:16, period:2, category:'nonmetal',  config:'[He]2s²2p⁴', uses:'Breathing, combustion',           col:16, row:2 },
  { number:9,  symbol:'F',  name:'Fluorine',   mass:19.00,  group:17, period:2, category:'nonmetal',  config:'[He]2s²2p⁵', uses:'Toothpaste, Teflon',              col:17, row:2 },
  { number:10, symbol:'Ne', name:'Neon',       mass:20.18,  group:18, period:2, category:'noble',     config:'[He]2s²2p⁶', uses:'Signs, lasers',                   col:18, row:2 },
  { number:11, symbol:'Na', name:'Sodium',     mass:22.99,  group:1,  period:3, category:'metal',     config:'[Ne]3s¹',    uses:'Table salt, soaps',               col:1,  row:3 },
  { number:12, symbol:'Mg', name:'Magnesium',  mass:24.31,  group:2,  period:3, category:'metal',     config:'[Ne]3s²',    uses:'Alloys, chlorophyll',             col:2,  row:3 },
  { number:13, symbol:'Al', name:'Aluminium',  mass:26.98,  group:13, period:3, category:'metal',     config:'[Ne]3s²3p¹', uses:'Cans, aircraft, foil',            col:13, row:3 },
  { number:14, symbol:'Si', name:'Silicon',    mass:28.09,  group:14, period:3, category:'metalloid', config:'[Ne]3s²3p²', uses:'Chips, glass, solar cells',       col:14, row:3 },
  { number:15, symbol:'P',  name:'Phosphorus', mass:30.97,  group:15, period:3, category:'nonmetal',  config:'[Ne]3s²3p³', uses:'Fertilisers, DNA, matches',       col:15, row:3 },
  { number:16, symbol:'S',  name:'Sulfur',     mass:32.06,  group:16, period:3, category:'nonmetal',  config:'[Ne]3s²3p⁴', uses:'Vulcanisation, H₂SO₄',           col:16, row:3 },
  { number:17, symbol:'Cl', name:'Chlorine',   mass:35.45,  group:17, period:3, category:'nonmetal',  config:'[Ne]3s²3p⁵', uses:'Disinfectant, PVC',               col:17, row:3 },
  { number:18, symbol:'Ar', name:'Argon',      mass:39.95,  group:18, period:3, category:'noble',     config:'[Ne]3s²3p⁶', uses:'Welding, light bulbs',            col:18, row:3 },
  { number:19, symbol:'K',  name:'Potassium',  mass:39.10,  group:1,  period:4, category:'metal',     config:'[Ar]4s¹',    uses:'Fertilisers, nerve signals',      col:1,  row:4 },
  { number:20, symbol:'Ca', name:'Calcium',    mass:40.08,  group:2,  period:4, category:'metal',     config:'[Ar]4s²',    uses:'Bones, cement, limestone',        col:2,  row:4 },
]

const CATEGORY_COLORS: Record<string, string> = {
  metal: '#d97706',
  nonmetal: '#6366f1',
  noble: '#9333ea',
  metalloid: '#0d9488',
}

const CELL_W = 18
const CELL_H = 22
const GAP = 2

export default function PeriodicTableWidget({ state, onChange, onCheck }: WidgetProps<PeriodicTableState>) {
  const { searchElement } = state
  const [selected, setSelected] = useState<Element | null>(null)

  const query = searchElement.toLowerCase()
  const highlight = query.length > 0
    ? ELEMENTS.find(e => e.symbol.toLowerCase() === query || e.name.toLowerCase().startsWith(query))
    : null

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      <div className="flex items-center gap-2">
        <span className="text-slate-300 font-semibold">Periodic Table (1–20)</span>
        <input
          value={searchElement}
          onChange={e => onChange({ ...state, searchElement: e.target.value })}
          placeholder="Search symbol or name..."
          className="flex-1 bg-white/10 rounded px-2 py-1 text-white text-xs outline-none"
        />
      </div>

      {/* Mini periodic table grid */}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${(CELL_W + GAP) * 18 + 2} ${(CELL_H + GAP) * 4 + 2}`}
          className="w-full" style={{ minWidth: 340 }}>
          {ELEMENTS.map(el => {
            const x = (el.col - 1) * (CELL_W + GAP) + 1
            const y = (el.row - 1) * (CELL_H + GAP) + 1
            const color = CATEGORY_COLORS[el.category]
            const isHighlighted = highlight?.symbol === el.symbol
            const isSelected = selected?.symbol === el.symbol
            const opacity = highlight && !isHighlighted ? 0.3 : 1
            return (
              <g key={el.symbol} style={{ cursor: 'pointer' }} onClick={() => setSelected(isSelected ? null : el)}>
                <rect x={x} y={y} width={CELL_W} height={CELL_H} rx="2"
                  fill={color}
                  opacity={isSelected ? 1 : opacity * 0.25}
                  stroke={isSelected || isHighlighted ? color : 'transparent'}
                  strokeWidth="1.5" />
                <text x={x + CELL_W / 2} y={y + 7} textAnchor="middle" fill={color}
                  fontSize="4.5" opacity={opacity} fontWeight="600">{el.number}</text>
                <text x={x + CELL_W / 2} y={y + 14} textAnchor="middle" fill="white"
                  fontSize="7" opacity={opacity} fontWeight="700">{el.symbol}</text>
                <text x={x + CELL_W / 2} y={y + 20} textAnchor="middle" fill="white"
                  fontSize="3.5" opacity={opacity * 0.7}>{el.name.slice(0, 4)}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color, opacity: 0.8 }} />
            <span className="text-slate-400" style={{ fontSize: 9 }}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
          </div>
        ))}
      </div>

      {/* Detail card */}
      {selected && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1.5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg px-3 py-2 text-center" style={{ background: CATEGORY_COLORS[selected.category] + '40', minWidth: 48 }}>
              <p className="font-bold text-lg" style={{ color: CATEGORY_COLORS[selected.category] }}>{selected.symbol}</p>
              <p className="text-slate-400" style={{ fontSize: 8 }}>{selected.number}</p>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">{selected.name}</p>
              <p className="text-slate-400" style={{ fontSize: 10 }}>Atomic mass: {selected.mass} u</p>
              <p className="text-slate-400" style={{ fontSize: 10 }}>Group {selected.group} · Period {selected.period}</p>
              <p className="text-slate-400" style={{ fontSize: 10 }}>Config: {selected.config}</p>
            </div>
          </div>
          <p className="text-slate-400" style={{ fontSize: 10 }}>Uses: {selected.uses}</p>
        </div>
      )}

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
