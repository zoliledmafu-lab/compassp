import { useEffect, useRef } from 'react'
import type { CharacterState } from '../../lib/learningTypes'
import { voiceService } from '../../lib/voiceService'

interface Props {
  state: CharacterState
  message: string | null
  position: { x: number; y: number }
  tutorName?: string
  muted?: boolean
  onToggleMute?: () => void
  onSpeechEnd?: () => void
  /** When false, skip speaking if something is already playing (low-priority feedback). */
  speakInterrupts?: boolean
}

const CHAR_SIZE = 72

export function CompassCharacter({
  state, message, position, tutorName = 'Compass',
  muted = false, onToggleMute, onSpeechEnd, speakInterrupts = true,
}: Props) {
  const charRef = useRef<HTMLDivElement>(null)
  const prevMessage = useRef<string | null>(null)
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  useEffect(() => {
    if (!charRef.current) return
    charRef.current.setAttribute('data-state', state)
  }, [state])

  useEffect(() => {
    if (message && message !== prevMessage.current) {
      if (speakInterrupts) {
        voiceService.speak(message, 0.92, 1.0, onSpeechEnd)
      } else {
        voiceService.speakIfFree(message, 0.92, 1.0, onSpeechEnd)
      }
    }
    if (!message && prevMessage.current) {
      voiceService.stop()
    }
    prevMessage.current = message
  }, [message, onSpeechEnd, speakInterrupts])

  useEffect(() => {
    voiceService.setMuted(muted)
  }, [muted])

  const animClass = prefersReducedMotion ? '' : ({
    idle:        'compass-anim-idle',
    thinking:    'compass-anim-think',
    speaking:    'compass-anim-speak',
    celebrating: 'compass-anim-celebrate',
    moving:      '',
  } as Record<CharacterState, string>)[state]

  const glowColor = state === 'celebrating' ? 'rgba(245,158,11,0.7)'
    : state === 'thinking'    ? 'rgba(99,102,241,0.6)'
    : state === 'speaking'    ? 'rgba(20,184,166,0.6)'
    : 'rgba(217,119,6,0.3)'

  return (
    <div
      className="absolute z-20 flex flex-col items-center gap-1 pointer-events-none"
      style={{
        left: `${position.x}%`,
        top:  `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        transition: 'left 0.85s cubic-bezier(0.4,0,0.2,1), top 0.85s cubic-bezier(0.4,0,0.2,1)',
        width: CHAR_SIZE + 40,
      }}
    >
      {/* Speech bubble */}
      {message && (
        <div
          className="absolute bottom-full mb-3 left-1/2"
          style={{ transform: 'translateX(-50%)', width: 220, zIndex: 30 }}
        >
          <div
            className="rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-snug shadow-xl"
            style={{
              background: 'rgba(10,14,26,0.92)',
              border: '1.5px solid rgba(20,184,166,0.4)',
              color: '#e2e8f0',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(20,184,166,0.15)',
            }}
          >
            {message}
          </div>
          <div style={{
            position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
            borderTop: '7px solid rgba(20,184,166,0.4)',
          }} />
        </div>
      )}

      {/* Character gem */}
      <div
        ref={charRef}
        className={`compass-character ${animClass}`}
        style={{
          width: CHAR_SIZE, height: CHAR_SIZE,
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #d97706 100%)',
          borderRadius: 18,
          transform: 'rotate(45deg)',
          boxShadow: `0 0 28px ${glowColor}, 0 4px 20px rgba(0,0,0,0.5)`,
          cursor: 'default',
          flexShrink: 0,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-45deg)' }}>
          <CompassRoseIcon state={state} />
        </div>
      </div>

      {/* Name label + mute */}
      <div className="flex items-center gap-1.5 mt-1 pointer-events-auto">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(10,14,26,0.75)', color: '#5eead4', backdropFilter: 'blur(4px)', border: '1px solid rgba(20,184,166,0.25)' }}
        >
          {tutorName}
        </span>
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className="text-white/40 hover:text-white/80 transition-colors"
            title={muted ? 'Unmute voice' : 'Mute voice'}
            style={{ fontSize: 12 }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        )}
      </div>
    </div>
  )
}

function CompassRoseIcon({ state }: { state: CharacterState }) {
  const isThinking    = state === 'thinking'
  const isCelebrating = state === 'celebrating'

  return (
    <svg width={32} height={32} viewBox="0 0 36 36" fill="none">
      {isCelebrating ? (
        <>
          <circle cx={18} cy={18} r={14} fill="rgba(255,255,255,0.15)" />
          <text x={18} y={23} textAnchor="middle" fontSize={20} fill="white">⭐</text>
        </>
      ) : isThinking ? (
        <>
          <circle cx={18} cy={18} r={10} stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} fill="none" strokeDasharray="4 3">
            <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={18} cy={18} r={3} fill="rgba(255,255,255,0.8)" />
        </>
      ) : (
        <>
          <line x1={18} y1={6} x2={18} y2={30} stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} strokeLinecap="round" />
          <line x1={6} y1={18} x2={30} y2={18} stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} strokeLinecap="round" />
          <polygon points="18,6 21,14 18,12 15,14" fill="white" opacity={0.9} />
          <circle cx={18} cy={18} r={3.5} fill="white" opacity={0.9} />
          <circle cx={18} cy={18} r={1.5} fill="#0f766e" />
        </>
      )}
    </svg>
  )
}
