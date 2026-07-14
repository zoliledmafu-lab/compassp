import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { X, Clock, AlertCircle, Loader, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useRules } from '../../../contexts/RulesContext'
import { useMemory } from '../../../contexts/MemoryContext'
import { buildSystemPrompt } from '../../../lib/ruleEngine'
import { streamCompletion } from '../../../lib/claudeApi'
import type { CanvasRFNode } from '../types'
import { SUBJECTS } from '../../../lib/subjects'

interface Props {
  nodes: CanvasRFNode[]
  subjectId: string
  onClose: () => void
}

type Phase = 'setup' | 'loading' | 'active' | 'submitting' | 'results'
type ExamMode = 'standard' | 'structured'

interface ExamQuestion {
  id: string
  section: 'A' | 'B' | 'C' | 'STD'
  question: string
  marks: number
}

interface StudentAnswer {
  questionId: string
  answer: string
}

interface ScoredAnswer {
  questionId: string
  score: number
  maxMarks: number
  feedback: string
}

const DURATIONS = [
  { label: '10 min',  seconds: 600 },
  { label: '20 min',  seconds: 1200 },
  { label: '30 min',  seconds: 1800 },
  { label: '45 min',  seconds: 2700 },
  { label: '1 hr',    seconds: 3600 },
  { label: '1.5 hr',  seconds: 5400 },
  { label: '2 hr',    seconds: 7200 },
  { label: '2.5 hr',  seconds: 9000 },
  { label: '3 hr',    seconds: 10800 },
]

const SECTION_META = {
  A: { color: 'indigo', label: 'Section A', desc: 'Short answer / MCQ', marksEach: 1 },
  B: { color: 'cyan',   label: 'Section B', desc: 'Structured questions', marksEach: 5 },
  C: { color: 'purple', label: 'Section C', desc: 'Essay / extended response', marksEach: 10 },
}

async function generateSection(
  sectionId: 'A' | 'B' | 'C',
  count: number,
  marks: number,
  subject: string,
  context: string,
  systemPrompt: string,
): Promise<ExamQuestion[]> {
  const typeDescriptions: Record<typeof sectionId, string> = {
    A: `${count} short-answer questions worth ${marks} mark each. Each should be answerable in 1-2 sentences. Focus on recall and understanding of facts, definitions, and basic concepts.`,
    B: `${count} structured questions worth ${marks} marks each. Each should require a detailed paragraph response covering analysis, application, or explanation.`,
    C: `${count} extended essay question${count > 1 ? 's' : ''} worth ${marks} marks each. Requires a well-structured, comprehensive response demonstrating deep understanding and evaluation.`,
  }

  const prompt = `You are generating ${sectionId === 'A' ? 'Section A' : sectionId === 'B' ? 'Section B' : 'Section C'} questions for a ${subject} exam.

Study material context:
${context.substring(0, 800)}

Generate exactly ${typeDescriptions[sectionId]}

Return ONLY a JSON array (no other text):
[
  {"id": "${sectionId.toLowerCase()}1", "question": "..."},
  ...
]`

  let raw = ''
  await streamCompletion(
    systemPrompt,
    [{ role: 'user', content: prompt }],
    chunk => { raw += chunk },
    () => {},
    () => {},
  )

  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    const parsed: Array<{ id: string; question: string }> = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    return parsed.slice(0, count).map((q, i) => ({
      id: q.id || `${sectionId.toLowerCase()}${i + 1}`,
      section: sectionId,
      question: q.question,
      marks,
    }))
  } catch {
    return []
  }
}

async function generateStandardQuestions(
  count: number,
  subject: string,
  context: string,
  systemPrompt: string,
): Promise<ExamQuestion[]> {
  const prompt = `Generate ${count} exam-style questions for ${subject}.

Study material:
${context.substring(0, 800)}

Mix difficulty: some recall, some analysis, some application.
Return ONLY a JSON array:
[{"id":"q1","question":"..."},...]`

  let raw = ''
  await streamCompletion(
    systemPrompt,
    [{ role: 'user', content: prompt }],
    chunk => { raw += chunk },
    () => {},
    () => {},
  )

  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    const parsed: Array<{ id: string; question: string }> = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    return parsed.slice(0, count).map((q, i) => ({
      id: q.id || `q${i + 1}`,
      section: 'STD' as const,
      question: q.question,
      marks: 3,
    }))
  } catch {
    return []
  }
}

