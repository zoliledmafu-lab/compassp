import { useEffect, useState } from 'react'
import { voiceService, type VoiceOption } from '../../lib/voiceService'

interface Props {
  onSelect?: (voiceName: string) => void
}

const GENDER_ICON = { female: '👩', male: '👨' }
const GENDER_COLOR = { female: '#0d9488', male: '#6366f1' }

export function VoiceSelector({ onSelect }: Props) {
  const [options, setOptions]   = useState<VoiceOption[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSupported(false)
      return
    }
    voiceService.init().then(() => {
      const opts = voiceService.getOptions()
      setOptions(opts)
      setSelected(voiceService.getSelectedVoiceName())
      if (opts.length === 0) setSupported(false)
    })
  }, [])

  const handleSelect = (voiceName: string) => {
    voiceService.setVoice(voiceName)
    setSelected(voiceName)
    onSelect?.(voiceName)
  }

  const handlePreview = (voiceName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewing(voiceName)
    voiceService.preview(voiceName)
    setTimeout(() => setPreviewing(null), 3500)
  }

  if (!supported) {
    return (
      <div className="text-xs text-slate-500 text-center py-2">
        Voice not supported in this browser — Compass will use text only.
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div className="text-xs text-slate-400 text-center py-2 animate-pulse">
        Loading voices…
      </div>
    )
  }

  const females = options.filter(o => o.gender === 'female')
  const males   = options.filter(o => o.gender === 'male')

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Choose your tutor's voice
      </p>
      <div className="grid grid-cols-2 gap-2">
        {[...females, ...males].map(opt => {
          const isSelected = selected === opt.voiceName
          const color = GENDER_COLOR[opt.gender]
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.voiceName)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center"
              style={{
                borderColor: isSelected ? color : 'transparent',
                background: isSelected ? `${color}12` : 'rgba(255,255,255,0.04)',
                outline: 'none',
              }}
            >
              <span style={{ fontSize: 26 }}>{GENDER_ICON[opt.gender]}</span>
              <span className="text-xs font-semibold text-white">{opt.label}</span>
              <span className="text-xs text-slate-500 capitalize">{opt.gender}</span>
              <button
                onClick={e => handlePreview(opt.voiceName, e)}
                className="mt-0.5 text-xs px-2 py-0.5 rounded-full border transition-all"
                style={{
                  borderColor: color + '60',
                  color: previewing === opt.voiceName ? 'white' : color,
                  background: previewing === opt.voiceName ? color : 'transparent',
                }}
              >
                {previewing === opt.voiceName ? '🔊 Playing…' : '▶ Preview'}
              </button>
            </button>
          )
        })}
      </div>
    </div>
  )
}
