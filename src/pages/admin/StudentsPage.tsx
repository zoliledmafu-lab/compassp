import { useState, useEffect } from 'react'
import { Users, Search } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { capitalizeName } from '../../lib/constants'
import { supabase, SUPABASE_ENABLED } from '../../lib/supabase'

interface StudentRow {
  id: string
  full_name: string
  email: string
  curricula: string[]
  created_at: string
  session_count: number
  last_active: string | null
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  <  2) return 'just now'
  if (mins  < 60) return `${mins} min ago`
  if (hours < 24) return `${hours}h ago`
  if (days  ===1) return 'yesterday'
  return new Date(iso).toLocaleDateString()
}

export function StudentsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    loadStudents()
  }, [user]) // eslint-disable-line

  async function loadStudents() {
    setLoading(true)
    try {
      if (!SUPABASE_ENABLED || user!.id.startsWith('user-')) {
        // Demo / offline mode — no real data
        setStudents([])
        setLoading(false)
        return
      }

      const schoolName = user!.school_name || ''
      if (!schoolName) {
        setStudents([])
        setLoading(false)
        return
      }

      // Load profiles for students at this school
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, curricula, created_at')
        .eq('role', 'student')
        .eq('school_name', schoolName)

      if (profilesErr || !profiles?.length) {
        setStudents([])
        setLoading(false)
        return
      }

      const ids = profiles.map(p => p.id)

      // Load session data per student
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('student_id, last_active')
        .in('student_id', ids)

      const sessionMap: Record<string, { count: number; last: string | null }> = {}
      for (const s of sessions ?? []) {
        if (!sessionMap[s.student_id]) sessionMap[s.student_id] = { count: 0, last: null }
        sessionMap[s.student_id].count++
        const curr = sessionMap[s.student_id].last
        if (!curr || s.last_active > curr) sessionMap[s.student_id].last = s.last_active
      }

      setStudents(profiles.map(p => ({
        id:            p.id,
        full_name:     p.full_name,
        email:         p.email,
        curricula:     (p.curricula as string[]) ?? [],
        created_at:    p.created_at,
        session_count: sessionMap[p.id]?.count ?? 0,
        last_active:   sessionMap[p.id]?.last   ?? null,
      })))
    } catch {
      setStudents([])
    }
    setLoading(false)
  }

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(query.toLowerCase()) ||
    s.email.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Users size={24} className="text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">{t('admin_students_title')}</h1>
          <p className="text-slate-400 text-sm">
            {t('admin_students_desc')}
            {user?.school_name && <span className="text-indigo-400"> — {user.school_name}</span>}
          </p>
        </div>
      </div>

      <div className="mb-5 max-w-sm">
        <Input
          placeholder={t('admin_search')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          icon={<Search size={16} />}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your students…</p>
        </div>
      ) : !user?.school_name ? (
        <div className="text-center py-16">
          <Users size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">School profile incomplete</p>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Your school name has not been set. Students are grouped by school name, so you will need to complete your profile before students appear here. Please contact your Compass administrator to update your school profile.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">{t('admin_no_students')}</p>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">{t('admin_no_students_sub')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-white/8">
                <th className="pb-3 font-medium">{t('admin_col_student')}</th>
                <th className="pb-3 font-medium">{t('admin_col_subjects')}</th>
                <th className="pb-3 font-medium">{t('admin_col_sessions')}</th>
                <th className="pb-3 font-medium">{t('admin_col_last_active')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-white/3 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {capitalizeName(student.full_name).charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{capitalizeName(student.full_name)}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1">
                      {student.curricula.map(c => (
                        <span key={c} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 text-white font-medium">{student.session_count}</td>
                  <td className="py-4 text-slate-400 text-sm">{formatRelative(student.last_active)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
