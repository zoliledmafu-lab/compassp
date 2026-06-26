import { useState, useEffect, useRef, useCallback } from 'react'
import { Settings, X, Keyboard, Square } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

// Electron IPC bridge injected by preload.ts
declare global {
  interface Window {
    electronAPI?: {
      toggle:             () => void
      getSettings:        () => Promise<{ shortcut: string; voiceGender: string; active: boolean }>
      getActive:          () => Promise<boolean>
      setShortcut:        (acc: string) => Promise<{ ok: boolean; error?: string }>
      saveSettings:       (s: object) => void
      setStudentId:       (id: string) => void
      query:              (transcript: string) => Promise<unknown>
      speakDone:          () => void
      onStateChange:      (cb: (s: string) => void) => void
      onStartListening:   (cb: () => void) => void
      onResponse:         (cb: (d: unknown) => void) => void
      onError:            (cb: (msg: string) => void) => void
      onPromptShortcut:   (cb: (cur: string) => void) => void
      removeAllListeners: (ch: string) => void
    }
  }
}

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-companion`
const IS_ELECTRON = typeof window !== 'undefined' && !!window.electronAPI

type State = 'off' | 'idle' | 'listening' | 'thinking' | 'speaking'

const STATE_STYLE: Record<State, string> = {
  off:       'border-white/10 bg-white/5',
  idle:      'border-white/20 bg-[#0f0f1a]/60',
  listening: 'border-red-500   bg-red-500/10 scale-110',
  thinking:  'border-blue-500  bg-blue-500/10',
  speaking:  'border-green-500 bg-green-500/10',
}

export function Companion() {
  const { user } = useAuth()
  const [active,        setActive]        = useState(false)
  const [state,         setState]         = useState<State>('off')
  const [shortcut,      setShortcut]      = useState('Ctrl+Shift+Space')
  const [shortcutEdit,  setShortcutEdit]  = useState('')
  const [showSettings,  setShowSettings]  = useState(false)
  const [response,      setResponse]      = useState('')
  const [transcript,    setTranscript]    = useState('')
  const [error,         setError]         = useState('')
  const [voiceGender,   setVoiceGender]   = useState<'male'|'female'>('female')

  const audioRef   = useRef<HTMLAudioElement | null>(null)
  const recRef     = useRef<SpeechRecognition | null>(null)
  const accRef     = useRef('')   // accumulated final transcript

  // ── Boot ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!IS_ELECTRON) return

    window.electronAPI!.getSettings().then(s => {
      setShortcut(s.shortcut)
      setActive(s.active)
      if (s.active) setState('idle')
      setVoiceGender(s.voiceGender as 'male'|'female')
    })

    window.electronAPI!.onStateChange(s => {
      setState(s as State)
      if (s === 'off') { setActive(false); setResponse(''); setTranscript('') }
      if (s === 'idle' || s !== 'off') setActive(true)
    })

    window.electronAPI!.onStartListening(() => startListening())

    window.electronAPI!.onResponse(data => {
      const d = data as { response_text?: string; audio_base64?: string }
      const txt = d?.response_text ?? ''
      setResponse(txt)
      if (d?.audio_base64) playAudio(d.audio_base64, txt)
      else speakWebSpeech(txt)
    })

    window.electronAPI!.onError(msg => {
      setError(msg)
      setState('idle')
    })

    window.electronAPI!.onPromptShortcut(cur => {
      setShortcutEdit(cur)
      setShowSettings(true)
    })

    return () => {
      ;['companion:stateChange','companion:startListening','companion:response',
        'companion:error','companion:promptShortcut'].forEach(ch =>
        window.electronAPI!.removeAllListeners(ch)
      )
    }
  }, []) // eslint-disable-line

  // Sync student ID to main process
  useEffect(() => {
    if (IS_ELECTRON && user?.id) window.electronAPI!.setStudentId(user.id)
  }, [user?.id])

  // ── Spacebar toggle listen/stop ───────────────────────────────────

  useEffect(() => {
    if (state === 'off') return
    const onKey = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' && !e.repeat &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        if (state === 'listening') stopListening()
        else if (state === 'idle') startListening()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state]) // eslint-disable-line

  // ── Toggle companion on/off ───────────────────────────────────────

  const handleToggle = () => {
    if (IS_ELECTRON) {
      window.electronAPI!.toggle()
    } else {
      if (active) {
        recRef.current?.abort()
        setActive(false); setState('off')
        setResponse(''); setTranscript(''); setError('')
        speechSynthesis?.cancel(); audioRef.current?.pause()
      } else {
        setActive(true); setState('idle')
      }
    }
  }

  // ── Voice: click once to START, stop button to END ───────────────

  const startListening = useCallback(() => {
    if (state !== 'idle') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError('Voice recognition requires Chrome or Edge'); return }

    accRef.current = ''
    setState('listening')
    setResponse(''); setTranscript(''); setError('')

    const rec = new SR() as SpeechRecognition
    recRef.current = rec
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          accRef.current += e.results[i][0].transcript + ' '
        } else {
          interim += e.results[i][0].transcript
        }
      }
      setTranscript((accRef.current + interim).trim())
    }

    rec.onerror = () => { setState('idle'); setTranscript('') }

    rec.onend = () => {
      const final = accRef.current.trim()
      if (final && state !== 'off') {
        setTranscript(final)
        handleQuery(final)
      } else if (!final) {
        setState('idle')
      }
    }

    rec.start()
  }, [state]) // eslint-disable-line

  const stopListening = useCallback(() => {
    if (state !== 'listening') return
    recRef.current?.stop()
    // onend fires → calls handleQuery with accumulated transcript
  }, [state])

  // ── Query ─────────────────────────────────────────────────────────

  const handleQuery = async (text: string) => {
    setState('thinking')
    try {
      if (IS_ELECTRON) {
        const data = await window.electronAPI!.query(text)
        const d = data as { error?: string }
        if (d?.error) { setError(d.error); setState('idle') }
      } else {
        const res = await fetch(EDGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenshot_base64: '',
            transcript:        text,
            student_id:        user?.id ?? '',
            mode:              'browser',
            app_detected:      document.title,
            voice_gender:      voiceGender,
          }),
        })
        if (!res.ok) throw new Error(`${res.status}`)
        const data = await res.json()
        const txt  = data.response_text ?? ''
        setResponse(txt)
        if (data.audio_base64) playAudio(data.audio_base64, txt)
        else speakWebSpeech(txt)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(`Could not reach Compass AI. ${msg}`)
      setState('idle')
    }
  }

  // ── Audio ─────────────────────────────────────────────────────────

  const playAudio = (base64: string, fallback: string) => {
    setState('speaking')
    try {
      const bytes = atob(base64)
      const arr   = new Uint8Array(bytes.length)
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
      const blob  = new Blob([arr], { type: 'audio/mpeg' })
      const url   = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setState('idle'); URL.revokeObjectURL(url); window.electronAPI?.speakDone() }
      audio.onerror = () => speakWebSpeech(fallback)
      audio.play()
    } catch { speakWebSpeech(fallback) }
  }

  const speakWebSpeech = (text: string) => {
    setState('speaking')
    if (!('speechSynthesis' in window)) { setState('idle'); return }
    speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate  = 0.95
    const voices = speechSynthesis.getVoices()
    const pick   = voices.find(v =>
      voiceGender === 'female'
        ? v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira')
        : v.name.includes('Male')   || v.name.includes('Daniel')   || v.name.includes('David')
    )
    if (pick) utt.voice = pick
    utt.onend   = () => { setState('idle'); window.electronAPI?.speakDone() }
    utt.onerror = () => { setState('idle'); window.electronAPI?.speakDone() }
    speechSynthesis.speak(utt)
  }

  // ── Shortcut config ───────────────────────────────────────────────

  const handleShortcutSave = async () => {
    if (!shortcutEdit.trim()) return
    if (IS_ELECTRON) {
      const res = await window.electronAPI!.setShortcut(shortcutEdit.trim())
      if (res.ok) { setShortcut(shortcutEdit.trim()); setError('') }
      else setError(res.error ?? 'Invalid shortcut')
    } else {
      setShortcut(shortcutEdit.trim())
      localStorage.setItem('companion_shortcut', shortcutEdit.trim())
    }
    setShowSettings(false)
  }

  // ── Render ────────────────────────────────────────────────────────

  const stateLabel = {
    off:       '',
    idle:      IS_ELECTRON ? 'Press shortcut or Space' : 'Click mic or press Space',
    listening: 'Listening — press Space or Stop to finish',
    thinking:  'Thinking…',
    speaking:  'Speaking…',
  }[state]

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        title={active ? 'Deactivate companion' : 'Activate AI companion'}
        className={`fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full border flex items-center justify-center text-sm transition-all duration-200 ${
          active
            ? 'bg-[#0f0f1a] border-white/20 text-white/60 hover:text-white/90'
            : 'bg-[#0f0f1a]/80 border-white/8 text-white/25 hover:text-white/50 hover:border-white/20'
        }`}
      >
        {active ? <X size={14} /> : <span style={{ fontSize: 15 }}>◈</span>}
      </button>

      {/* Active panel */}
      {active && (
        <div className="fixed bottom-[72px] right-6 z-50 flex flex-col items-end gap-2">

          {/* Settings panel */}
          {showSettings && (
            <div className="w-72 rounded-2xl border border-white/10 shadow-2xl overflow-hidden" style={{ background: '#0f0f1a' }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8" style={{ background: '#13131f' }}>
                <div className="flex items-center gap-2">
                  <Settings size={13} className="text-slate-500" />
                  <span className="text-xs font-medium text-white">Companion settings</span>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white">
                  <X size={13} />
                </button>
              </div>
              <div className="px-4 py-4 space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Keyboard size={11} /> Keyboard shortcut
                    {!IS_ELECTRON && <span className="text-slate-600">(Electron required for global shortcuts)</span>}
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={shortcutEdit || shortcut}
                      onChange={e => setShortcutEdit(e.target.value)}
                      onFocus={() => setShortcutEdit(shortcut)}
                      className="flex-1 bg-[#1a1a2e] border border-white/10 rounded-lg text-xs text-white px-3 py-1.5 outline-none font-mono"
                      placeholder="e.g. CommandOrControl+Shift+Space"
                    />
                    <button onClick={handleShortcutSave} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg px-3 py-1.5">
                      Save
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Current: <span className="font-mono text-slate-400">{shortcut}</span></p>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Voice</label>
                  <select
                    value={voiceGender}
                    onChange={e => {
                      const v = e.target.value as 'male'|'female'
                      setVoiceGender(v)
                      window.electronAPI?.saveSettings({ voiceGender: v })
                    }}
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg text-xs text-white px-3 py-1.5 outline-none"
                  >
                    <option value="female">Female (Sarah)</option>
                    <option value="male">Male (Liam)</option>
                  </select>
                </div>

                {!IS_ELECTRON && (
                  <p className="text-xs text-amber-600/80 bg-amber-900/20 rounded-lg px-3 py-2">
                    Browser mode — screen capture and click simulation require the Electron desktop app.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status + settings gear */}
          <div className="flex items-center gap-2">
            {stateLabel && (
              <span className="text-xs text-slate-500 bg-[#0f0f1a]/80 border border-white/8 rounded-full px-3 py-1">
                {stateLabel}
              </span>
            )}
            <button
              onClick={() => setShowSettings(s => !s)}
              className="w-7 h-7 rounded-full border border-white/8 bg-[#0f0f1a]/80 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
            >
              <Settings size={11} />
            </button>
          </div>

          {/* Conversation bubbles */}
          {(transcript || response || error) && (
            <div className="w-72 space-y-2">
              {transcript && (
                <div className="bg-[#1a1040]/90 border border-white/8 rounded-xl px-3 py-2 backdrop-blur">
                  <p className="text-xs text-slate-500 mb-0.5">You</p>
                  <p className="text-xs text-white">{transcript}</p>
                </div>
              )}
              {response && (
                <div className="bg-[#0d1a10]/90 border border-green-900/40 rounded-xl px-3 py-2 backdrop-blur">
                  <p className="text-xs text-green-400 mb-0.5">Compass</p>
                  <p className="text-xs text-white leading-relaxed">{response}</p>
                </div>
              )}
              {error && (
                <div className="bg-red-950/60 border border-red-900/40 rounded-xl px-3 py-2">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Voice ring button — click to start, stop button while listening */}
          <div className="flex items-center gap-2">
            {state === 'listening' && (
              <button
                onClick={stopListening}
                title="Stop listening"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-red-600/80 hover:bg-red-500 text-white text-xs font-medium transition-colors"
              >
                <Square size={11} fill="currentColor" /> Stop
              </button>
            )}

            <button
              onClick={() => {
                if (state === 'listening') stopListening()
                else if (state === 'idle') startListening()
                else if (state === 'speaking') {
                  audioRef.current?.pause()
                  speechSynthesis?.cancel()
                  setState('idle')
                }
              }}
              disabled={state === 'thinking'}
              title={state === 'listening' ? 'Stop listening' : 'Start listening'}
              className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl transition-all duration-150 shadow-lg ${STATE_STYLE[state]}`}
            >
              {state === 'listening' && <span className="text-red-400 animate-pulse">●</span>}
              {state === 'thinking'  && <span className="animate-spin text-blue-400 text-base">⟳</span>}
              {state === 'speaking'  && <span className="text-green-400">♪</span>}
              {state === 'idle'      && <span className="text-white/40">◈</span>}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
