import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  CharacterState,
  CircleWidgetState,
  LinearWidgetState,
  QuadraticWidgetState,
  AngleWidgetState,
  PythagorasWidgetState,
  NumberLineWidgetState,
  BarChartWidgetState,
  ProcessDiagramWidgetState,
  DrawAnnotation,
  LearningTopic,
  WidgetState,
  WidgetType,
} from '../../lib/learningTypes'
import { getSubject } from '../../lib/learningTypes'
import { queryLearningCompanion, chatWithCompanion } from '../../lib/learnApi'
import { voiceService } from '../../lib/voiceService'
import { CompassCharacter } from './CompassCharacter'
import { DrawOverlay } from './DrawOverlay'
import { ProgressBar } from './ProgressBar'
import { CircleGraphWidget } from './CircleGraphWidget'
import { LinearGraphWidget } from './LinearGraphWidget'
import { QuadraticGraphWidget } from './QuadraticGraphWidget'
import { AngleWidget } from './AngleWidget'
import { PythagorasWidget } from './PythagorasWidget'
import { NumberLineWidget } from './NumberLineWidget'
import { BarChartWidget } from './BarChartWidget'
import { DistillationWidget } from './DistillationWidget'
import { WaterCycleWidget } from './WaterCycleWidget'
import { MiningWidget } from './MiningWidget'
import { RockCycleWidget } from './RockCycleWidget'
import { SessionSummary } from './SessionSummary'

interface Props {
  topic: LearningTopic
  onExit: () => void
}

interface ChatMsg {
  role: 'student' | 'compass'
  text: string
  id: number
}

const INITIAL_CHAR_POS = { x: 16, y: 75 }

const INITIAL_WIDGET_STATE: Record<WidgetType, WidgetState> = {
  'circle-graph':    { center: { x: 0, y: 0 }, radius: 2 },
  'linear-graph':    { slope: 1, intercept: 0 },
  'quadratic-graph': { a: 1, h: 0, k: 0 },
  'angle':           { angleDeg: 45 },
  'pythagoras':      { a: 3, b: 3 },
  'number-line':     { value: 7 },
  'bar-chart':       { bars: [] },
  'process-diagram': { selectedStage: '', visitedStages: [] },
}

const GRAPH_WIDGETS: WidgetType[] = ['circle-graph', 'linear-graph', 'quadratic-graph']

const RIGHT_PANEL_MIN = 200
const RIGHT_PANEL_MAX = 560
const RIGHT_PANEL_DEFAULT = 272

function getFirstState(step: LearningTopic['steps'][0]): WidgetState {
  if (step.widgetType === 'bar-chart') {
    const labels = step.widgetConfig.labels as string[] | undefined
    const correct = step.correctState as BarChartWidgetState
    const n = labels?.length ?? correct.bars.length ?? 4
    return { bars: new Array(n).fill(0) }
  }
  if (step.widgetType === 'number-line') {
    const cfg = step.widgetConfig
    const mid = ((cfg.min as number ?? 0) + (cfg.max as number ?? 14)) / 2
    return { value: Math.round(mid) }
  }
  if (step.widgetType === 'process-diagram') {
    return { selectedStage: '', visitedStages: [] }
  }
  return INITIAL_WIDGET_STATE[step.widgetType]
}

let _msgId = 0
const nextId = () => ++_msgId

