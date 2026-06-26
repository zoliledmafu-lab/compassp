import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface BinaryConverterState extends Record<string, unknown> {
  inputValue: string
  inputBase: 2 | 8 | 10 | 16
  showSteps: boolean
}

export const defaultState: BinaryConverterState = {
  inputValue: '42',
  inputBase: 10,
  showSteps: true,
}

type Base = 2 | 8 | 10 | 16
const BASES: { base: Base; label: string; color: string }[] = [
  { base: 2,  label: 'BIN', color: '#6366f1' },
  { base: 8,  label: 'OCT', color: '#06b6d4' },
  { base: 10, label: 'DEC', color: '#22c55e' },
  { base: 16, label: 'HEX', color: '#f59e0b' },
]

function isValidForBase(val: string, base: Base): boolean {
  if (!val) return false
  const patterns: Record<Base, RegExp> = {
    2:  /^[01]+$/,
    8:  /^[0-7]+$/,
    10: /^\d+$/,
    16: /^[0-9a-fA-F]+$/,
  }
  return patterns[base].test(val)
}

function convertToDecimal(val: string, base: Base): number | null {
  if (!isValidForBase(val, base)) return null
  return parseInt(val, base)
}

function getDivisionSteps(decimal: number): string[] {
  if (decimal === 0) return ['0 ÷ 2 = 0 remainder 0']
  const steps: string[] = []
  let n = decimal
  while (n > 0) {
    const rem = n % 2
    steps.push(`${n} ÷ 2 = ${Math.floor(n / 2)} remainder ${rem}`)
    n = Math.floor(n / 2)
  }
  return steps
}

function getPositionalBreakdown(val: string, base: Base): string[] {
  const digits = val.toUpperCase().split('').reverse()
  return digits.map((d, i) => {
    const digitVal = parseInt(d, 16)
    const power = Math.pow(base, i)
    return `${d} × ${base}^${i} = ${digitVal} × ${power} = ${digitVal * power}`
  }).reverse()
}

export default function BinaryConverter({ state, onChange, onCheck }: WidgetProps<BinaryConverterState>) {
  const { inputValue, inputBase, showSteps } = state
  const [inputError, setInputError] = useState(false)

  const decimal = convertToDecimal(inputValue, inputBase)
  const valid = decimal !== null && decimal >= 0

  const conversions: Record<Base, string> = {
    2:  valid ? decimal!.toString(2) : '—',
    8:  valid ? decimal!.toString(8) : '—',
    10: valid ? decimal!.toString(10) : '—',
    16: valid ? decimal!.toString(16).toUpperCase() : '—',
  }

  function handleInput(val: string) {
    setInputError(!isValidForBase(val, inputBase) && val.length > 0)
    onChange({ ...state, inputValue: val })
  }

  function handleBaseChange(base: Base) {
    // Convert current value to new base if possible
    const dec = convertToDecimal(inputValue, inputBase)
    const newVal = dec !== null ? dec.toString(base).toUpperCase() : ''
    setInputError(false)
    onChange({ ...state, inputBase: base, inputValue: newVal })
  }

  const divSteps = valid && inputBase === 10 ? getDivisionSteps(decimal!) : []
  const posSteps = valid && inputBase !== 10 ? getPositionalBreakdown(inputValue, inputBase) : []

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      <div className="flex items-center justify-between">
        <span className="text-slate-300 font-semibold">Binary / Hex Converter</span>
        <button onClick={() => onChange({ ...state, showSteps: !showSteps })}
          className={`px-2 py-0.5 rounded text-xs transition-all ${showSteps ? 'bg-indigo-600/70 text-white' : 'bg-white/10 text-slate-400'}`}>
          {showSteps ? 'Steps ON' : 'Steps OFF'}
        </button>
      </div>

      {/* Base selector */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
        {BASES.map(({ base, label, color }) => (
          <button key={base} onClick={() => handleBaseChange(base)}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${inputBase === base ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-white'}`}
            style={{ color: inputBase === base ? color : undefined }}>
            {label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div>
        <input
          value={inputValue}
          onChange={e => handleInput(e.target.value.toUpperCase())}
          placeholder={`Enter ${BASES.find(b => b.base === inputBase)?.label} value...`}
          className={`w-full bg-white/10 rounded-xl px-4 py-3 text-white text-lg font-mono text-center outline-none border-2 transition-colors ${
            inputError ? 'border-red-500/60' : 'border-white/10 focus:border-white/20'
          }`}
          spellCheck={false}
        />
        {inputError && (
          <p className="text-red-400 text-center mt-1" style={{ fontSize: 10 }}>
            Invalid character for base {inputBase}
          </p>
        )}
      </div>

      {/* Conversion results */}
      <div className="grid grid-cols-2 gap-1.5">
        {BASES.filter(b => b.base !== inputBase).map(({ base, label, color }) => (
          <div key={base} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5"
            style={{ borderColor: color + '30' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-bold text-xs" style={{ color }}>{label}</span>
              <span className="text-slate-500" style={{ fontSize: 9 }}>base {base}</span>
            </div>
            <p className="font-mono text-sm font-semibold text-white break-all">{conversions[base]}</p>
          </div>
        ))}
      </div>

      {/* Steps */}
      {showSteps && valid && (
        <div className="bg-white/5 rounded-xl px-3 py-2 space-y-1">
          <p className="text-slate-400 font-semibold" style={{ fontSize: 10 }}>
            {inputBase === 10 ? 'Division by 2 (DEC→BIN):' : `Positional value breakdown (base ${inputBase}→DEC):`}
          </p>
          <div className="space-y-0.5 font-mono max-h-32 overflow-y-auto">
            {(inputBase === 10 ? divSteps : posSteps).map((step, i) => (
              <p key={i} className="text-slate-300" style={{ fontSize: 10 }}>{step}</p>
            ))}
            {inputBase === 10 && divSteps.length > 0 && (
              <p className="text-indigo-400 font-semibold" style={{ fontSize: 10 }}>
                → BIN: {conversions[2]} (read remainders bottom-up)
              </p>
            )}
            {inputBase !== 10 && posSteps.length > 0 && (
              <p className="text-green-400 font-semibold" style={{ fontSize: 10 }}>
                → DEC sum: {decimal}
              </p>
            )}
          </div>
        </div>
      )}

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
