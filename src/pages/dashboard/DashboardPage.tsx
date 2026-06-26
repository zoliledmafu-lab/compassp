import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Layers, BookOpen, Flame, Brain, Target, Plus, X, Check, TrendingUp } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useMemory } from '../../contexts/MemoryContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import {
  getPinnedIds, setPinnedIds, getPinnedSubjects,
  getCurriculumSubjects,
} from '../../lib/pinnedSubjects'
import type { Subject } from '../../lib/subjects'
import { CURRICULUM_META } from '../../lib/subjects'

// ── Admin dashboard ───────────────────────────────────────────────────────────

function AdminDashboard() {
  const navigate = useNavigate()
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Console</h1>
        <p className="text-slate-400 mt-1">Manage Compass for your institution</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { to: '/admin/rules',     icon: '⚙️', label: 'Rule Engine',   desc: 'Configure AI behaviour' },
          { to: '/admin/students',  icon: '👥', label: 'Students',       desc: 'Manage student roster' },
          { to: '/admin/analytics', icon: '📊', label: 'Analytics',      desc: 'View usage & performance' },
        ].map(item => (
          <Card key={item.to} hover onClick={() => navigate(item.to)} className="flex flex-col gap-3">
            <span className="text-3xl">{item.icon}</span>
            <div>
              <h3 className="font-semibold text-white">{item.label}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Greeting ─────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  iconClass: string
  icon: React.ReactNode
  label: string
  value: string | number
  valueColor: string
}

function StatCard({ iconClass, icon, label, value, valueColor }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className={`icon-3d w-10 h-10 ${iconClass}`}>
        {icon}
      </div>
      <div>
        <p className={`stat-number ${valueColor}`}>{value}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium tracking-wide uppercase">{label}</p>
      </div>
    </Card>
  )
}

// ── Action card ───────────────────────────────────────────────────────────────

interface ActionCardProps {
  iconClass: string
  icon: React.ReactNode
  title: string
  desc: string
  cta: string
  onClick: () => void
  accent?: string
}

