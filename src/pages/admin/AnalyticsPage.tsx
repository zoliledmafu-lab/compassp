import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BarChart3, TrendingUp, Users, MessageSquare, AlertTriangle } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { supabase, SUPABASE_ENABLED } from '../../lib/supabase'

interface SubjectStat { subject: string; sessions: number }
interface AttemptLog  { student: string; subject: string; count: number; date: string }

interface Stats {
  activeStudents: number
  totalSessions: number
  subjectStats: SubjectStat[]
  attemptLogs: AttemptLog[]
}

const EMPTY: Stats = { activeStudents: 0, totalSessions: 0, subjectStats: [], attemptLogs: [] }

export function AnalyticsPage() {
  const { user } = useAuth()
  const { t }    = useLanguage()
  const [stats,   setStats]   = useState<Stats>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    loadStats()
  }, [user]) // eslint-disable-line

  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />

  async function loadStats() {
    setLoading(true)
    try {
      if (!SUPABASE_ENABLED || user!.id.startsWith('user-')) {
        setStats(EMPTY)
        setLoading(false)
        return
      }

      const schoolName = user!.school_name || ''
      if (!schoolName) { setStats(EMPTY); setLoading(false); return }

      // Students at this school
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'student')
        .eq('school_name', schoolName)

      if (!profiles?.length) { setStats(EMPTY); setLoading(false); return }

      const ids = profiles.map(p => p.id)
      const nameMap: Record<string, string> = Object.fromEntries(profiles.map(p => [p.id, p.full_name]))

      // Chat sessions for those students
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('student_id, subject, messages, last_active')
        .in('student_id', ids)

      const rows = sessions ?? []
      const totalSessions  = rows.length
      const activeStudents = new Set(rows.map(r => r.student_id)).size

      // Sessions by subject
      const subjectCount: Record<string, number> = {}
      for (const r of rows) {
        subjectCount[r.subject] = (subjectCount[r.subject] ?? 0) + 1
      }
      const subjectStats: SubjectStat[] = Object.entries(subjectCount)
        .map(([subject, sessions]) => ({ subject, sessions }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 8)

      // Direct answer attempt logs — scan message content
      const attemptLogs: AttemptLog[] = []
      const directPatterns = [/just (give|tell|show) me the answer/i, /what('s| is) the answer/i, /solve (this|it) for me/i, /just tell me/i]
      const recentCutoff = Date.now() - 7 * 86_400_000

      for (const r of rows) {
        if (!r.last_active || new Date(r.last_active).getTime() < recentCutoff) continue
        const msgs: { role: string; content: string }[] = Array.isArray(r.messages) ? r.messages : []
        const count = msgs.filter(m => m.role === 'user' && directPatterns.some(p => p.test(m.content))).length
        if (count > 0) {
          attemptLogs.push({
            student: nameMap[r.student_id] ? nameMap[r.student_id].split(' ')[0] + ' ' + (nameMap[r.student_id].split(' ')[1]?.charAt(0) ?? '') + '.' : '—',
            subject: r.subject,
            count,
            date: r.last_active,
          })
        }
      }
      attemptLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setStats({ activeStudents, totalSessions, subjectStats, attemptLogs: attemptLogs.slice(0, 10) })
    } catch {
      setStats(EMPTY)
    }
    setLoading(false)
  }

  function formatDate(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86_400_000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  const maxSessions = Math.max(...stats.subjectStats.map(s => s.sessions), 1)
  const hasData     = stats.totalSessions > 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <BarChart3 size={24} className="text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">{t('admin_analytics_title')}</h1>
          <p className="text-slate-400 text-sm">
            {t('admin_analytics_desc')}
            {user?.school_name && <span className="text-indigo-400"> — {user.school_name}</span>}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your analytics…</p>
        </div>
      ) : !user?.school_name ? (
        <div className="text-center py-16">
          <BarChart3 size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">School profile incomplete</p>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Analytics are grouped by school. Your school name has not been set — please complete your school profile to view usage data.
          </p>
        </div>
      ) : !hasData ? (
        <div className="text-center py-16">
          <BarChart3 size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">{t('admin_no_data')}</p>
        </div>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: <Users size={18} className="text-indigo-400" />,     label: t('admin_stat_active'),   value: String(stats.activeStudents) },
              { icon: <MessageSquare size={18} className="text-purple-400" />, label: t('admin_stat_sessions'), value: String(stats.totalSessions) },
              { icon: <AlertTriangle size={18} className="text-amber-400" />, label: t('admin_stat_attempts'), value: String(stats.attemptLogs.reduce((s, l) => s + l.count, 0)) },
            ].map(stat => (
              <Card key={stat.label} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {stat.icon}
                  <span className="text-xs text-slate-400">{stat.label}</span>
                </div>
                <span className="text-2xl font-bold text-white">{stat.value}</span>
              </Card>
            ))}
          </div>

          {/* Sessions by subject */}
          <Card className="mb-6">
            <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-400" /> {t('admin_sessions_by_subject')}
            </h2>
            <div className="flex flex-col gap-3">
              {stats.subjectStats.map(item => (
                <div key={item.subject}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-300">{item.subject}</span>
                    <span className="text-slate-500 text-xs">{item.sessions} sessions</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div
                      className="gradient-primary h-2 rounded-full transition-all"
                      style={{ width: `${(item.sessions / maxSessions) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Direct answer attempts */}
          {stats.attemptLogs.length > 0 && (
            <Card>
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" /> {t('admin_attempts_log')}
              </h2>
              <div className="flex flex-col gap-3">
                {stats.attemptLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {log.student.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white">{log.student}</span>
                        <span className="text-xs text-slate-500 ml-2">{log.subject}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">{log.count}× attempts</span>
                      <span className="text-xs text-slate-500">{formatDate(log.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
