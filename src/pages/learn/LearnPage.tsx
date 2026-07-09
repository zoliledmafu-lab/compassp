import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTopic, getTopicsForSubject } from '../../lib/learningTopics'
import { SUBJECTS, getSubject } from '../../lib/learningTypes'
import { LearningEnvironment } from '../../components/learn/LearningEnvironment'
import { VoiceSelector } from '../../components/learn/VoiceSelector'
import { useAuth } from '../../contexts/AuthContext'

const WIDGET_ICON: Record<string, string> = {
  'circle-graph':    '⭕',
  'linear-graph':    '📈',
  'quadratic-graph': '🌀',
  'angle':           '📐',
  'pythagoras':      '📏',
  'number-line':     '🎯',
  'bar-chart':       '📊',
}

function hexToRgb(hex: string): string {
  try {
    return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`
  } catch {
    return '99,102,241'
  }
}

export function LearnPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const topic       = topicId ? getTopic(topicId) : undefined

  const curricula = user?.curricula ?? []
  const availableSubjects = SUBJECTS.filter(s =>
    s.curricula.some(c => curricula.includes(c)) || curricula.length === 0
  )
  const [activeSubjectId, setActiveSubjectId] = useState(
    availableSubjects[0]?.id ?? SUBJECTS[0].id
  )
  const [showVoice, setShowVoice] = useState(false)

  const subjectTopics = getTopicsForSubject(activeSubjectId)
  const activeSubject = getSubject(activeSubjectId) ?? availableSubjects[0]
  const accentRgb = hexToRgb(activeSubject?.color ?? '#6366f1')

  if (topic) {
    return <LearningEnvironment topic={topic} onExit={() => navigate('/dashboard')} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#07091A',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: 'rgba(255,255,255,0.88)',
      position: 'relative',
      overflowX: 'hidden',
    }}>

      {/* Ambient background mesh */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 50% at 20% -10%, rgba(${accentRgb},0.12) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 110%, rgba(99,102,241,0.08) 0%, transparent 60%)
        `,
        transition: 'background 0.6s ease',
      }} />

      {/* ── Top navigation bar ─────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 56,
        background: 'rgba(7,9,26,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #0d9488 0%, #d97706 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
            boxShadow: '0 4px 14px rgba(13,148,136,0.4)',
          }}>🧭</div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: 'white' }}>
            Compass
          </span>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowVoice(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: showVoice ? activeSubject?.color : 'rgba(255,255,255,0.07)',
              color: showVoice ? 'white' : 'rgba(255,255,255,0.65)',
              border: `1px solid ${showVoice ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: showVoice ? `0 0 20px ${activeSubject?.color}50` : 'none',
            }}
          >
            🎙 Voice
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '0 20px 100px' }}>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div style={{ padding: '36px 0 28px' }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
            ZIMSEC Interactive Lessons
          </p>
          <h1 style={{ margin: 0, fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'white' }}>
            Learn. Explore.
            <span style={{
              display: 'block',
              background: activeSubject?.gradient ?? 'linear-gradient(135deg, #818cf8, #c084fc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              transition: 'background 0.4s',
            }}>
              Discover.
            </span>
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 15, color: 'rgba(255,255,255,0.38)', fontWeight: 400, lineHeight: 1.5 }}>
            Interactive widgets with your AI companion Compass
          </p>
        </div>

        {/* ── Subject grid ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
            Select Subject
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 560 }}>
            {availableSubjects.map(sub => {
              const isActive = sub.id === activeSubjectId
              const rgb = hexToRgb(sub.color)
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubjectId(sub.id)}
                  style={{
                    position: 'relative', padding: '16px 10px 14px',
                    borderRadius: 20, cursor: 'pointer',
                    background: isActive
                      ? `rgba(${rgb}, 0.1)`
                      : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${isActive ? sub.color + '55' : 'rgba(255,255,255,0.07)'}`,
                    boxShadow: isActive
                      ? `0 0 32px rgba(${rgb},0.2), 0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`
                      : '0 2px 8px rgba(0,0,0,0.2)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, fontSize: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? sub.gradient : 'rgba(255,255,255,0.06)',
                    boxShadow: isActive ? `0 4px 18px rgba(${rgb},0.45), inset 0 1px 0 rgba(255,255,255,0.2)` : 'none',
                    transition: 'all 0.25s',
                  }}>
                    {sub.icon}
                  </div>
                  {/* Label */}
                  <span style={{
                    fontSize: 12, fontWeight: 700, lineHeight: 1.2, textAlign: 'center',
                    color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.4)',
                    transition: 'color 0.2s',
                  }}>
                    {sub.label}
                  </span>
                  {/* Count */}
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                    background: isActive ? `rgba(${rgb},0.22)` : 'rgba(255,255,255,0.06)',
                    color: isActive ? sub.color : 'rgba(255,255,255,0.28)',
                    transition: 'all 0.2s', letterSpacing: '0.03em',
                  }}>
                    {getTopicsForSubject(sub.id).length} topics
                  </span>
                  {/* Active indicator dot */}
                  {isActive && (
                    <div style={{
                      position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
                      width: 4, height: 4, borderRadius: '50%', background: sub.color,
                      boxShadow: `0 0 8px ${sub.color}`,
                    }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Topic section ─────────────────────────────────────────────── */}
        <div>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 4, height: 20, borderRadius: 2,
                background: activeSubject?.gradient ?? 'linear-gradient(#6366f1,#a855f7)',
                boxShadow: `0 0 12px ${activeSubject?.color ?? '#6366f1'}60`,
              }} />
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.85)' }}>
                {activeSubject?.label} Topics
              </span>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 10,
              background: `rgba(${hexToRgb(activeSubject?.color ?? '#6366f1')},0.14)`,
              color: activeSubject?.color ?? '#6366f1',
              letterSpacing: '0.04em',
            }}>
              {subjectTopics.length} TOPICS
            </span>
          </div>

          {/* Topic cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 680 }}>
            {subjectTopics.length === 0 && (
              <div style={{
                padding: '48px 24px', textAlign: 'center',
                background: 'rgba(255,255,255,0.02)', borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <p style={{ margin: '0 0 6px', fontSize: 32 }}>🚧</p>
                <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Topics coming soon for this subject</p>
              </div>
            )}

            {subjectTopics.map((t, idx) => {
              const widgetTypes = [...new Set(t.steps.map(s => s.widgetType))]
              const subject = getSubject(t.subjectId)
              const accent = subject?.color ?? '#6366f1'
              const rgb = hexToRgb(accent)

              return (
                <button
                  key={t.id}
                  onClick={() => navigate(`/learn/${t.id}`)}
                  className="group"
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 18, overflow: 'hidden',
                    transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = `rgba(${rgb},0.07)`
                    el.style.border = `1px solid rgba(${rgb},0.3)`
                    el.style.boxShadow = `0 8px 32px rgba(${rgb},0.15), 0 2px 12px rgba(0,0,0,0.3)`
                    el.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'rgba(255,255,255,0.03)'
                    el.style.border = '1px solid rgba(255,255,255,0.07)'
                    el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.25)'
                    el.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {/* Left gradient bar */}
                    <div style={{
                      width: 3, flexShrink: 0,
                      background: subject?.gradient ?? accent,
                      borderRadius: '18px 0 0 18px',
                    }} />

                    <div style={{ flex: 1, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* Index badge */}
                      <div style={{
                        width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                        background: `rgba(${rgb},0.14)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: accent,
                        letterSpacing: '-0.02em',
                      }}>
                        {idx + 1}
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                          {t.title}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.description}
                        </p>
                      </div>

                      {/* Right: widgets + steps + arrow */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {widgetTypes.slice(0, 2).map(wt => (
                            <span key={wt} style={{ fontSize: 14 }}>{WIDGET_ICON[wt] ?? '📚'}</span>
                          ))}
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 8,
                          background: `rgba(${rgb},0.14)`, color: accent,
                          letterSpacing: '0.02em',
                        }}>
                          {t.steps.length} steps
                        </span>
                        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>›</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Voice panel modal ─────────────────────────────────────────── */}
      {showVoice && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16,
          }}
          onClick={() => setShowVoice(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: 480,
              background: '#0d1225',
              borderRadius: '24px 24px 20px 20px',
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
              boxShadow: '0 -8px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: '16px 20px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>🎙 Choose Voice</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Your AI companion's voice</p>
              </div>
              <button
                onClick={() => setShowVoice(false)}
                style={{
                  width: 30, height: 30, borderRadius: '50%', fontSize: 16,
                  background: 'rgba(255,255,255,0.08)', border: 'none',
                  color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>
            <div style={{ padding: 20 }}>
              <VoiceSelector />
            </div>
          </div>
        </div>
      )}

      {/* Bottom ambient glow */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '35vh',
        pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 80% 100% at 50% 100%, rgba(${accentRgb},0.1) 0%, transparent 70%)`,
        transition: 'background 0.6s ease',
      }} />
    </div>
  )
}