export function ExamPanel({ nodes, subjectId, onClose }: Props) {
  const { user } = useAuth()
  const { rules } = useRules()
  const { getMemory } = useMemory()

  const [phase, setPhase] = useState<Phase>('setup')
  const [examMode, setExamMode] = useState<ExamMode>('standard')
  const [duration, setDuration] = useState(DURATIONS[2].seconds)
  const [questionCount, setQuestionCount] = useState(10)
  const [sectionCounts, setSectionCounts] = useState({ A: 10, B: 3, C: 1 })
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [answers, setAnswers] = useState<StudentAnswer[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [scores, setScores] = useState<ScoredAnswer[]>([])
  const [expandedFeedback, setExpandedFeedback] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [loadingStep, setLoadingStep] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const handleSubmitRef = useRef<() => void>(() => {})

  const subject = SUBJECTS.find(s => s.id === subjectId) || SUBJECTS[0]
  const memory = user ? getMemory(user.id, subjectId) : null
  const systemPrompt = buildSystemPrompt(rules, subject, memory, 0)

  const contextText = nodes
    .filter(n => n.type === 'text')
    .map(n => (n.data as any).content || '')
    .join('\n')

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

    try {
      let qs: ExamQuestion[] = []

      if (examMode === 'standard') {
        setLoadingStep('Generating questions…')
        qs = await generateStandardQuestions(questionCount, subject.name, contextText, systemPrompt)
      } else {
        setLoadingStep('Generating Section A (short answer)…')
        const secA = await generateSection('A', sectionCounts.A, SECTION_META.A.marksEach, subject.name, contextText, systemPrompt)
        setLoadingStep('Generating Section B (structured)…')
        const secB = await generateSection('B', sectionCounts.B, SECTION_META.B.marksEach, subject.name, contextText, systemPrompt)
        setLoadingStep('Generating Section C (essay)…')
        const secC = await generateSection('C', sectionCounts.C, SECTION_META.C.marksEach, subject.name, contextText, systemPrompt)
        qs = [...secA, ...secB, ...secC]
      }

      if (qs.length === 0) throw new Error('No questions generated')

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

    const scored: ScoredAnswer[] = []

    for (const q of questions) {
      const studentAnswer = answers.find(a => a.questionId === q.id)?.answer || '(no answer)'
      const sectionLabel = q.section !== 'STD' ? SECTION_META[q.section].desc : 'exam'
      const scoringPrompt = systemPrompt + '\n\nYou are scoring an exam question. Be strict and objective.'
      let text = ''
      await streamCompletion(
        scoringPrompt,
        [{
          role: 'user',
          content: `Context:\n${contextText.substring(0, 400)}\n\nQuestion type: ${sectionLabel}\nMarks available: ${q.marks}\n\nQuestion: ${q.question}\n\nStudent answer: ${studentAnswer}\n\nScore out of ${q.marks} and give brief honest feedback.\nFormat:\nSCORE: X/${q.marks}\nFEEDBACK: ...`,
        }],
        chunk => { text += chunk },
        () => {},
        () => {},
      )
      const scoreMatch = text.match(/SCORE:\s*(\d+)/i)
      const feedbackMatch = text.match(/FEEDBACK:\s*([\s\S]+)/i)
      scored.push({
        questionId: q.id,
        score: scoreMatch ? Math.min(parseInt(scoreMatch[1]), q.marks) : 0,
        maxMarks: q.marks,
        feedback: feedbackMatch ? feedbackMatch[1].trim() : text.trim(),
      })
    }
    setScores(scored)
    setPhase('results')
  }, [answers, questions, contextText, systemPrompt]) // eslint-disable-line

  handleSubmitRef.current = handleSubmit

  const totalScore = scores.reduce((a, s) => a + s.score, 0)
  const maxScore = questions.reduce((a, q) => a + q.marks, 0)
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
  }

  // Group questions by section for display
  const sectionGroups = questions.reduce<Record<string, ExamQuestion[]>>((acc, q) => {
    const key = q.section
    if (!acc[key]) acc[key] = []
    acc[key].push(q)
    return acc
  }, {})

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
                <li>• Timer auto-submits when it reaches zero</li>
                <li>• Compass scores each answer with detailed feedback</li>
              </ul>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-xs glass rounded-xl p-3 border border-red-500/20">
                <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            {/* Exam mode */}
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium">Exam Mode</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExamMode('standard')}
                  className={`py-3 px-3 rounded-xl text-xs text-left border transition-all ${examMode === 'standard' ? 'border-cyan-500 bg-cyan-500/15 text-white' : 'border-white/10 text-slate-400 hover:border-white/20'}`}
                >
                  <div className="font-semibold mb-0.5">Standard</div>
                  <div className="text-slate-500">Flat question list</div>
                </button>
                <button
                  onClick={() => setExamMode('structured')}
                  className={`py-3 px-3 rounded-xl text-xs text-left border transition-all ${examMode === 'structured' ? 'border-indigo-500 bg-indigo-500/15 text-white' : 'border-white/10 text-slate-400 hover:border-white/20'}`}
                >
                  <div className="font-semibold mb-0.5">Structured</div>
                  <div className="text-slate-500">Sections A · B · C</div>
                </button>
              </div>
            </div>

            {/* Duration */}
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium">Duration</p>
              <div className="grid grid-cols-3 gap-1.5">
                {DURATIONS.map(d => (
                  <button
                    key={d.seconds}
                    onClick={() => setDuration(d.seconds)}
                    className={`py-2 rounded-xl text-xs border transition-all ${duration === d.seconds ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300' : 'border-white/10 text-slate-400 hover:border-white/20'}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Standard: question count */}
            {examMode === 'standard' && (
              <div>
                <p className="text-xs text-slate-400 mb-2 font-medium">Questions ({questionCount})</p>
                <input
                  type="range" min={3} max={30} value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>3</span><span>30</span>
                </div>
              </div>
            )}

            {/* Structured: section counts */}
            {examMode === 'structured' && (
              <div className="space-y-3">
                {(['A', 'B', 'C'] as const).map(sec => {
                  const meta = SECTION_META[sec]
                  const maxCounts = { A: 20, B: 8, C: 3 }
                  const minCounts = { A: 3, B: 1, C: 1 }
                  return (
                    <div key={sec} className={`glass rounded-xl p-3 border border-${meta.color}-500/20`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className={`text-xs font-semibold text-${meta.color}-400`}>{meta.label}</span>
                          <span className="text-xs text-slate-500 ml-1.5">{meta.desc} · {meta.marksEach} mark{meta.marksEach > 1 ? 's' : ''} each</span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{sectionCounts[sec]} Q · {sectionCounts[sec] * meta.marksEach} marks</span>
                      </div>
                      <input
                        type="range"
                        min={minCounts[sec]} max={maxCounts[sec]}
                        value={sectionCounts[sec]}
                        onChange={e => setSectionCounts(s => ({ ...s, [sec]: Number(e.target.value) }))}
                        className={`w-full accent-${meta.color}-500`}
                      />
                    </div>
                  )
                })}
                <div className="text-xs text-slate-500 text-right">
                  Total: {sectionCounts.A * 1 + sectionCounts.B * 5 + sectionCounts.C * 10} marks
                </div>
              </div>
            )}

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
            <p className="text-sm text-slate-400">{loadingStep}</p>
          </div>
        )}

        {/* Active exam */}
        {phase === 'active' && questions[currentIdx] && (
          <>
            {/* Question nav */}
            <div className="flex gap-1.5 flex-wrap">
              {questions.map((q, i) => {
                const sectionColor = q.section !== 'STD' ? { A: 'indigo', B: 'cyan', C: 'purple' }[q.section] : 'slate'
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(i)}
                    title={q.section !== 'STD' ? `Section ${q.section}` : undefined}
                    className={`w-7 h-7 rounded-lg text-[10px] font-semibold transition-all ${
                      i === currentIdx ? 'gradient-primary text-white' :
                      answers[i]?.answer ? `bg-${sectionColor}-500/20 text-${sectionColor}-400 border border-${sectionColor}-500/30` :
                      'glass text-slate-500'
                    }`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>

            {/* Section header if structured */}
            {questions[currentIdx].section !== 'STD' && (() => {
              const sec = questions[currentIdx].section as 'A' | 'B' | 'C'
              const meta = SECTION_META[sec]
              return (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-${meta.color}-500/10 border border-${meta.color}-500/20`}>
                  <span className={`text-xs font-semibold text-${meta.color}-400`}>{meta.label}</span>
                  <span className="text-xs text-slate-500">{meta.desc}</span>
                  <span className={`ml-auto text-xs text-${meta.color}-400`}>{questions[currentIdx].marks} mark{questions[currentIdx].marks > 1 ? 's' : ''}</span>
                </div>
              )
            })()}

            <div className="glass rounded-2xl p-4">
              <p className="text-xs text-slate-500 mb-2">Question {currentIdx + 1} of {questions.length}</p>
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
                  ← Prev
                </button>
              )}
              {currentIdx < questions.length - 1 ? (
                <button onClick={() => setCurrentIdx(i => i + 1)} className="flex-1 py-2 gradient-primary rounded-xl text-sm font-medium text-white">
                  Next →
                </button>
              ) : (
                <button onClick={handleSubmit} className="flex-1 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-sm font-semibold text-green-400 hover:bg-green-500/30 transition-all">
                  <Send size={14} className="inline mr-1.5" />Submit
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
            {/* Overall score */}
            <div className="glass rounded-2xl p-5 text-center border border-indigo-500/20">
              <p className="text-4xl font-bold text-gradient">{pct}%</p>
              <p className="text-sm text-slate-400 mt-1">{totalScore} / {maxScore} marks</p>
              <p className="text-xs text-slate-500 mt-3">
                {pct >= 80 ? 'Strong performance. Review the feedback to confirm your understanding.' : pct >= 60 ? 'Good effort. Review the feedback below to identify gaps.' : 'Keep practising — focus on the areas flagged below.'}
              </p>
            </div>

            {/* Section breakdown for structured exam */}
            {examMode === 'structured' && (
              <div className="grid grid-cols-3 gap-2">
                {(['A', 'B', 'C'] as const).map(sec => {
                  const meta = SECTION_META[sec]
                  const secQs = questions.filter(q => q.section === sec)
                  const secScores = scores.filter(s => secQs.some(q => q.id === s.questionId))
                  const secTotal = secScores.reduce((a, s) => a + s.score, 0)
                  const secMax = secQs.reduce((a, q) => a + q.marks, 0)
                  return (
                    <div key={sec} className={`glass rounded-xl p-3 text-center border border-${meta.color}-500/20`}>
                      <p className={`text-xs font-semibold text-${meta.color}-400`}>{meta.label}</p>
                      <p className="text-lg font-bold text-white mt-1">{secTotal}/{secMax}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Per-question results, grouped by section */}
            {Object.entries(sectionGroups).map(([sec, qs]) => (
              <div key={sec}>
                {sec !== 'STD' && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg mb-2 bg-${SECTION_META[sec as 'A' | 'B' | 'C'].color}-500/10`}>
                    <span className={`text-xs font-semibold text-${SECTION_META[sec as 'A' | 'B' | 'C'].color}-400`}>{SECTION_META[sec as 'A' | 'B' | 'C'].label}</span>
                    <span className="text-xs text-slate-500">{SECTION_META[sec as 'A' | 'B' | 'C'].desc}</span>
                  </div>
                )}
                {qs.map(q => {
                  const scored = scores.find(s => s.questionId === q.id)
                  const studentAnswer = answers.find(a => a.questionId === q.id)?.answer || ''
                  const isExpanded = expandedFeedback[q.id]
                  const ratio = (scored?.score || 0) / q.marks
                  const scoreColor = ratio >= 0.67 ? 'text-green-400' : ratio >= 0.34 ? 'text-amber-400' : 'text-red-400'

                  return (
                    <div key={q.id} className="glass rounded-2xl overflow-hidden mb-2">
                      <button
                        onClick={() => setExpandedFeedback(e => ({ ...e, [q.id]: !isExpanded }))}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
                      >
                        <span className={`text-sm font-bold shrink-0 ${scoreColor}`}>{scored?.score ?? '?'}/{q.marks}</span>
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
              </div>
            ))}

            <button onClick={onClose} className="py-2.5 glass rounded-xl text-sm text-slate-300 hover:text-white transition-all">
              Back to canvas
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
