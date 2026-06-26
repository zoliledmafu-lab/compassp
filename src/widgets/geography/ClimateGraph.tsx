import type { WidgetProps } from '../types'

export interface ClimateState extends Record<string, unknown> {
  locationName: string
  rainfall: number[]
  temperature: number[]
}

export const defaultState: ClimateState = {
  locationName: 'Harare',
  rainfall: [187, 144, 91, 18, 5, 0, 0, 0, 7, 31, 97, 163],
  temperature: [22, 22, 21, 19, 16, 14, 14, 15, 18, 21, 22, 22],
}

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

function fmt(n: number) { return n.toFixed(1) }

export default function ClimateGraph({ state, onChange, onCheck }: WidgetProps<ClimateState>) {
  const { locationName, rainfall, temperature } = state

  const W = 360, H = 200
  const padL = 36, padR = 36, padT = 20, padB = 24
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const maxRain = Math.max(...rainfall, 10)
  const minTemp = Math.min(...temperature) - 2
  const maxTemp = Math.max(...temperature) + 2

  const barW = plotW / 12
  const toX = (i: number) => padL + i * barW
  const barToY = (v: number) => H - padB - (v / (maxRain * 1.1)) * plotH
  const tempToY = (v: number) => H - padB - ((v - minTemp) / (maxTemp - minTemp)) * plotH

  const tempLine = temperature.map((t, i) => {
    const x = padL + i * barW + barW / 2
    const y = tempToY(t)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')

  const totalRain = rainfall.reduce((s, v) => s + v, 0)
  const meanTemp = temperature.reduce((s, v) => s + v, 0) / 12
  const hottestIdx = temperature.indexOf(Math.max(...temperature))
  const coldestIdx = temperature.indexOf(Math.min(...temperature))

  function updateRainfall(idx: number, val: number) {
    const arr = [...rainfall]
    arr[idx] = Math.max(0, val)
    onChange({ ...state, rainfall: arr })
  }

  function updateTemp(idx: number, val: number) {
    const arr = [...temperature]
    arr[idx] = val
    onChange({ ...state, temperature: arr })
  }

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      {/* Location */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 shrink-0">Location</span>
        <input value={locationName} onChange={e => onChange({ ...state, locationName: e.target.value })}
          className="flex-1 bg-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none"
          maxLength={50} placeholder="Location name" />
      </div>

      {/* Dual-axis chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0d0d1f' }}>
        {/* Y-axis grid (rainfall) */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={padL} y1={barToY(f * maxRain * 1.1)} x2={W - padR} y2={barToY(f * maxRain * 1.1)}
            stroke="#ffffff08" strokeWidth="1" />
        ))}

        {/* Rainfall bars */}
        {rainfall.map((r, i) => {
          const barH = ((r / (maxRain * 1.1)) * plotH)
          return (
            <rect key={i}
              x={toX(i) + 2} y={H - padB - barH}
              width={barW - 4} height={barH}
              fill="#3b82f6" opacity="0.6" rx="1" />
          )
        })}

        {/* Temperature line */}
        <polyline points={tempLine} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
        {temperature.map((t, i) => {
          const x = padL + i * barW + barW / 2
          const y = tempToY(t)
          return <circle key={i} cx={x} cy={y} r="3" fill="#ef4444" />
        })}

        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#3b82f6" strokeWidth="1.5" opacity="0.6" />
        <line x1={W - padR} y1={padT} x2={W - padR} y2={H - padB} stroke="#ef4444" strokeWidth="1.5" opacity="0.6" />
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#ffffff30" strokeWidth="1.5" />

        {/* Left Y axis labels (rainfall) */}
        {[0, 0.5, 1].map(f => (
          <text key={f} x={padL - 3} y={barToY(f * maxRain * 1.1) + 3} textAnchor="end" fill="#3b82f680" fontSize="7">
            {Math.round(f * maxRain * 1.1)}
          </text>
        ))}

        {/* Right Y axis labels (temp) */}
        {[0, 0.5, 1].map(f => (
          <text key={f} x={W - padR + 3} y={H - padB - f * plotH + 3} textAnchor="start" fill="#ef444480" fontSize="7">
            {Math.round(minTemp + f * (maxTemp - minTemp))}
          </text>
        ))}

        {/* Left axis label */}
        <text x={12} y={H / 2} textAnchor="middle" fill="#3b82f680" fontSize="7"
          transform={`rotate(-90, 12, ${H / 2})`}>mm</text>
        <text x={W - 12} y={H / 2} textAnchor="middle" fill="#ef444480" fontSize="7"
          transform={`rotate(90, ${W - 12}, ${H / 2})`}>°C</text>

        {/* X axis labels */}
        {MONTHS.map((m, i) => (
          <text key={i} x={toX(i) + barW / 2} y={H - padB + 12} textAnchor="middle" fill="#ffffff40" fontSize="8">{m}</text>
        ))}

        {/* Title */}
        <text x={W / 2} y={14} textAnchor="middle" fill="#ffffff80" fontSize="10" fontWeight="600">{locationName}</text>

        {/* Legends */}
        <rect x={W - padR - 50} y={padT + 2} width="8" height="8" fill="#3b82f6" opacity="0.6" rx="1" />
        <text x={W - padR - 40} y={padT + 9} fill="#3b82f680" fontSize="7">Rainfall</text>
        <line x1={W - padR - 50} y1={padT + 20} x2={W - padR - 42} y2={padT + 20} stroke="#ef4444" strokeWidth="2" />
        <text x={W - padR - 40} y={padT + 23} fill="#ef444480" fontSize="7">Temp</text>
      </svg>

      {/* Data inputs */}
      <div className="space-y-2">
        <p className="text-slate-400">Rainfall (mm) per month:</p>
        <div className="grid grid-cols-12 gap-0.5">
          {rainfall.map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-slate-500" style={{ fontSize: 8 }}>{MONTHS[i]}</span>
              <input
                type="number" min={0} max={9999} value={v}
                onChange={e => updateRainfall(i, parseInt(e.target.value) || 0)}
                className="w-full bg-white/10 rounded px-0.5 py-0.5 text-center text-white font-mono outline-none"
                style={{ fontSize: 8 }}
              />
            </div>
          ))}
        </div>
        <p className="text-slate-400">Temperature (°C) per month:</p>
        <div className="grid grid-cols-12 gap-0.5">
          {temperature.map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-slate-500" style={{ fontSize: 8 }}>{MONTHS[i]}</span>
              <input
                type="number" min={-50} max={60} value={v}
                onChange={e => updateTemp(i, parseInt(e.target.value) || 0)}
                className="w-full bg-white/10 rounded px-0.5 py-0.5 text-center text-white font-mono outline-none"
                style={{ fontSize: 8 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { label: 'Total Rain', value: totalRain + ' mm' },
          { label: 'Mean Temp', value: fmt(meanTemp) + ' °C' },
          { label: 'Hottest', value: MONTHS[hottestIdx] + ' ' + temperature[hottestIdx] + '°C' },
          { label: 'Coldest', value: MONTHS[coldestIdx] + ' ' + temperature[coldestIdx] + '°C' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/5 border border-white/8 rounded-lg px-1 py-1.5">
            <p className="text-slate-500" style={{ fontSize: 9 }}>{label}</p>
            <p className="text-white font-semibold mt-0.5" style={{ fontSize: 9 }}>{value}</p>
          </div>
        ))}
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
