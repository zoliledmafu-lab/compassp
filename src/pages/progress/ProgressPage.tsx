import { useNavigate } from 'react-router-dom'
import { Flame, Brain, Target, MessageSquare, Lightbulb, TrendingUp, Star } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useMemory } from '../../contexts/MemoryContext'
import { SUBJECTS } from '../../lib/subjects'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

const ENCOURAGEMENTS = [
  "Every question you work through builds understanding that lasts.",
  "Struggle is the sign of genuine learning. That is progress.",
  "Returning to revise is exactly how strong students prepare.",
  "Every concept you explore becomes a skill you carry into the exam.",
  "Consistency is what separates preparation from performance.",
]

export function ProgressPage() {
  const { user } = useAuth()
  const { getMemory } = useMemory()
  const navigate = useNavigate()

  const subjectData = SUBJECTS.map(s => ({ subject: s, memory: getMemory(user?.id || '', s.id) }))
  const active = subjectData.filter(d => d.memory !== null)
  const totalSessions = active.reduce((a, d) => a + (d.memory?.session_count || 0), 0)
  const totalTopics = active.reduce((a, d) => a + (d.memory?.topics_covered.length || 0), 0)
  const streakDays = totalSessions > 0 ? 1 : 0

  const encouragement = ENCOURAGEMENTS[Math.floor(Date.now() / 86400000) % ENCOURAGEMENTS.length]

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">My Progress</h1>
        <p className="text-slate-400 text-sm sm:text-base">Your personal learning journey.</p>
      </div>

      {/* Encouragement banner */}
      <div className="glass rounded-2xl p-5 mb-8 border-l-4 border-indigo-500 flex items-start gap-4">
        <Star size={24} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-white mb-1">Daily encouragement</p>
          <p className="text-slate-300 italic">"{encouragement}"</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { icon: <Flame className="text-orange-400" size={20} />, label: 'Day streak', value: streakDays === 0 ? '0' : `${streakDays}`, bg: 'bg-orange-400/10' },
          { icon: <Brain className="text-purple-400" size={20} />, label: 'Subjects', value: `${active.length}`, bg: 'bg-purple-400/10' },
          { icon: <MessageSquare className="text-indigo-400" size={20} />, label: 'Sessions', value: `${totalSessions}`, bg: 'bg-indigo-400/10' },
          { icon: <Target className="text-green-400" size={20} />, label: 'Topics', value: `${totalTopics}`, bg: 'bg-green-400/10' },
        ].map(stat => (
          <Card key={stat.label} className={`flex flex-col gap-3 ${stat.bg} border-transparent`}>
            {stat.icon}
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Subject breakdown */}
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-indigo-400" /> Subject Progress
      </h2>

      {active.length === 0 ? (
        <Card className="text-center py-10">
          <Brain size={40} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No sessions recorded yet. Start a study session to begin tracking your progress.</p>
          <Button onClick={() => navigate('/subjects')}>Browse Subjects</Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {active.map(({ subject: s, memory }) => (
            <Card key={s.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${s.color}22` }}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{s.name}</h3>
                  <p className="text-xs text-slate-400">{memory?.session_count} sessions · {memory?.topics_covered.length} topics covered</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/chat?subject=${s.id}`)} className="shrink-0">
                  Continue →
                </Button>
              </div>

              {memory?.strengths && memory.strengths.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-green-400 font-medium flex items-center gap-1"><Lightbulb size={10} /> Strengths:</span>
                  {memory.strengths.map(str => (
                    <span key={str} className="text-xs bg-green-400/10 text-green-300 px-2 py-0.5 rounded-full">{str}</span>
                  ))}
                </div>
              )}

              {memory?.struggles && memory.struggles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-amber-400 font-medium">Working on:</span>
                  {memory.struggles.map(str => (
                    <span key={str} className="text-xs bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded-full">{str}</span>
                  ))}
                </div>
              )}

              {memory?.topics_covered && memory.topics_covered.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-slate-400 font-medium">Topics explored:</span>
                  {memory.topics_covered.slice(0, 6).map(t => (
                    <span key={t} className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                  {memory.topics_covered.length > 6 && (
                    <span className="text-xs text-slate-500">+{memory.topics_covered.length - 6} more</span>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
