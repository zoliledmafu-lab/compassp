import type { WidgetProps } from '../types'

export interface AgricultureState extends Record<string, unknown> {
  crop: string
  season: string
  activities: Array<{ id: string; month: string; activity: string; notes: string }>
  soilType: string
  rainfall: string
  fertilizer: string
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const SOIL_TYPES = ['Sandy loam','Clay','Sandy','Loam','Silt','Peat','Chalk']
const CROPS = ['Maize','Wheat','Sorghum','Cotton','Tobacco','Groundnuts','Sunflower','Soybeans','Vegetables','Sugarcane']

export const defaultState: AgricultureState = {
  crop: 'Maize',
  season: '2024/25',
  soilType: 'Sandy loam',
  rainfall: '600',
  fertilizer: 'Compound D at planting, AN top-dress at 4-6 weeks',
  activities: [
    { id: 'a1', month: 'Oct', activity: 'Land preparation', notes: 'Plough to 20cm depth' },
    { id: 'a2', month: 'Nov', activity: 'Planting', notes: 'Row spacing 90cm, plant spacing 25cm' },
    { id: 'a3', month: 'Dec', activity: 'First weeding', notes: 'Hand hoe or herbicide' },
    { id: 'a4', month: 'Jan', activity: 'Top dressing', notes: 'Apply AN fertilizer' },
    { id: 'a5', month: 'Apr', activity: 'Harvesting', notes: 'When husks dry and grain hard' },
  ],
}

let aid = 20

export default function CropPlanner({ state, onChange, onCheck }: WidgetProps<AgricultureState>) {
  const update = (key: keyof AgricultureState, val: string) => onChange({ ...state, [key]: val })

  const addActivity = () => {
    onChange({ ...state, activities: [...state.activities, { id: `a${aid++}`, month: 'Jan', activity: '', notes: '' }] })
  }

  const updateActivity = (id: string, field: 'month' | 'activity' | 'notes', val: string) => {
    onChange({ ...state, activities: state.activities.map(a => a.id === id ? { ...a, [field]: val } : a) })
  }

  const removeActivity = (id: string) => onChange({ ...state, activities: state.activities.filter(a => a.id !== id) })

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      {/* Crop header */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Crop</p>
          <select value={state.crop} onChange={e => update('crop', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
            {CROPS.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Season</p>
          <input value={state.season} onChange={e => update('season', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" placeholder="2024/25" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Soil Type</p>
          <select value={state.soilType} onChange={e => update('soilType', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
            {SOIL_TYPES.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Annual Rainfall (mm)</p>
          <input value={state.rainfall} onChange={e => update('rainfall', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" placeholder="600" />
        </div>
      </div>

      {/* Fertilizer */}
      <div>
        <p className="text-[10px] text-slate-500 mb-1">Fertilizer Programme</p>
        <input value={state.fertilizer} onChange={e => update('fertilizer', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" placeholder="e.g. Compound D at planting…" />
      </div>

      {/* Activity calendar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Crop Calendar</p>
          <button onClick={addActivity} className="text-[10px] text-green-400 hover:text-green-300 border border-green-500/30 px-2 py-0.5 rounded-lg transition-all">+ Add</button>
        </div>
        <div className="space-y-1.5">
          {state.activities.map(a => (
            <div key={a.id} className="grid grid-cols-[64px_1fr_auto] gap-1.5 items-start">
              <select value={a.month} onChange={e => updateActivity(a.id, 'month', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-1 py-1 text-[10px] text-green-300 focus:outline-none">
                {MONTHS.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
              </select>
              <div className="space-y-0.5">
                <input value={a.activity} onChange={e => updateActivity(a.id, 'activity', e.target.value)} placeholder="Activity" className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-0.5 text-[10px] text-white placeholder:text-slate-600 focus:outline-none" />
                <input value={a.notes} onChange={e => updateActivity(a.id, 'notes', e.target.value)} placeholder="Notes" className="w-full bg-transparent text-[10px] text-slate-500 placeholder:text-slate-700 focus:outline-none px-2" />
              </div>
              <button onClick={() => removeActivity(a.id)} className="text-slate-600 hover:text-red-400 mt-1">×</button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-green-700/70 hover:bg-green-700 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
