// Inline quiz card — rendered from ```quiz code blocks in chat messages
import { useState } from 'react'

interface QuizConfig {
  question: string
  type: 'mcq' | 'fill' | 'truefalse'
  options?: string[]          // MCQ choices (2–4)
  answer: number | string     // MCQ: 0-based index | fill: correct string | truefalse: 'true'/'false'
  explanation?: string
  hint?: string
}

export function parseQuizBlock(raw: string): QuizConfig | null {
  try {
    const cfg = JSON.parse(raw.trim()) as QuizConfig
    if (!cfg.question || !cfg.type) return null
    return cfg
  } catch {
    return null
  }
}

export function QuizCard({ config }: { config: QuizConfig }) {
  const [selected, setSelected] = useState<number | null>(null)   // MCQ/TF index
  const [typed, setTyped] = useState('')                          // fill answer
  const [submitted, setSubmitted] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const isCorrect = (() => {
    if (!submitted) return null
    if (config.type === 'mcq') return selected === Number(config.answer)
    if (config.type === 'truefalse') return selected === (config.answer === 'true' || config.answer === true ? 0 : 1)
    if (config.type === 'fill') {
      const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9.\-]/g, '')
      return norm(typed) === norm(String(config.answer))
    }
    return false
  })()

  const canSubmit = config.type === 'fill' ? typed.trim().length > 0 : selected !== null

  const handleSubmit = () => {
    if (!canSubmit) return
    setSubmitted(true)
  }

  const handleReset = () => {
    setSelected(null)
    setTyped('')
    setSubmitted(false)
    setShowHint(false)
  }

  const borderColor = submitted
    ? isCorrect ? '#34d399' : '#f87171'
    : '#6366f144'

  const bgColor = submitted
    ? isCorrect ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)'
    : 'rgba(99,102,241,0.05)'

  return (
    <div style={{
      margin: '12px 0',
      borderRadius: '16px',
      border: `1px solid ${borderColor}`,
      background: bgColor,
      padding: '16px 18px',
      transition: 'border-color 0.3s, background 0.3s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{
          fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em',
          color: '#818cf8', background: 'rgba(129,140,248,0.12)',
          padding: '2px 8px', borderRadius: '99px',
        }}>
          PRACTICE
        </span>
        {!submitted && config.hint && (
          <button
            onClick={() => setShowHint(h => !h)}
            style={{
              fontSize: '10px', color: '#64748b', background: 'none',
              border: 'none', cursor: 'pointer', marginLeft: 'auto',
              textDecoration: 'underline',
            }}
          >
            {showHint ? 'Hide hint' : 'Show hint'}
          </button>
        )}
      </div>

      {/* Question */}
      <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.55, marginBottom: '14px', fontWeight: 500 }}>
        {config.question}
      </p>

      {/* Hint */}
      {showHint && config.hint && (
        <div style={{
          fontSize: '12px', color: '#94a3b8', background: 'rgba(255,255,255,0.04)',
          borderRadius: '8px', padding: '8px 12px', marginBottom: '12px',
          borderLeft: '3px solid #6366f1',
        }}>
          Hint: {config.hint}
        </div>
      )}

      {/* MCQ Options */}
      {config.type === 'mcq' && config.options && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {config.options.map((opt, i) => {
            const isCorrectAnswer = i === Number(config.answer)
            const isChosen = selected === i
            let bg = 'rgba(255,255,255,0.04)'
            let border = 'rgba(255,255,255,0.1)'
            let textColor = '#cbd5e1'

            if (submitted) {
              if (isCorrectAnswer) { bg = 'rgba(52,211,153,0.15)'; border = '#34d399'; textColor = '#34d399' }
              else if (isChosen && !isCorrectAnswer) { bg = 'rgba(248,113,113,0.15)'; border = '#f87171'; textColor = '#f87171' }
            } else if (isChosen) {
              bg = 'rgba(99,102,241,0.15)'; border = '#6366f1'; textColor = '#818cf8'
            }

            return (
              <button
                key={i}
                onClick={() => !submitted && setSelected(i)}
                disabled={submitted}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: '10px',
                  border: `1px solid ${border}`,
                  background: bg, color: textColor,
                  fontSize: '13px', textAlign: 'left', cursor: submitted ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.08)',
                  fontSize: '11px', fontWeight: '700',
                  border: `1px solid ${border}`,
                  color: textColor,
                }}>
                  {['A', 'B', 'C', 'D'][i]}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      )}

      {/* True / False */}
      {config.type === 'truefalse' && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          {['True', 'False'].map((label, i) => {
            const isCorrectAnswer = i === (config.answer === 'true' || config.answer === true ? 0 : 1)
            const isChosen = selected === i
            let bg = 'rgba(255,255,255,0.04)'
            let border = 'rgba(255,255,255,0.1)'
            let textColor = '#cbd5e1'

            if (submitted) {
              if (isCorrectAnswer) { bg = 'rgba(52,211,153,0.15)'; border = '#34d399'; textColor = '#34d399' }
              else if (isChosen) { bg = 'rgba(248,113,113,0.15)'; border = '#f87171'; textColor = '#f87171' }
            } else if (isChosen) {
              bg = 'rgba(99,102,241,0.15)'; border = '#6366f1'; textColor = '#818cf8'
            }

            return (
              <button
                key={i}
                onClick={() => !submitted && setSelected(i)}
                disabled={submitted}
                style={{
                  flex: 1, padding: '10px',
                  borderRadius: '10px', border: `1px solid ${border}`,
                  background: bg, color: textColor,
                  fontSize: '13px', fontWeight: '600', cursor: submitted ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* Fill-in */}
      {config.type === 'fill' && (
        <div style={{ marginBottom: '14px' }}>
          <input
            type="text"
            value={typed}
            onChange={e => !submitted && setTyped(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !submitted && handleSubmit()}
            placeholder="Type your answer…"
            disabled={submitted}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px', borderRadius: '10px',
              border: `1px solid ${submitted ? (isCorrect ? '#34d399' : '#f87171') : 'rgba(255,255,255,0.12)'}`,
              background: 'rgba(255,255,255,0.05)',
              color: submitted ? (isCorrect ? '#34d399' : '#f87171') : '#e2e8f0',
              fontSize: '13px', outline: 'none',
              transition: 'border-color 0.3s',
            }}
          />
          {submitted && !isCorrect && (
            <p style={{ fontSize: '12px', color: '#34d399', marginTop: '6px' }}>
              Correct answer: <strong>{String(config.answer)}</strong>
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              padding: '8px 20px', borderRadius: '10px',
              background: canSubmit ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.06)',
              color: canSubmit ? 'white' : '#475569',
              border: 'none', cursor: canSubmit ? 'pointer' : 'default',
              fontSize: '13px', fontWeight: '600',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            Check answer
          </button>
        ) : (
          <>
            {/* Result badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', fontWeight: '600',
              color: isCorrect ? '#34d399' : '#f87171',
            }}>
              <span>{isCorrect ? '✓' : '✗'}</span>
              <span>{isCorrect ? 'Correct!' : 'Not quite'}</span>
            </div>
            <button
              onClick={handleReset}
              style={{
                padding: '6px 14px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8', cursor: 'pointer', fontSize: '12px',
                marginLeft: 'auto',
              }}
            >
              Try again
            </button>
          </>
        )}
      </div>

      {/* Explanation */}
      {submitted && config.explanation && (
        <div style={{
          marginTop: '12px', padding: '10px 14px',
          background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
          borderLeft: `3px solid ${isCorrect ? '#34d399' : '#818cf8'}`,
          fontSize: '12px', color: '#94a3b8', lineHeight: 1.6,
        }}>
          <strong style={{ color: '#cbd5e1' }}>Explanation: </strong>
          {config.explanation}
        </div>
      )}
    </div>
  )
}
