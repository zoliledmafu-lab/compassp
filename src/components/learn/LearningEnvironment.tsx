import { useCallback, useEffect, useRef, useState } from 'react'
import type { CharacterState, CircleWidgetState, DrawAnnotation, LearningTopic } from '../../lib/learningTypes'
import { queryLearningCompanion } from '../../lib/learnApi'
import { CompassCharacter } from './CompassCharacter'
import { DrawOverlay } from './DrawOverlay'
import { ProgressBar } from './ProgressBar'
import { CircleGraphWidget } from './CircleGraphWidget'
import { SessionSummary } from './SessionSummary'

interface Props {
  topic: LearningTopic
  onExit: () => void
}

const INITIAL_CHAR_POS = { x: 18, y: 78 }

export function LearningEnvironment({ topic, onExit }: Props) {
  const [stepIndex,    setStepIndex]    = useState(0)
  const [widgetState,  setWidgetState]  = useState<CircleWidgetState>({ center: { x: 0, y: 0 }, radius: 2 })
  const [charState,    setCharState]    = useState<CharacterState>('idle')
  const [charPos,      setCharPos]      = useState(INITIAL_CHAR_POS)
  const [message,      setMessage]      = useState<string | null>(null)
  const [annotations,  setAnnotations]  = useState<DrawAnnotation[]>([])
  const [progress,     setProgress]     = useState(0)
  const [hintsUsed,    setHintsUsed]    = useState(0)
  const [annotCount,   setAnnotCount]   = useState(0)
  const [muted,        setMuted]        = useState(false)
  const [showSummary,  setShowSummary]  = useState(false)
  const [widgetSize,   setWidgetSize]   = useState({ w: 360, h: 360 })
  const [stepsComplete, setStepsComplete] = useState<number[]>([])
  const startTime = useRef(Date.now())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)

  const step = topic.steps[stepIndex]
  const milestones = topic.steps.map(s => s.milestone)

  // Greet on mount and step change
  useEffect(() => {
    setWidgetState({ center: { x: 0, y: 0 }, radius: 2 })
    setAnnotations([])
    setCharPos(INITIAL_CHAR_POS)
    askCompanion('session_start')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex])

  const speak = useCallback((text: string, state: CharacterState = 'speaking', durationMs = 4000) => {
    setCharState(state)
    setMessage(text)
    setTimeout(() => {
      setMessage(null)
      setCharState('idle')
    }, durationMs)
  }, [])

  const moveCharToward = useCallback((annotation: DrawAnnotation) => {
    // Move character toward annotation target (as % of widget container)
    const gridRange = step.widgetConfig.gridRange
    const xPct = 50 + (annotation.target.x / gridRange) * 35
    const yPct = 50 - (annotation.target.y / gridRange) * 35
    const clampedX = Math.max(10, Math.min(90, xPct))
    const clampedY = Math.max(10, Math.min(90, yPct))
    setCharState('moving')
    setCharPos({ x: clampedX, y: clampedY })
    setTimeout(() => setCharPos(INITIAL_CHAR_POS), 3500)
  }, [step])

  const askCompanion = useCallback(async (trigger: 'widget_change' | 'check' | 'session_start') => {
    if (trigger === 'widget_change') setCharState('thinking')

    const resp = await queryLearningCompanion(topic, step, widgetState, trigger, hintsUsed)

    // Move toward first annotation before rendering it
    if (resp.annotations.length > 0) {
      moveCharToward(resp.annotations[0])
      setAnnotCount(p => p + resp.annotations.length)
      setTimeout(() => setAnnotations(resp.annotations), 700)
    } else {
      setAnnotations([])
    }

    speak(resp.response_text, resp.is_correct ? 'celebrating' : 'speaking', resp.is_correct ? 3500 : 4500)

    if (resp.advance_step) {
      const nextStep = stepIndex + 1
      const newProgress = nextStep / topic.steps.length
      setProgress(newProgress)
      setStepsComplete(prev => [...prev, stepIndex])

      if (nextStep >= topic.steps.length) {
        setTimeout(() => setShowSummary(true), 2500)
      } else {
        setTimeout(() => {
          setStepIndex(nextStep)
          setCharState('idle')
        }, 2000)
      }
    }
  }, [topic, step, widgetState, hintsUsed, stepIndex, speak, moveCharToward])

  // Debounced widget state change → ask companion
  const handleWidgetChange = useCallback((state: CircleWidgetState) => {
    setWidgetState(state)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      askCompanion('widget_change')
    }, 900)
  }, [askCompanion])

  const handleCheck = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setHintsUsed(p => p + 1)
    askCompanion('check')
  }

  const handleHint = () => {
    const hintIdx = Math.min(hintsUsed, step.hints.length - 1)
    const hint = step.hints[hintIdx] ?? "Keep adjusting — you're close!"
    setHintsUsed(p => p + 1)
    speak(hint, 'speaking', 5000)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#f8f4ef', minHeight: '100vh' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1" style={{ background: '#fdfaf4', borderBottom: '1px solid #e5e0d8' }}>
        <button onClick={onExit} className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1 transition-colors">
          ← Exit
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{topic.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">Step {stepIndex + 1} of {topic.steps.length} — {step.title}</p>
        </div>
        <div className="text-xs text-slate-400">
          {Math.round(progress * 100)}%
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#fdfaf4', borderBottom: '1px solid #ede8e0' }}>
        <ProgressBar progress={progress} milestones={milestones} currentStep={stepIndex} />
      </div>

      {/* Main: widget + character */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">

        {/* Widget card */}
        <div
          ref={widgetRef}
          className="relative flex-1 rounded-2xl overflow-hidden shadow-sm"
          style={{ background: '#fdfaf4', border: '1.5px solid #e5e0d8', minHeight: 320, maxHeight: 520 }}
        >
          {/* Instruction strip */}
          <div className="px-4 pt-3 pb-2 border-b" style={{ borderColor: '#ede8e0' }}>
            <p className="text-sm font-medium text-slate-700">{step.instruction}</p>
          </div>

          {/* Widget */}
          <div className="relative" style={{ height: 'calc(100% - 44px)' }}>
            <CircleGraphWidget
              gridRange={step.widgetConfig.gridRange}
              equation={step.equation}
              value={widgetState}
              onChange={handleWidgetChange}
              onSizeChange={(w, h) => setWidgetSize({ w, h })}
            />

            {/* SVG annotation overlay */}
            <DrawOverlay
              annotations={annotations}
              gridRange={step.widgetConfig.gridRange}
              width={widgetSize.w}
              height={widgetSize.h}
            />

            {/* Compass character lives IN the widget space */}
            <CompassCharacter
              state={charState}
              message={message}
              position={charPos}
              muted={muted}
              onToggleMute={() => setMuted(v => !v)}
            />
          </div>
        </div>

        {/* Right panel: equation + actions */}
        <div className="md:w-48 flex flex-col gap-3">
          {/* Equation card */}
          {step.equation && (
            <div className="rounded-2xl p-4 text-center" style={{ background: '#fdfaf4', border: '1.5px solid #e5e0d8' }}>
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-medium">Equation</p>
              <p className="text-base font-semibold text-slate-700" style={{ fontFamily: 'Georgia, serif' }}>{step.equation}</p>
            </div>
          )}

          {/* Check button */}
          <button
            onClick={handleCheck}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-95"
            style={{ background: '#1e293b', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            Check
          </button>

          {/* Hint button */}
          <button
            onClick={handleHint}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all border"
            style={{ color: '#0f766e', borderColor: '#0f766e', background: 'transparent' }}
          >
            💡 Hint
          </button>

          {/* Session stats */}
          <div className="mt-auto rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid #e5e0d8' }}>
            <p className="text-xs text-slate-400">Hints used</p>
            <p className="text-lg font-bold text-slate-600">{hintsUsed}</p>
          </div>
        </div>
      </div>

      {/* Session summary modal */}
      {showSummary && (
        <SessionSummary
          topicTitle={topic.title}
          stepsCompleted={stepsComplete.length}
          totalSteps={topic.steps.length}
          hintsUsed={hintsUsed}
          annotationsUsed={annotCount}
          durationMs={Date.now() - startTime.current}
          onContinue={onExit}
        />
      )}
    </div>
  )
}
