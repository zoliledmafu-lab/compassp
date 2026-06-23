import { useNavigate } from 'react-router-dom'
import { MessageSquare, Layers, BookOpen, Flame, Brain, Target, TrendingUp } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useMemory } from '../../contexts/MemoryContext'
import { SUBJECTS } from '../../lib/subjects'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export function DashboardPage() {
  const { user } = useAuth()
  const { getMemory } = useMemory()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'admin'

  // Collect student memory across subjects
  const subjectMemories = user
    ? SUBJECTS.map(s => ({ subject: s, memory: getMemory(user.id, s.id) })).filter(m => m.memory !== null)
    : []

  const totalSessions = subjectMemories.reduce((acc, m) => acc + (m.memory?.session_count || 0), 0)
  const totalSubjects = subjectMemories.length

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (isAdmin) return <AdminDashboard />

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          {greeting()}, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 mt-1">Ready to learn something today?</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Flame className="text-orange-400" size={20} />, label: 'Study streak', value: '3 days', color: 'text-orange-400' },
          { icon: <Brain className="text-purple-400" size={20} />, label: 'Subjects active', value: `${Math.max(totalSubjects, 1)}`, color: 'text-purple-400' },
          { icon: <MessageSquare className="text-indigo-400" size={20} />, label: 'Total sessions', value: `${totalSessions}`, color: 'text-indigo-400' },
          { icon: <Target className="text-green-400" size={20} />, label: 'Concepts explored', value: `${subjectMemories.reduce((a, m) => a + (m.memory?.topics_covered.length || 0), 0)}`, color: 'text-green-400' },
        ].map(stat => (
          <Card key={stat.label} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {stat.icon}
              <span className="text-xs text-slate-400">{stat.label}</span>
            </div>
            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card hover onClick={() => navigate('/chat')} className="flex flex-col gap-3 gradient-card border-indigo-500/20">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center glow-sm">
            <MessageSquare size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Start Studying</h3>
            <p className="text-sm text-slate-400">Ask questions, get guided hints</p>
          </div>
          <Button variant="secondary" size="sm" className="w-fit">Open Chat →</Button>
        </Card>

        <Card hover onClick={() => navigate('/canvas')} className="flex flex-col gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Layers size={18} className="text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Study Canvas</h3>
            <p className="text-sm text-slate-400">Organise notes, quiz yourself</p>
          </div>
          <Button variant="secondary" size="sm" className="w-fit">Open Canvas →</Button>
        </Card>

        <Card hover onClick={() => navigate('/subjects')} className="flex flex-col gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
            <BookOpen size={18} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Browse Subjects</h3>
            <p className="text-sm text-slate-400">Pick a subject and dive in</p>
          </div>
          <Button variant="secondary" size="sm" className="w-fit">View Subjects →</Button>
        </Card>
      </div>

      {/* Subject activity */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-indigo-400" /> Your Subjects
        </h2>
        {subjectMemories.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-slate-400 mb-4">No sessions yet. Start studying to see your progress here!</p>
            <Button onClick={() => navigate('/subjects')}>Choose a Subject</Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjectMemories.slice(0, 6).map(({ subject: s, memory }) => (
              <Card key={s.id} hover onClick={() => navigate(`/chat?subject=${s.id}`)} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${s.color}22` }}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{s.name}</p>
                  <p className="text-xs text-slate-400">{memory?.session_count || 0} sessions · {memory?.topics_covered.length || 0} topics</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Console</h1>
        <p className="text-slate-400 mt-1">Manage Compass for your institution</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { to: '/admin/rules', icon: '⚙️', label: 'Rule Engine', desc: 'Configure AI behavior' },
          { to: '/admin/students', icon: '👥', label: 'Students', desc: 'Manage student roster' },
          { to: '/admin/analytics', icon: '📊', label: 'Analytics', desc: 'View usage & performance' },
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