export function LearningEnvironment({ topic, onExit }: Props) {
  const [stepIndex,       setStepIndex]       = useState(0)
  const [widgetState,     setWidgetState]      = useState<WidgetState>(() => getFirstState(topic.steps[0]))
  const [charState,       setCharState]        = useState<CharacterState>('idle')
  const [charPos,         setCharPos]          = useState(INITIAL_CHAR_POS)
  const [message,         setMessage]          = useState<string | null>(null)
  const [speakInterrupts, setSpeakInterrupts]  = useState(true)
  const [annotations,     setAnnotations]      = useState<DrawAnnotation[]>([])
  const [progress,        setProgress]         = useState(0)
  const [hintsUsed,       setHintsUsed]        = useState(0)
  const [muted,           setMuted]            = useState(false)
  const [showSummary,     setShowSummary]      = useState(false)
  const [widgetSize,      setWidgetSize]       = useState({ w: 360, h: 360 })
  const [stepsComplete,   setStepsComplete]    = useState<number[]>([])
  const [chatMsgs,        setChatMsgs]         = useState<ChatMsg[]>([])
  const [chatInput,       setChatInput]        = useState('')
  const [chatLoading,     setChatLoading]      = useState(false)
  const [rightW,          setRightW]           = useState(RIGHT_PANEL_DEFAULT)
  const [dividerHovered,  setDividerHovered]   = useState(false)
  const [dividerDragging, setDividerDragging]  = useState(false)
  const [isMobile,        setIsMobile]         = useState(() => window.innerWidth < 768)

  const startTime    = useRef(Date.now())
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const msgTimerRef  = useRef<number | null>(null)
  const chatEndRef   = useRef<HTMLDivElement>(null)
  const dividerDragX = useRef(0)
  const dividerDragW = useRef(RIGHT_PANEL_DEFAULT)

  const step          = topic.steps[stepIndex]
  const milestones    = topic.steps.map(s => s.milestone)
  const isGraphWidget = GRAPH_WIDGETS.includes(step.widgetType)
  const subject       = getSubject(topic.subjectId)
  const subjectColor  = subject?.color    ?? '#6366f1'
  const subjectGrad   = subject?.gradient ?? 'linear-gradient(135deg,#4f46e5,#7c3aed)'

  useEffect(() => { voiceService.init() }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Voice ─────────────────────────────────────────────────────────────────
  const handleSpeechEnd = useCallback(() => {
    if (msgTimerRef.current) { window.clearTimeout(msgTimerRef.current); msgTimerRef.current = null }
    setMessage(null)
    setCharState('idle')
  }, [])

  const speak = useCallback((text: string, charSt: CharacterState = 'speaking', interrupts = true) => {
    if (msgTimerRef.current) window.clearTimeout(msgTimerRef.current)
    setSpeakInterrupts(interrupts)
    setCharState(charSt)
    setMessage(text)
    // Safety fallback in case browser doesn't fire onend
    msgTimerRef.current = window.setTimeout(() => {
      setMessage(null)
      setCharState('idle')
    }, Math.max(7000, text.length * 80))
  }, [])

  // ── Divider resize ────────────────────────────────────────────────────────
  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dividerDragX.current = e.clientX
    dividerDragW.current = rightW
    setDividerDragging(true)

    const onMove = (mv: MouseEvent) => {
      const dx = dividerDragX.current - mv.clientX   // drag left → right panel grows
      const next = Math.max(RIGHT_PANEL_MIN, Math.min(RIGHT_PANEL_MAX, dividerDragW.current + dx))
      setRightW(next)
    }
    const onUp = () => {
      setDividerDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [rightW])

  // ── Companion queries ─────────────────────────────────────────────────────
  const moveCharToward = useCallback((annotation: DrawAnnotation) => {
    const gr = step.widgetConfig.gridRange
    const xPct = 50 + (annotation.target.x / gr) * 30
    const yPct = 50 - (annotation.target.y / gr) * 30
    setCharState('moving')
    setCharPos({ x: Math.max(8, Math.min(88, xPct)), y: Math.max(8, Math.min(88, yPct)) })
    setTimeout(() => setCharPos(INITIAL_CHAR_POS), 3500)
  }, [step])

  const askCompanion = useCallback(async (trigger: 'widget_change' | 'check' | 'session_start') => {
    if (trigger === 'widget_change') setCharState('thinking')
    const resp = await queryLearningCompanion(topic, step, widgetState, trigger, hintsUsed)

    if (resp.annotations.length > 0 && isGraphWidget) {
      moveCharToward(resp.annotations[0])
      setTimeout(() => setAnnotations(resp.annotations), 700)
    } else {
      setAnnotations([])
    }

    // widget_change = low priority (don't cut off existing speech)
    // check / session_start = high priority (always speak)
    const interrupts = trigger !== 'widget_change'
    speak(resp.response_text, resp.is_correct ? 'celebrating' : 'speaking', interrupts)

    if (resp.advance_step) {
      const next = stepIndex + 1
      setProgress(next / topic.steps.length)
      setStepsComplete(prev => [...prev, stepIndex])
      if (next >= topic.steps.length) {
        setTimeout(() => setShowSummary(true), 2500)
      } else {
        setTimeout(() => { setStepIndex(next); setCharState('idle') }, 2000)
      }
    }
  }, [topic, step, widgetState, hintsUsed, stepIndex, speak, moveCharToward, isGraphWidget])

  useEffect(() => {
    setWidgetState(getFirstState(step))
    setAnnotations([])
    setCharPos(INITIAL_CHAR_POS)
    askCompanion('session_start')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex])

  const handleWidgetChange = useCallback((state: WidgetState) => {
    setWidgetState(state)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => askCompanion('widget_change'), 1400)
  }, [askCompanion])

  const handleCheck = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setHintsUsed(p => p + 1)
    askCompanion('check')
  }

  const handleHint = () => {
    const idx = Math.min(hintsUsed, step.hints.length - 1)
    speak(step.hints[idx] ?? "Keep going — you're nearly there!", 'speaking', true)
    setHintsUsed(p => p + 1)
  }

  // ── Chat ──────────────────────────────────────────────────────────────────
  const sendChat = useCallback(async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    setChatInput('')
    setChatMsgs(prev => [...prev, { role: 'student', text, id: nextId() }])
    setChatLoading(true)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)

    const result = await chatWithCompanion(topic, step, widgetState, text)
    setChatLoading(false)
    setChatMsgs(prev => [...prev, { role: 'compass', text: result.text, id: nextId() }])
    speak(result.text, 'speaking', true)
    if (result.annotations.length > 0 && isGraphWidget) setAnnotations(result.annotations)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
  }, [chatInput, chatLoading, topic, step, widgetState, speak, isGraphWidget])

  const handleChatKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() }
  }

  // ── Shared card style ─────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 18,
  }
  const accentCard: React.CSSProperties = {
    ...card,
    border: `1.5px solid ${subjectColor}35`,
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#07091A', overflow: isMobile ? 'auto' : 'hidden', color: 'rgba(255,255,255,0.88)', fontFamily: "'Inter', system-ui, sans-serif", cursor: dividerDragging ? 'col-resize' : 'default' }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 52, background: subjectGrad, boxShadow: `0 2px 28px ${subjectColor}55` }}>
        <button onClick={onExit} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ← {subject?.label ?? 'Learn'}
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>{topic.title}</p>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{step.title} · Step {stepIndex + 1}/{topic.steps.length}</p>
        </div>
        <button onClick={() => setMuted(v => !v)} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 20, padding: '4px 10px', cursor: 'pointer' }}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0 }}>
        <ProgressBar progress={progress} milestones={milestones} currentStep={stepIndex} />
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row', padding: '0 10px 10px', gap: 0, overflow: isMobile ? 'visible' : 'hidden' }}>

        {/* ── Widget column ──────────────────────────────────────────────── */}
        <div style={{ flex: isMobile ? 'none' : 1, height: isMobile ? 'clamp(240px, 55vw, 380px)' : undefined, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8, paddingRight: isMobile ? 0 : 6 }}>
          {/* Instruction */}
          <div style={{ flexShrink: 0, ...accentCard, padding: '11px 16px', background: `${subjectColor}0a` }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.88)', lineHeight: 1.45 }}>{step.instruction}</p>
          </div>

          {/* Widget area */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative', ...accentCard, overflow: 'hidden' }}>
            <WidgetRenderer step={step} widgetState={widgetState} onChange={handleWidgetChange} onSizeChange={(w, h) => setWidgetSize({ w, h })} />
            {isGraphWidget && <DrawOverlay annotations={annotations} gridRange={step.widgetConfig.gridRange} width={widgetSize.w} height={widgetSize.h} />}
            <CompassCharacter
              state={charState}
              message={message}
              position={charPos}
              muted={muted}
              onToggleMute={() => setMuted(v => !v)}
              onSpeechEnd={handleSpeechEnd}
              speakInterrupts={speakInterrupts}
            />
          </div>
        </div>

        {/* ── Drag divider (desktop only) ─────────────────────────────── */}
        <div
          onMouseDown={onDividerMouseDown}
          onMouseEnter={() => setDividerHovered(true)}
          onMouseLeave={() => setDividerHovered(false)}
          style={{
            width: 20, flexShrink: 0, display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'col-resize', zIndex: 10, position: 'relative',
          }}
          title="Drag to resize panels"
        >
          {/* Visual handle */}
          <div style={{
            width: dividerHovered || dividerDragging ? 5 : 3,
            height: dividerHovered || dividerDragging ? '55%' : '40%',
            background: dividerDragging
              ? subjectColor
              : dividerHovered
                ? `${subjectColor}90`
                : 'rgba(255,255,255,0.1)',
            borderRadius: 4,
            transition: dividerDragging ? 'none' : 'all 0.18s ease',
            boxShadow: dividerDragging ? `0 0 14px ${subjectColor}70` : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Center arrows icon */}
            {(dividerHovered || dividerDragging) && (
              <div style={{
                position: 'absolute',
                width: 22, height: 22,
                background: dividerDragging ? subjectColor : `${subjectColor}cc`,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 12px ${subjectColor}60`,
                fontSize: 10,
                color: 'white',
                fontWeight: 700,
                userSelect: 'none',
              }}>
                ↔
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────────────── */}
        <div style={{ width: isMobile ? '100%' : rightW, minWidth: isMobile ? '100%' : rightW, maxWidth: isMobile ? '100%' : rightW, flexShrink: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: isMobile ? 0 : 6, overflow: isMobile ? 'visible' : 'hidden' }}>

          {/* Equation card */}
          {step.equation && (
            <div style={{ flexShrink: 0, ...card, padding: '10px 14px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: subjectColor }}>
                {subject?.icon} Formula
              </p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontFamily: 'Georgia, serif', lineHeight: 1.4 }}>
                {step.equation}
              </p>
            </div>
          )}

          {/* Check + Hint — side by side on mobile */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={handleCheck} style={{ flex: 1, padding: '12px 0', borderRadius: 14, background: subjectGrad, border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 20px ${subjectColor}45`, letterSpacing: '0.01em' }}>
              ✓ Check
            </button>
            <button onClick={handleHint} style={{ flex: 1, padding: '10px 0', borderRadius: 14, background: `${subjectColor}10`, border: `1px solid ${subjectColor}40`, color: subjectColor, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              💡 Hint
            </button>
          </div>

          {/* Milestone */}
          <div style={{ flexShrink: 0, ...card, padding: '10px 14px' }}>
            <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: subjectColor }}>Goal</p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>{step.milestone}</p>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
              Hints: <span style={{ color: subjectColor, fontWeight: 700 }}>{hintsUsed}</span>
            </p>
          </div>

          {/* ── Chat panel ───────────────────────────────────────────────── */}
          <div style={{ flex: isMobile ? 'none' : 1, height: isMobile ? 300 : undefined, minHeight: 0, display: 'flex', flexDirection: 'column', ...card, overflow: 'hidden' }}>
            {/* Chat header */}
            <div style={{ flexShrink: 0, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: subjectColor, boxShadow: `0 0 10px ${subjectColor}` }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Chat</span>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, minHeight: 0, height: isMobile ? 200 : undefined, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'thin', scrollbarColor: `${subjectColor}30 transparent` }}>
              {chatMsgs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                  <p style={{ margin: '0 0 5px', fontSize: 18 }}>💬</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.28)', lineHeight: 1.5 }}>Ask Compass anything about this topic</p>
                </div>
              )}
              {chatMsgs.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'student' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '86%', padding: '8px 11px',
                    borderRadius: msg.role === 'student' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                    fontSize: 12, lineHeight: 1.5,
                    ...(msg.role === 'student'
                      ? { background: `${subjectColor}22`, color: 'rgba(255,255,255,0.88)', border: `1px solid ${subjectColor}30` }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.07)' }
                    ),
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: '14px 14px 14px 3px', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <TypingDots color={subjectColor} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ flexShrink: 0, padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 7, alignItems: 'flex-end' }}>
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleChatKey}
                placeholder="Ask Compass…"
                rows={1}
                style={{
                  flex: 1, resize: 'none', background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${chatInput ? subjectColor + '55' : 'rgba(255,255,255,0.09)'}`,
                  borderRadius: 10, padding: '7px 10px', fontSize: 12,
                  color: 'rgba(255,255,255,0.85)', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.4, transition: 'border-color 0.2s',
                  maxHeight: 80, overflowY: 'auto',
                }}
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || chatLoading}
                style={{
                  flexShrink: 0, width: 34, height: 34, borderRadius: 10,
                  background: chatInput.trim() && !chatLoading ? subjectGrad : 'rgba(255,255,255,0.07)',
                  border: 'none', color: 'white', cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'default',
                  fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
              >↑</button>
            </div>
          </div>
        </div>
      </div>

      {showSummary && (
        <SessionSummary
          topicTitle={topic.title}
          subjectName={subject?.label ?? topic.subjectId}
          subjectColor={subjectColor}
          subjectGradient={subjectGrad}
          milestones={topic.steps.map(s => s.milestone)}
          stepsCompleted={stepsComplete.length}
          totalSteps={topic.steps.length}
          hintsUsed={hintsUsed}
          annotationsUsed={0}
          durationMs={Date.now() - startTime.current}
          onContinue={onExit}
        />
      )}
    </div>
  )
}

// ── Typing dots ───────────────────────────────────────────────────────────────

function TypingDots({ color }: { color: string }) {
  return (
    <svg width={28} height={12} viewBox="0 0 28 12">
      {[0, 10, 20].map((cx, i) => (
        <circle key={i} cx={cx + 4} cy={6} r={3} fill={color} opacity={0.7}>
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  )
}

// ── Widget renderer ───────────────────────────────────────────────────────────

interface RendererProps {
  step: LearningTopic['steps'][0]
  widgetState: WidgetState
  onChange: (s: WidgetState) => void
  onSizeChange: (w: number, h: number) => void
}

function WidgetRenderer({ step, widgetState, onChange, onSizeChange }: RendererProps) {
  const cfg = step.widgetConfig
  const eq  = step.equation
  switch (step.widgetType) {
    case 'circle-graph':
      return <CircleGraphWidget gridRange={cfg.gridRange} equation={eq} value={widgetState as CircleWidgetState} onChange={s => onChange(s)} onSizeChange={onSizeChange} />
    case 'linear-graph':
      return <LinearGraphWidget gridRange={cfg.gridRange} equation={eq} value={widgetState as LinearWidgetState} onChange={s => onChange(s)} onSizeChange={onSizeChange} />
    case 'quadratic-graph':
      return <QuadraticGraphWidget gridRange={cfg.gridRange} equation={eq} value={widgetState as QuadraticWidgetState} onChange={s => onChange(s)} onSizeChange={onSizeChange} />
    case 'angle':
      return <AngleWidget gridRange={cfg.gridRange} equation={eq} value={widgetState as AngleWidgetState} onChange={s => onChange(s)} onSizeChange={onSizeChange} />
    case 'pythagoras':
      return <PythagorasWidget gridRange={cfg.gridRange} equation={eq} value={widgetState as PythagorasWidgetState} onChange={s => onChange(s)} onSizeChange={onSizeChange} />
    case 'number-line':
      return (
        <NumberLineWidget
          gridRange={cfg.gridRange}
          min={cfg.min as number | undefined}
          max={cfg.max as number | undefined}
          unit={cfg.unit as string | undefined}
          zones={cfg.zones as Parameters<typeof NumberLineWidget>[0]['zones']}
          equation={eq}
          value={widgetState as NumberLineWidgetState}
          onChange={s => onChange(s)}
          onSizeChange={onSizeChange}
        />
      )
    case 'bar-chart':
      return (
        <BarChartWidget
          gridRange={cfg.gridRange}
          labels={cfg.labels as string[] | undefined}
          yMax={cfg.yMax as number | undefined}
          yLabel={cfg.yLabel as string | undefined}
          barColor={cfg.barColor as string | undefined}
          equation={eq}
          value={widgetState as BarChartWidgetState}
          onChange={s => onChange(s)}
          onSizeChange={onSizeChange}
        />
      )
    case 'process-diagram': {
      const diagramType = cfg.diagramType as string
      const pState = widgetState as ProcessDiagramWidgetState
      const pChange = (s: ProcessDiagramWidgetState) => onChange(s)
      if (diagramType === 'distillation') return <DistillationWidget value={pState} onChange={pChange} onSizeChange={onSizeChange} equation={eq} />
      if (diagramType === 'water-cycle') return <WaterCycleWidget value={pState} onChange={pChange} onSizeChange={onSizeChange} equation={eq} />
      if (diagramType === 'mining') return <MiningWidget value={pState} onChange={pChange} onSizeChange={onSizeChange} equation={eq} />
      if (diagramType === 'rock-cycle') return <RockCycleWidget value={pState} onChange={pChange} onSizeChange={onSizeChange} equation={eq} />
      return null
    }
  }
}
