export interface VoiceOption {
  id: string
  label: string
  gender: 'female' | 'male'
  voiceName: string
}

const FEMALE_KW = [
  'female', 'aria', 'jenny', 'zira', 'hazel', 'susan', 'linda', 'samantha',
  'victoria', 'karen', 'moira', 'tessa', 'fiona', 'kate', 'natasha', 'emma',
  'girl', 'woman', 'she',
]
const MALE_KW = [
  'male', 'guy', 'david', 'mark', 'james', 'john', 'ryan', 'daniel',
  'george', 'rishi', 'brian', 'richard', 'man', 'boy',
]

function guessGender(v: SpeechSynthesisVoice): 'female' | 'male' {
  const n = v.name.toLowerCase()
  if (MALE_KW.some(k => n.includes(k))) return 'male'
  if (FEMALE_KW.some(k => n.includes(k))) return 'female'
  return 'female'
}

const FEMALE_LABELS = ['Aria', 'Emma']
const MALE_LABELS   = ['David', 'James']

class VoiceService {
  private _voices: SpeechSynthesisVoice[] = []
  private _selected: SpeechSynthesisVoice | null = null
  private _muted = false
  private _initiated = false
  private _keepAlive: ReturnType<typeof setInterval> | null = null

  async init(): Promise<void> {
    if (this._initiated || typeof window === 'undefined' || !window.speechSynthesis) return
    this._initiated = true

    await new Promise<void>(resolve => {
      const load = () => {
        this._voices = window.speechSynthesis.getVoices()
        resolve()
      }
      const v = window.speechSynthesis.getVoices()
      if (v.length > 0) { this._voices = v; resolve() }
      else {
        window.speechSynthesis.onvoiceschanged = load
        setTimeout(resolve, 3000)
      }
    })

    const saved = localStorage.getItem('compass-voice-name')
    if (saved) {
      this._selected = this._voices.find(v => v.name === saved) ?? null
    }
    if (!this._selected) {
      const opts = this.getOptions()
      const first = opts.find(o => o.gender === 'female') ?? opts[0]
      if (first) {
        this._selected = this._voices.find(v => v.name === first.voiceName) ?? null
      }
    }
  }

  getOptions(): VoiceOption[] {
    const english = this._voices.filter(v => v.lang.startsWith('en'))
    if (english.length === 0) return []

    const rank = (v: SpeechSynthesisVoice) =>
      (!v.localService ? 2 : 0) + (v.name.toLowerCase().includes('online') ? 1 : 0)

    const female = english.filter(v => guessGender(v) === 'female').sort((a, b) => rank(b) - rank(a))
    const male   = english.filter(v => guessGender(v) === 'male').sort((a, b) => rank(b) - rank(a))

    const opts: VoiceOption[] = []
    female.slice(0, 2).forEach((v, i) => opts.push({ id: `f${i}`, label: FEMALE_LABELS[i], gender: 'female', voiceName: v.name }))
    male.slice(0, 2).forEach((v, i)   => opts.push({ id: `m${i}`, label: MALE_LABELS[i],   gender: 'male',   voiceName: v.name }))
    return opts
  }

  setVoice(voiceName: string): void {
    this._selected = this._voices.find(v => v.name === voiceName) ?? null
    localStorage.setItem('compass-voice-name', voiceName)
  }

  getSelectedVoiceName(): string | null {
    return this._selected?.name ?? null
  }

  setMuted(m: boolean): void {
    this._muted = m
    if (m) this.stop()
  }

  isSpeaking(): boolean {
    return typeof window !== 'undefined' && window.speechSynthesis?.speaking === true
  }

  /** Always cancels current speech and starts new one. */
  speak(text: string, rate = 0.92, pitch = 1.0, onEnd?: () => void): void {
    if (this._muted || typeof window === 'undefined' || !window.speechSynthesis) {
      onEnd?.()
      return
    }
    this._clearKeepAlive()
    window.speechSynthesis.cancel()
    this._startUtterance(text, rate, pitch, onEnd)
  }

  /** Only speaks if nothing is currently playing — used for low-priority feedback. */
  speakIfFree(text: string, rate = 0.92, pitch = 1.0, onEnd?: () => void): void {
    if (this._muted || typeof window === 'undefined' || !window.speechSynthesis) {
      onEnd?.()
      return
    }
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      onEnd?.()
      return
    }
    this._startUtterance(text, rate, pitch, onEnd)
  }

  private _startUtterance(text: string, rate: number, pitch: number, onEnd?: () => void): void {
    const utt = new SpeechSynthesisUtterance(text)
    if (this._selected) utt.voice = this._selected
    utt.rate  = rate
    utt.pitch = pitch

    // Chrome bug: synthesis silently stalls after ~15 s.
    // Calling resume() every 5 s keeps it alive without the glitch that pause()+resume() causes.
    this._keepAlive = setInterval(() => {
      if (typeof window === 'undefined') return
      if (!window.speechSynthesis.speaking) { this._clearKeepAlive(); return }
      window.speechSynthesis.resume()
    }, 5000)

    const finish = () => { this._clearKeepAlive(); onEnd?.() }
    utt.addEventListener('end',   finish)
    utt.addEventListener('error', finish)
    window.speechSynthesis.speak(utt)
  }

  preview(voiceName: string): void {
    const v = this._voices.find(vv => vv.name === voiceName)
    if (!v || typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance("Hello! I'm your Compass tutor. Let's study together!")
    utt.voice = v
    utt.rate  = 0.92
    window.speechSynthesis.speak(utt)
  }

  stop(): void {
    this._clearKeepAlive()
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
  }

  private _clearKeepAlive(): void {
    if (this._keepAlive !== null) {
      clearInterval(this._keepAlive)
      this._keepAlive = null
    }
  }
}

export const voiceService = new VoiceService()
