interface Props {
  progress: number      // 0–1
  milestones: string[]  // label for each step
  currentStep: number
}

export function ProgressBar({ progress, milestones, currentStep }: Props) {
  const pct = Math.max(0, Math.min(1, progress)) * 100

  return (
    <div className="w-full px-4 pt-4 pb-2 select-none">
      {/* Bar */}
      <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #0d9488, #d97706)',
            transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '0 0 8px rgba(20,184,166,0.6)',
          }}
        />
        {/* Milestone dots on the bar */}
        {milestones.map((_, i) => {
          const pos = ((i + 1) / milestones.length) * 100
          const done = i < currentStep
          const active = i === currentStep
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all duration-300"
              style={{
                left: `${pos}%`,
                width: active ? 10 : 6,
                height: active ? 10 : 6,
                background: done ? '#d97706' : active ? 'white' : 'rgba(255,255,255,0.25)',
                boxShadow: active ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
              }}
            />
          )
        })}
      </div>

      {/* Milestone labels */}
      <div className="flex mt-2">
        {milestones.map((label, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <div
              key={i}
              className="flex-1 text-center transition-colors duration-300"
              style={{ fontSize: 10, color: done ? '#d97706' : active ? '#e2e8f0' : 'rgba(148,163,184,0.4)', fontWeight: active ? 600 : 400 }}
            >
              {active && '● '}{label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
