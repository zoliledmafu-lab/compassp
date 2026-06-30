interface Props {
  topicTitle: string
  stepsCompleted: number
  totalSteps: number
  hintsUsed: number
  annotationsUsed: number
  durationMs: number
  onContinue: () => void
}

export function SessionSummary({ topicTitle, stepsCompleted, totalSteps, hintsUsed, annotationsUsed, durationMs, onContinue }: Props) {
  const mins = Math.floor(durationMs / 60000)
  const secs = Math.floor((durationMs % 60000) / 1000)
  const pct  = Math.round((stepsCompleted / totalSteps) * 100)

  const understoodConcepts = [
    stepsCompleted >= 1 && 'Reading the centre from a circle equation',
    stepsCompleted >= 2 && 'Calculating the radius from r²',
    stepsCompleted >= 3 && 'Handling shifted centres (x − h)',
    stepsCompleted >= 4 && 'Full standard form in both axes',
  ].filter(Boolean) as string[]

  const toWorkOn = stepsCompleted < totalSteps
    ? ['Shifted centre circles (x + h or y + k form)', 'Distinguishing h and k from signs']
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-dark rounded-3xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{pct === 100 ? '🎉' : pct >= 50 ? '⭐' : '💪'}</div>
          <h2 className="text-2xl font-bold text-white">{pct === 100 ? 'Topic Complete!' : 'Good session!'}</h2>
          <p className="text-slate-400 text-sm mt-1">{topicTitle}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Steps done', value: `${stepsCompleted}/${totalSteps}` },
            { label: 'Hints used', value: hintsUsed },
            { label: 'Time', value: `${mins}:${String(secs).padStart(2, '0')}` },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Understanding map */}
        {understoodConcepts.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">What you showed you understand</p>
            <ul className="space-y-1.5">
              {understoodConcepts.map(c => (
                <li key={c} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-teal-400 mt-0.5 shrink-0">✓</span> {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {toWorkOn.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">To practise next time</p>
            <ul className="space-y-1.5">
              {toWorkOn.map(c => (
                <li key={c} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-amber-400 mt-0.5 shrink-0">→</span> {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #0f766e, #d97706)', boxShadow: '0 4px 16px rgba(13,148,136,0.4)' }}
        >
          {pct === 100 ? 'Back to subjects' : 'Pick up next time →'}
        </button>

        {annotationsUsed > 0 && (
          <p className="text-center text-xs text-slate-500 mt-3">Compass drew {annotationsUsed} annotation{annotationsUsed !== 1 ? 's' : ''} to help guide you</p>
        )}
      </div>
    </div>
  )
}
