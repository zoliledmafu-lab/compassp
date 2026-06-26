import type { WidgetProps } from '../types'

export interface NutritionState extends Record<string, unknown> {
  mealName: string
  foods: Array<{ id: string; name: string; carbs: number; protein: number; fat: number; fibre: number; portion: string }>
  notes: string
}

const FOOD_PRESETS: Array<{ name: string; carbs: number; protein: number; fat: number; fibre: number }> = [
  { name: 'White rice (100g)', carbs: 28, protein: 2.7, fat: 0.3, fibre: 0.4 },
  { name: 'Chicken breast (100g)', carbs: 0, protein: 31, fat: 3.6, fibre: 0 },
  { name: 'Sadza (100g)', carbs: 23, protein: 2.1, fat: 0.5, fibre: 0.7 },
  { name: 'Beef (100g)', carbs: 0, protein: 26, fat: 15, fibre: 0 },
  { name: 'Beans (100g)', carbs: 22, protein: 9, fat: 0.5, fibre: 7 },
  { name: 'Egg (1 medium)', carbs: 0.4, protein: 6, fat: 5, fibre: 0 },
  { name: 'Milk (250ml)', carbs: 12, protein: 8.5, fat: 10, fibre: 0 },
  { name: 'Spinach (100g)', carbs: 3.6, protein: 2.9, fat: 0.4, fibre: 2.2 },
]

export const defaultState: NutritionState = {
  mealName: 'My Meal',
  foods: [
    { id: 'f1', name: 'White rice (100g)', carbs: 28, protein: 2.7, fat: 0.3, fibre: 0.4, portion: '1 cup' },
    { id: 'f2', name: 'Chicken breast (100g)', carbs: 0, protein: 31, fat: 3.6, fibre: 0, portion: '1 piece' },
  ],
  notes: '',
}

let fid = 20

function fmt(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(1) }

const MACRO_COLORS: Record<string, string> = { carbs: '#f59e0b', protein: '#818cf8', fat: '#f87171', fibre: '#34d399' }

export default function NutrientPlanner({ state, onChange, onCheck }: WidgetProps<NutritionState>) {
  const totals = state.foods.reduce(
    (acc, f) => ({ carbs: acc.carbs + f.carbs, protein: acc.protein + f.protein, fat: acc.fat + f.fat, fibre: acc.fibre + f.fibre }),
    { carbs: 0, protein: 0, fat: 0, fibre: 0 }
  )
  const totalCal = totals.carbs * 4 + totals.protein * 4 + totals.fat * 9

  const addPreset = (preset: typeof FOOD_PRESETS[0]) => {
    onChange({ ...state, foods: [...state.foods, { id: `f${fid++}`, ...preset, portion: '100g' }] })
  }

  const removeFood = (id: string) => onChange({ ...state, foods: state.foods.filter(f => f.id !== id) })

  const W = 360, H = 12
  const carbW = totalCal > 0 ? (totals.carbs * 4 / totalCal) * W : 0
  const protW = totalCal > 0 ? (totals.protein * 4 / totalCal) * W : 0
  const fatW = totalCal > 0 ? (totals.fat * 9 / totalCal) * W : 0

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      <input
        value={state.mealName}
        onChange={e => onChange({ ...state, mealName: e.target.value })}
        placeholder="Meal name"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none"
      />

      {/* Calorie bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-500">Macronutrient split</span>
          <span className="text-[10px] text-white font-semibold">{fmt(totalCal)} kcal</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-full overflow-hidden">
          <rect x={0} y={0} width={carbW} height={H} fill={MACRO_COLORS.carbs} />
          <rect x={carbW} y={0} width={protW} height={H} fill={MACRO_COLORS.protein} />
          <rect x={carbW + protW} y={0} width={fatW} height={H} fill={MACRO_COLORS.fat} />
        </svg>
        <div className="flex gap-3 mt-1">
          {[['Carbs', totals.carbs, 'carbs'], ['Protein', totals.protein, 'protein'], ['Fat', totals.fat, 'fat'], ['Fibre', totals.fibre, 'fibre']].map(([l, v, k]) => (
            <div key={k as string} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: MACRO_COLORS[k as string] }} />
              <span className="text-[10px] text-slate-400">{l}: {fmt(v as number)}g</span>
            </div>
          ))}
        </div>
      </div>

      {/* Food list */}
      <div className="space-y-1.5">
        {state.foods.map(f => (
          <div key={f.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/3 border border-white/8">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{f.name}</p>
              <p className="text-[10px] text-slate-500">{f.portion} · C:{fmt(f.carbs)}g P:{fmt(f.protein)}g F:{fmt(f.fat)}g</p>
            </div>
            <button onClick={() => removeFood(f.id)} className="text-slate-600 hover:text-red-400 shrink-0">×</button>
          </div>
        ))}
      </div>

      {/* Preset picker */}
      <div>
        <p className="text-[10px] text-slate-500 mb-1.5">Quick add:</p>
        <div className="flex flex-wrap gap-1">
          {FOOD_PRESETS.map(p => (
            <button key={p.name} onClick={() => addPreset(p)}
              className="px-2 py-0.5 rounded-lg text-[10px] border border-white/10 text-slate-400 hover:text-white hover:border-amber-500/30 hover:bg-amber-500/10 transition-all">
              {p.name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <textarea value={state.notes} onChange={e => onChange({ ...state, notes: e.target.value })} placeholder="Dietary notes, deficiencies, health implications…" rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white placeholder:text-slate-600 resize-none focus:outline-none" />

      {/* Nutrient summary */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {[
          { label: 'Carbs', value: fmt(totals.carbs) + 'g', color: 'amber' },
          { label: 'Protein', value: fmt(totals.protein) + 'g', color: 'indigo' },
          { label: 'Fat', value: fmt(totals.fat) + 'g', color: 'red' },
          { label: 'Fibre', value: fmt(totals.fibre) + 'g', color: 'green' },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-500/10 border border-${s.color}-500/20 rounded-lg px-1 py-1.5`}>
            <p className={`text-${s.color}-400/60`} style={{ fontSize: 9 }}>{s.label}</p>
            <p className={`text-${s.color}-300 font-semibold mt-0.5`} style={{ fontSize: 10 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-amber-700/70 hover:bg-amber-700 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
