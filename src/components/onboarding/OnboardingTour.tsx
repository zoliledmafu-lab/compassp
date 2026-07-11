import { useState, useEffect } from 'react'
import { X, ChevronRight, Compass, MessageSquare, Layout, BookOpen } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Step {
  icon: React.ReactNode
  title: string
  body: string
  accent: string
  tip?: string
}

const STEPS: Step[] = [
  {
    icon: <Compass size={28} />,
    title: 'Welcome to Compass!',
    body: "You're in. Let me give you a quick tour so you know exactly what's here.",
    accent: '#6366f1',
  },
  {
    icon: <BookOpen size={28} />,
    title: 'Pick your subjects',
    body: 'Hit Subjects in the sidebar to browse your curriculum. Tap any subject to start working through it with Compass.',
    accent: '#8b5cf6',
    tip: 'Your curriculum is already pre-selected — only subjects that match what you study are shown first.',
  },
  {
    icon: <MessageSquare size={28} />,
    title: 'Chat with your AI tutor',
    body: "Go to Chat and ask anything. Compass won't just hand you the answer — it'll help you actually understand it. Like texting a friend who aced the exam.",
    accent: '#06b6d4',
    tip: 'Past paper questions, worked examples, concept explanations — all fair game.',
  },
  {
    icon: <Layout size={28} />,
    title: 'Your canvas',
    body: "The Canvas is your personal whiteboard. Drag in notes, images, and ideas. Great for mind maps and revision boards before an exam.",
    accent: '#10b981',
  },
]

export function OnboardingTour() {
  const { user } = useAuth()
  const [visible,  setVisible]  = useState(false)
  const [step,     setStep]     = useState(0)
  const [exiting,  setExiting]  = useState(false)

  useEffect(() => {
    if (!user) return
    if (!sessionStorage.getItem('compass_new_signup')) return
    sessionStorage.removeItem('compass_new_signup')
    const t = setTimeout(() => setVisible(true), 900)
    return () => clearTimeout(t)
  }, [user])

  const close = () => {
    setExiting(true)
    setTimeout(() => {
      setVisible(false)
      setExiting(false)
    }, 180)
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else close()
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-200 ${exiting ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={e => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0f0f1a', border: `1px solid ${current.accent}35` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className="h-1" style={{ background: `linear-gradient(to right, ${current.accent}, ${current.accent}88)` }} />

        {/* Close */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-slate-600 hover:text-slate-300 transition-colors"
          aria-label="Close tour"
        >
          <X size={15} />
        </button>

        {/* Content */}
        <div className="px-6 pt-6 pb-4">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: `${current.accent}18`, color: current.accent }}
          >
            {current.icon}
          </div>

          {/* Step dots */}
          <div className="flex gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  background: i <= step ? current.accent : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>

          <h2 className="text-base font-bold text-white mb-2">{current.title}</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{current.body}</p>

          {current.tip && (
            <div
              className="mt-3 rounded-lg px-3 py-2.5 text-xs text-slate-400 leading-relaxed"
              style={{ background: `${current.accent}10`, border: `1px solid ${current.accent}20` }}
            >
              {current.tip}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between mt-2">
          <button
            onClick={close}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Skip tour
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: current.accent }}
          >
            {isLast ? "Let's go!" : 'Next'}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
