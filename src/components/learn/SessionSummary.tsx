interface Props {
  topicTitle: string
  subjectName: string
  subjectColor: string
  subjectGradient: string
  milestones: string[]
  stepsCompleted: number
  totalSteps: number
  hintsUsed: number
  annotationsUsed: number
  durationMs: number
  onContinue: () => void
}

export function SessionSummary({
  topicTitle,
  subjectName,
  subjectColor,
  subjectGradient,
  milestones,
  stepsCompleted,
  totalSteps,
  hintsUsed,
  annotationsUsed,
  durationMs,
  onContinue,
}: Props) {
  const mins = Math.floor(durationMs / 60000)
  const secs = Math.floor((durationMs % 60000) / 1000)
  const pct  = Math.round((stepsCompleted / Math.max(totalSteps, 1)) * 100)

  const understood = milestones.slice(0, stepsCompleted)
  const toWorkOn   = milestones.slice(stepsCompleted)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'rgba(10,14,26,0.97)',
        border: `1.5px solid ${subjectColor}35`,
        borderRadius: 28,
        padding: '32px 28px 28px',
        boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px ${subjectColor}15`,
        fontFamily: "'Inter', system-ui, sans-serif",
        color: 'rgba(255,255,255,0.88)',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>
            {pct === 100 ? '🎉' : pct >= 50 ? '⭐' : '💪'}
          </div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
            {pct === 100 ? 'Topic Complete!' : 'Good session!'}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.38)' }}>
            {subjectName} · {topicTitle}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Steps done', value: `${stepsCompleted}/${totalSteps}` },
            { label: 'Hints used', value: String(hintsUsed) },
            { label: 'Time', value: `${mins}:${String(secs).padStart(2, '0')}` },
          ].map(s => (
            <div key={s.label} style={{
              textAlign: 'center', padding: '12px 8px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Progress</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: subjectColor }}>{pct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: subjectGradient,
              borderRadius: 3,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* What you understood */}
        {understood.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: subjectColor }}>
              ✓ What you showed you understand
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {understood.map(c => (
                <li key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
                  <span style={{ color: subjectColor, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* To practise */}
        {toWorkOn.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#fbbf24' }}>
              → To practise next time
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {toWorkOn.map(c => (
                <li key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>
                  <span style={{ color: '#fbbf24', flexShrink: 0, marginTop: 1 }}>→</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {toWorkOn.length === 0 && <div style={{ marginBottom: 24 }} />}

        <button
          onClick={onContinue}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 16,
            background: subjectGradient,
            border: 'none', color: 'white',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            boxShadow: `0 4px 24px ${subjectColor}50`,
            letterSpacing: '-0.01em',
          }}
        >
          {pct === 100 ? 'Back to Dashboard →' : 'Pick up next time →'}
        </button>

        {annotationsUsed > 0 && (
          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 12, marginBottom: 0 }}>
            Compass drew {annotationsUsed} annotation{annotationsUsed !== 1 ? 's' : ''} to help guide you
          </p>
        )}
      </div>
    </div>
  )
}