function ActionCard({ iconClass, icon, title, desc, cta, onClick }: ActionCardProps) {
  return (
    <Card hover onClick={onClick} className="flex flex-col gap-4 p-5">
      <div className={`icon-3d w-12 h-12 ${iconClass}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-white text-base leading-tight tracking-tight">{title}</h3>
        <p className="text-sm text-slate-400 mt-1">{desc}</p>
      </div>
      <span className="text-sm font-medium text-white/50 hover:text-white transition-colors">{cta} →</span>
    </Card>
  )
}

// ── Add Subjects panel ────────────────────────────────────────────────────────

interface AddSubjectsPanelProps {
  userId: string
  available: Subject[]
  pinned: string[]
  onToggle: (id: string) => void
  onClose: () => void
}

function AddSubjectsPanel({ available, pinned, onToggle, onClose }: AddSubjectsPanelProps) {
  const byCurriculum = available.reduce<Record<string, Subject[]>>((acc, s) => {
    const key = s.curriculumCode
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <div
      className="rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: '#13131f' }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div>
          <p className="font-semibold text-white text-sm">Add subjects to your dashboard</p>
          <p className="text-xs text-slate-500 mt-0.5">{pinned.length} selected</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
          <X size={15} />
        </button>
      </div>

      {/* Subject groups */}
      <div className="p-4 max-h-80 overflow-y-auto space-y-5">
        {Object.entries(byCurriculum).map(([code, subjects]) => {
          const meta = CURRICULUM_META[code as keyof typeof CURRICULUM_META]
          return (
            <div key={code}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>{meta.flag}</span> {meta.shortLabel}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {subjects.map(s => {
                  const active = pinned.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() => onToggle(s.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-all border ${
                        active
                          ? 'border-indigo-500/60 bg-indigo-500/15 text-white'
                          : 'border-white/8 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span className="text-base shrink-0">{s.icon}</span>
                      <span className="truncate text-xs font-medium leading-tight">{s.name}</span>
                      {active && <Check size={11} className="text-indigo-400 shrink-0 ml-auto" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-4 py-3 border-t border-white/8 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user }   = useAuth()
  const { getMemory } = useMemory()
  const navigate   = useNavigate()

  const [pinnedIds,    setPinnedState]   = useState<string[]>([])
  const [showPicker,   setShowPicker]    = useState(false)

  // Load pinned subjects for this user
  useEffect(() => {
    if (user?.id) setPinnedState(getPinnedIds(user.id))
  }, [user?.id])

  const handleToggle = useCallback((id: string) => {
    if (!user?.id) return
    const next = pinnedIds.includes(id)
      ? pinnedIds.filter(x => x !== id)
      : [...pinnedIds, id]
    setPinnedState(next)
    setPinnedIds(user.id, next)
  }, [pinnedIds, user?.id])

  if (!user) return null
  if (user.role === 'admin') return <AdminDashboard />

  const pinnedSubjects = getPinnedSubjects(user.id)
  const availableSubjects = getCurriculumSubjects(user)

  // Session stats from memory
  const allMemory = pinnedSubjects.map(s => getMemory(user.id, s.id)).filter(Boolean)
  const totalSessions = allMemory.reduce((a, m) => a + (m?.session_count || 0), 0)
  const totalConcepts = allMemory.reduce((a, m) => a + (m?.topics_covered.length || 0), 0)
  const streak = totalSessions > 0 ? 1 : 0

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* ── Welcome ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {greeting()}, {user.full_name?.split(' ')[0]}
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {pinnedSubjects.length === 0
            ? 'Add your subjects to get started.'
            : 'Ready to make progress today?'}
        </p>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard
          iconClass="icon-3d-orange"
          icon={<Flame size={18} className="text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
          label="Study streak"
          value={streak === 0 ? '0 days' : `${streak} day`}
          valueColor="text-orange-400"
        />
        <StatCard
          iconClass="icon-3d-purple"
          icon={<Brain size={18} className="text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
          label="Subjects added"
          value={pinnedSubjects.length}
          valueColor="text-purple-400"
        />
        <StatCard
          iconClass="icon-3d-blue"
          icon={<MessageSquare size={18} className="text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
          label="Total sessions"
          value={totalSessions}
          valueColor="text-blue-400"
        />
        <StatCard
          iconClass="icon-3d-green"
          icon={<Target size={18} className="text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
          label="Concepts explored"
          value={totalConcepts}
          valueColor="text-green-400"
        />
      </div>

      {/* ── Quick actions ───────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <ActionCard
          iconClass="icon-3d-indigo"
          icon={<MessageSquare size={20} className="text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
          title="Start Studying"
          desc="Ask questions, work through problems with AI guidance"
          cta="Open Chat"
          onClick={() => navigate('/chat')}
        />
        <ActionCard
          iconClass="icon-3d-purple"
          icon={<Layers size={20} className="text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
          title="Study Canvas"
          desc="Build mind maps, organise your revision notes"
          cta="Open Canvas"
          onClick={() => navigate('/canvas')}
        />
        <ActionCard
          iconClass="icon-3d-teal"
          icon={<BookOpen size={20} className="text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
          title="Browse Subjects"
          desc="Explore your full curriculum — all subjects in one place"
          cta="View Subjects"
          onClick={() => navigate('/subjects')}
        />
      </div>

      {/* ── Your subjects ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-400" /> Your Subjects
          </h2>
          <button
            onClick={() => setShowPicker(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              showPicker
                ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300'
                : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            <Plus size={12} /> Add subjects
          </button>
        </div>

        {/* Add subjects panel */}
        {showPicker && (
          <div className="mb-4">
            <AddSubjectsPanel
              userId={user.id}
              available={availableSubjects}
              pinned={pinnedIds}
              onToggle={handleToggle}
              onClose={() => setShowPicker(false)}
            />
          </div>
        )}

        {/* Pinned subjects grid */}
        {pinnedSubjects.length === 0 && !showPicker ? (
          <Card className="text-center py-12 flex flex-col items-center gap-4">
            <div className="w-14 h-14 icon-3d icon-3d-indigo">
              <BookOpen size={22} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">No subjects yet</p>
              <p className="text-slate-500 text-xs mt-1">Add the subjects you're studying to track your progress here.</p>
            </div>
            <Button size="sm" onClick={() => setShowPicker(true)}>
              <Plus size={14} /> Add subjects
            </Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinnedSubjects.map(s => {
              const memory = getMemory(user.id, s.id)
              return (
                <Card
                  key={s.id}
                  hover
                  onClick={() => navigate(`/chat?subject=${s.id}`)}
                  className="flex items-center gap-3 group"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{
                      background: `${s.color}22`,
                      border: `1px solid ${s.color}44`,
                      boxShadow: `0 2px 8px ${s.color}25`,
                    }}
                  >
                    {s.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {memory?.session_count || 0} sessions · {memory?.topics_covered.length || 0} topics
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleToggle(s.id) }}
                    className="p-1.5 rounded-lg text-slate-700 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove"
                  >
                    <X size={12} />
                  </button>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
