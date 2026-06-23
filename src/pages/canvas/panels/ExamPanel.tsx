import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { X, Clock, AlertCircle, Loader, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useRules } from '../../../contexts/RulesContext'
import { useMemory } from '../../../contexts/MemoryContext'
import { buildSystemPrompt } from '../../../lib/ruleEngine'
import { generateQuizQuestions, streamCompletion } from '../../../lib/claudeApi'
import type { CanvasRFNode } from '../types'
import type { QuizQuestion, CanvasContentItem } from '../../../lib/claudeApi'
import { SUBJECTS } from '../../../lib/subjects'

interface Props {
  nodes: CanvasRFNode[]
  subjectId: string
  onClose: () => void
}

type Phase = 'setup' | 'loading' | 'active' | 'submitting' | 'results'

interface StudentAnswer {
  questionId: string
  answer: string
}

interface ScoredAnswer {
  questionId: string
  score: number   // 0-3
  feedback: string
}

const DURATIONS = [
  { label: '10 min', seconds: 600 },
  { label: '20 min', seconds: 1200 },
  { label: '30 min', seconds: 1800 },
  { label: '45 min', seconds: 2700 },
]

export function ExamPanel({ nodes, subjectId, onClose }: Props) {
  const { user } = useAuth()
  const { rules } = useRules()
  const { getMemory } = useMemory()

  const [phase, setPhase] = useState<Phase>('setup')
  const [duration, setDuration] = useState(DURATIONS[1].seconds)
  const [questionCount, setQuestionCount] = useState(5)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<StudentAnswer[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [scores, setScores] = useState<ScoredAnswer[]>([])
  const [expandedFeedback, setExpandedFeedback] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Keep a ref to handleSubmit so the timer always calls the latest version (avoids stale closure)
  const handleSubmitRef = useRef<() => void>(() => {})

  const subject = SUBJECTS.find(s => s.id === subjectId) || SUBJECTS[0]
  const memory = user ? getMemory(user.id, subjectId) : null
  const systemPrompt = buildSystemPrompt(rules, subject, memory, 0)

  // Timer
  useEffect(() => {
    if (phase !== 'active') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); handleSubmitRef.current(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase]) // eslint-disable-line

  const startExam = async () => {
    setPhase('loading')
    setError('')

    const items: CanvasContentItem[] = nodes
      .filter(n => n.type === 'text' || n.type === 'image')
      .map(n => {
        if (n.type === 'text') return { type: 'text' as const, content: (n.data as any).content || '' }
        return { type: 'image' as const, src: (n.data as any).src || '', caption: (n.data as any).caption || '' }
      })
      .filter(i => (i.type === 'text' && i.content) || (i.type === 'image' && i.src && i.src !== '__uploading__'))

    try {
      const qs = await generateQuizQuestions(items, questionCount, systemPrompt)
      setQuestions(qs)
      setAnswers(qs.map(q => ({ questionId: q.id, answer: '' })))
      setTimeLeft(duration)
      setCurrentIdx(0)
      setPhase('active')
    } catch {
      setError('Could not generate exam questions. Try adding more content to the canvas.')
      setPhase('setup')
    }
  }

  const handleSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase('submitting')
    // eslint-disable-next-line react-hooks/exhaustive-deps

    const contextText = nodes.filter(n => n.type === 'text').map(n => (n.data as any).content || '').join('\n')
    const scored: ScoredAnswer[] = []
    const feedbackSystemPrompt = systemPrompt + '\n\nYou are scoring an EXAM (not a guided tutoring session). Give a score out of 3 and brief, honest feedback. Format: SCORE: X\nFEEDBACK: ...'

    for (const q of questions) {
      const studentAnswer = answers.find(a => a.questionId === q.id)?.answer || '(no answer)'
      let text = ''
      await streamCompletion(
        feedbackSystemPrompt,
        [{
          role: 'user',
          content: `Canvas context:\n${contextText.substring(0, 600)}\n\nQuestion: ${q.question}\n\nStudent answer: ${studentAnswer}\n\nScore out of 3 and give brief feedback (1-2 sentences). Format:\nSCORE: X\nFEEDBACK: ...`,
        }],
        chunk => { text += chunk },
        () => {},
        () => {},
      )
      const scoreMatch = text.match(/SCORE:\s*([0-3])/i)
      const feedbackMatch = text.match(/FEEDBACK:\s*(.+)/is)
      scored.push({
        questionId: q.id,
        score: scoreMatch ? parseInt(scoreMatch[1]) : 1,
        feedback: feedbackMatch ? feedbackMatch[1].trim() : text.trim(),
      })
    }
    setScores(scored)
    setPhase('results')
  }, [answers, questions, nodes, systemPrompt]) // eslint-disable-line

  // Keep ref in sync so the timer interval always calls the latest handleSubmit
  handleSubmitRef.current = handleSubmit

  const totalScore = scores.reduce((a, s) => a + s.score, 0)
  const maxScore = questions.length * 3
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0 ${phase === 'active' ? 'bg-red-500/5' : ''}`}>
        <Clock size={16} className={phase === 'active' && timeLeft < 120 ? 'text-red-400 animate-pulse' : 'text-cyan-400'} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Exam Simulation</p>
          {phase === 'active' && (
            <p className={`text-xs font-mono font-bold ${timeLeft < 120 ? 'text-red-400' : 'text-cyan-400'}`}>
              {formatTime(timeLeft)} remaining
            </p>
          )}
        </div>
        {phase !== 'active' && (
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">

        {/* Setup */}
        {phase === 'setup' && (
          <div className="flex flex-col gap-5">
            <div className="glass rounded-2xl p-4 border border-cyan-500/20">
              <p className="text-sm font-semibold text-white mb-1">Exam conditions</p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• No hints or feedback until you submit</li>
                <li>• Timer counts down — when it hits zero, your answers are auto-submitted</li>
                <li>• Compass scores each answer and gives a final report</li>
              </ul>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-xs glass rounded-xl p-3 border border-red-500/20">
                <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium">Duration</p>
              <div className="grid grid-cols-2 gap-2">
                {DURATIONS.map(d => (
                  <button
                    key={d.seconds}
                    onClick={() => setDuration(d.seconds)}
                    className={`py-2 rounded-xl text-sm border transition-all ${duration === d.seconds ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300' : 'border-white/10 text-slate-400 hover:border-white/20'}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium">Questions ({questionCount})</p>
              <input
                type="range" min={3} max={10} value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <button
              onClick={startExam}
              className="px-5 py-3 gradient-primary rounded-xl text-sm font-semibold text-white"
            >
              Start Exam
            </button>
          </div>
        )}

        {/* Loading */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader size={28} className="animate-spin text-cyan-400" />
            <p className="text-sm text-slate-400">Generating {questionCount} exam questions…</p>
          </div>
        )}

        {/* Active exam */}
        {phase === 'active' && questions[currentIdx] && (
          <>
            {/* Question nav */}
            <div className="flex gap-1.5 flex-wrap">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                    i === currentIdx ? 'gradient-primary text-white' :
                    answers[i]?.answer ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'glass text-slate-400'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="glass rounded-2xl p-4">
              <p className="text-xs text-slate-500 mb-2">Question {currentIdx + 1}</p>
              <p className="text-sm text-white font-medium leading-relaxed">{questions[currentIdx].question}</p>
            </div>

            <textarea
              value={answers[currentIdx]?.answer || ''}
              onChange={e => {
                const updated = [...answers]
                updated[currentIdx] = { ...updated[currentIdx], answer: e.target.value }
                setAnswers(updated)
              }}
              placeholder="Write your answer here…"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-cyan-500/50 h-36"
            />

            <div className="flex gap-2">
              {currentIdx > 0 && (
                <button onClick={() => setCurrentIdx(i => i - 1)} className="flex-1 py-2 glass rounded-xl text-sm text-slate-300 hover:text-white transition-all">
                  ← Previous
                </button>
              )}
              {currentIdx < questions.length - 1 ? (
                <button onClick={() => setCurrentIdx(i => i + 1)} className="flex-1 py-2 gradient-primary rounded-xl text-sm font-medium text-white">
                  Next →
                </button>
              ) : (
                <button onClick={handleSubmit} className="flex-1 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-sm font-semibold text-green-400 hover:bg-green-500/30 transition-all">
                  <Send size={14} className="inline mr-1.5" />Submit Exam
                </button>
              )}
            </div>
          </>
        )}

        {/* Submitting */}
        {phase === 'submitting' && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader size={28} className="animate-spin text-indigo-400" />
            <p className="text-sm text-slate-400">Marking your exam…</p>
          </div>
        )}

        {/* Results */}
        {phase === 'results' && (
          <div className="flex flex-col gap-5">
            {/* Score */}
            <div className="glass rounded-2xl p-5 text-center border border-indigo-500/20">
              <p className="text-4xl font-bold text-gradient">{pct}%</p>
              <p className="text-sm text-slate-400 mt-1">{totalScore} / {maxScore} points</p>
              <p className="text-xs text-slate-500 mt-3">
                {pct >= 80 ? '🌟 Excellent work!' : pct >= 60 ? '👍 Good effort — review the feedback below.' : '📚 Keep practising — the feedback below shows where to focus.'}
              </p>
            </div>

            {/* Per-question results */}
            {questions.map((q) => {
              const scored = scores.find(s => s.questionId === q.id)
              const studentAnswer = answers.find(a => a.questionId === q.id)?.answer || ''
              const isExpanded = expandedFeedback[q.id]
              const scoreColor = (scored?.score || 0) >= 2 ? 'text-green-400' : (scored?.score || 0) === 1 ? 'text-amber-400' : 'text-red-400'

              return (
                <div key={q.id} className="glass rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFeedback(e => ({ ...e, [q.id]: !isExpanded }))}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
                  >
                    <span className={`text-sm font-bold ${scoreColor}`}>{scored?.score ?? '?'}/3</span>
                    <p className="flex-1 text-sm text-slate-300 line-clamp-1">{q.question}</p>
                    {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Your answer:</p>
                        <p className="text-xs text-slate-300 italic">{studentAnswer || '(no answer given)'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-indigo-400 mb-1">Compass feedback:</p>
                        <div className="prose prose-invert prose-xs max-w-none text-slate-300">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{scored?.feedback || ''}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <button onClick={onClose} className="py-2.5 glass rounded-xl text-sm text-slate-300 hover:text-white transition-all">
              Back to canvas
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
