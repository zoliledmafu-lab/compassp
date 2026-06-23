import { BarChart3, TrendingUp, Users, MessageSquare, Clock, AlertTriangle } from 'lucide-react'
import { Card } from '../../components/ui/Card'

const MOCK_SUBJECT_USAGE = [
  { subject: 'Mathematics', sessions: 45, avgDuration: '28 min', hints: 312 },
  { subject: 'Physical Sciences', sessions: 38, avgDuration: '22 min', hints: 245 },
  { subject: 'Life Sciences', sessions: 29, avgDuration: '18 min', hints: 187 },
  { subject: 'English', sessions: 24, avgDuration: '15 min', hints: 142 },
  { subject: 'Accounting', sessions: 18, avgDuration: '32 min', hints: 221 },
]

const MAX_SESSIONS = Math.max(...MOCK_SUBJECT_USAGE.map(s => s.sessions))

export function AnalyticsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <BarChart3 size={24} className="text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm">Institution-wide usage data. Not visible to students.</p>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Users size={18} className="text-indigo-400" />, label: 'Active students', value: '5' },
          { icon: <MessageSquare size={18} className="text-purple-400" />, label: 'Total sessions', value: '154' },
          { icon: <Clock size={18} className="text-cyan-400" />, label: 'Avg. session', value: '23 min' },
          { icon: <AlertTriangle size={18} className="text-amber-400" />, label: 'Direct answer attempts', value: '12' },
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

      {/* Subject usage chart */}
      <Card className="mb-6">
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-400" /> Sessions by Subject
        </h2>
        <div className="flex flex-col gap-3">
          {MOCK_SUBJECT_USAGE.map(item => (
            <div key={item.subject}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-300">{item.subject}</span>
                <div className="flex items-center gap-4 text-slate-500 text-xs">
                  <span>{item.sessions} sessions</span>
                  <span>{item.avgDuration} avg</span>
                  <span>{item.hints} hints</span>
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="gradient-primary h-2 rounded-full transition-all"
                  style={{ width: `${(item.sessions / MAX_SESSIONS) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Direct answer attempt log */}
      <Card>
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-400" /> Direct Answer Attempts (last 7 days)
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { student: 'Thabo S.', subject: 'Mathematics', count: 4, date: 'Today' },
            { student: 'Ayanda D.', subject: 'Physical Sciences', count: 3, date: 'Yesterday' },
            { student: 'Sipho M.', subject: 'Accounting', count: 2, date: '3 days ago' },
            { student: 'Nomsa Z.', subject: 'isiZulu', count: 2, date: '5 days ago' },
            { student: 'Lethiwe N.', subject: 'Life Sciences', count: 1, date: '6 days ago' },
          ].map(log => (
            <div key={log.student + log.date} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {log.student.charAt(0)}
                </div>
                <div>
                  <span className="text-sm font-medium text-white">{log.student}</span>
                  <span className="text-xs text-slate-500 ml-2">{log.subject}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">{log.count}x attempts</span>
                <span className="text-xs text-slate-500">{log.date}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
