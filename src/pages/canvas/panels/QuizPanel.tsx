import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { X, Sparkles, Loader, ChevronRight, RotateCcw } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useRules } from '../../../contexts/RulesContext'
import { useMemory } from '../../../contexts/MemoryContext'
import { buildSystemPrompt } from '../../../lib/ruleEngine'
import { generateQuizQuestions, evaluateAnswer } from '../../../lib/claudeApi'
import type { CanvasRFNode } from '../types'
import type { QuizQuestion, CanvasContentItem } from '../../../lib/claudeApi'
import { SUBJECTS } from '../../../lib/subjects'

interface Props {
  nodes: CanvasRFNode[]
  subjectId: string
  onClose: () => void
}

type Phase = 'generating' | 'question' | 'feedback' | 'done'

export function QuizPanel({ nodes, subjectId, onClose }: Props) {
  const { user } = useAuth()
  const { rules } = useRules()
  const { getMemory } = useMemory()

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [phase, setPhase] = useState<Phase>('generating')
  const [error, setError] = useState('')

  const subject = SUBJECTS.find(s => s.id === subjectId) || SUBJECTS[0]
  const memory = user ? getMemory(user.id, subjectId) : null
  const systemPrompt = buildSystemPrompt(rules, subject, memory, 0)

  useEffect(() => {
    const items: CanvasContentItem[] = nodes
      .filter(n => n.type === 'text' || n.type === 'image')
      .map(n => {
        if (n.type === 'text') return { type: 'text' as const, content: (n.data as any).content || '' }
        return { type: 'image' as const, src: (n.data as any).src || '', caption: (n.data as any).caption || (n.data as any).alt || '' }
      })
      .filter(i => (i.type === 'text' && i.content) || (i.type === 'image' && i.src && i.src !== '__uploading__'))

    if (items.length === 0) {
      setError('Add some text notes or images to the canvas first, then Quiz Me will generate questions from them.')
      setPhase('done')
      return
    }

    generateQuizQuestions(items, 5, systemPrompt)
      .then(qs => {
        if (qs.length === 0) throw new Error('no questions')
        setQuestions(qs)
        setPhase('question')
      })
      .catch(() => {
        setError('Could not generate questions. Try adding more content to your canvas.')
        setPhase('done')
      })
  }, []) // eslint-disable-line

  const submitAnswer = async () => {
    if (!answer.trim()) return
    setPhase('feedback')
    setFeedback('')

    const contextText = nodes
      .filter(n => n.type === 'text')
      .map(n => (n.data as any).content || '')
      .join('\n')

    await evaluateAnswer(
      questions[currentIdx].question,
      answer,
      contextText,
      systemPrompt,
      chunk => setFeedback(f => f + chunk),
      () => {},
      err => setError(err),
    )
  }

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1)
      setAnswer('')
      setFeedback('')
      setPhase('question')
    } else {
      setPhase('done')
    }
  }

  const progress = questions.length > 0 ? ((currentIdx + (phase === 'done' ? 1 : 0)) / questions.length) * 100 : 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
        <Sparkles size={16} className="text-amber-400" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Quiz Me</p>
          {questions.length > 0 && phase !== 'generating' && (
            <p className="text-xs text-slate-500">Question {Math.min(currentIdx + 1, questions.length)} of {questions.length}</p>
          )}
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Progress bar */}
      {questions.length > 0 && (
        <div className="h-0.5 bg-white/5 shrink-0">
          <div className="h-0.5 bg-amber-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">

        {/* Generating */}
        {phase === 'generating' && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader size={28} className="animate-spin text-amber-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-white">Generating questions…</p>
              <p className="text-xs text-slate-400 mt-1">Analysing {nodes.filter(n => n.type !== 'branch').length} canvas items</p>
            </div>
          </div>
        )}

        {/* Question */}
        {phase === 'question' && questions[currentIdx] && (
          <>
            <div className="glass rounded-2xl p-4">
              <p className="text-sm font-medium text-white leading-relaxed">{questions[currentIdx].question}</p>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="text-amber-400">Hint:</span> {questions[currentIdx].hint}
              </p>
            </div>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Write your answer here…"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-amber-500/50 h-32"
            />
            <button
              onClick={submitAnswer}
              disabled={!answer.trim()}
              className="px-5 py-2.5 gradient-primary rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all self-start"
            >
              Submit Answer
            </button>
          </>
        )}

        {/* Feedback */}
        {phase === 'feedback' && (
          <>
            <div className="glass rounded-2xl p-4">
              <p className="text-xs text-slate-400 mb-2 font-medium">Your answer:</p>
              <p className="text-sm text-slate-300 italic">{answer}</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-amber-500/20">
              <p className="text-xs text-amber-400 mb-2 font-medium flex items-center gap-1">🧭 Compass feedback</p>
              {feedback ? (
                <div className="prose prose-invert prose-sm max-w-none text-slate-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader size={14} className="animate-spin" />
                  Thinking…
                </div>
              )}
            </div>
            {feedback && (
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-5 py-2.5 gradient-primary rounded-xl text-sm font-medium text-white self-start"
              >
                {currentIdx < questions.length - 1 ? <><ChevronRight size={16} /> Next question</> : <>Finish quiz</>}
              </button>
            )}
          </>
        )}

        {/* Done */}
        {phase === 'done' && (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-8">
            {error ? (
              <>
                <p className="text-4xl">😔</p>
                <p className="text-sm text-slate-400">{error}</p>
              </>
            ) : (
              <>
                <p className="text-5xl">🎉</p>
                <div>
                  <p className="text-lg font-bold text-white">Quiz complete!</p>
                  <p className="text-sm text-slate-400 mt-2 max-w-[240px]">
                    Great work working through {questions.length} questions. Review the feedback above to identify what to revise next.
                  </p>
                </div>
                <button
                  onClick={() => { setCurrentIdx(0); setAnswer(''); setFeedback(''); setPhase('question') }}
                  className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl text-sm font-medium text-white"
                >
                  <RotateCcw size={14} /> Retry quiz
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
