import { useState } from 'react'
import { Users, Search } from 'lucide-react'
import { Input } from '../../components/ui/Input'

const DEMO_STUDENTS = [
  { id: '1', name: 'Ayanda Dlamini', email: 'ayanda@school.edu', subjects: ['Mathematics', 'Physical Sciences'], sessions: 12, lastActive: '2 hours ago' },
  { id: '2', name: 'Lethiwe Nkosi', email: 'lethiwe@school.edu', subjects: ['Life Sciences', 'English'], sessions: 8, lastActive: '1 day ago' },
  { id: '3', name: 'Sipho Mokoena', email: 'sipho@school.edu', subjects: ['Accounting', 'Business Studies'], sessions: 5, lastActive: '3 days ago' },
  { id: '4', name: 'Nomsa Zulu', email: 'nomsa@school.edu', subjects: ['isiZulu', 'History'], sessions: 15, lastActive: '30 min ago' },
  { id: '5', name: 'Thabo Sithole', email: 'thabo@school.edu', subjects: ['Computer Science', 'Mathematics'], sessions: 20, lastActive: '1 hour ago' },
]

export function StudentsPage() {
  const [query, setQuery] = useState('')
  const filtered = DEMO_STUDENTS.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.email.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Users size={24} className="text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-slate-400 text-sm">Manage your student roster</p>
        </div>
      </div>

      <div className="mb-5 max-w-sm">
        <Input placeholder="Search students…" value={query} onChange={e => setQuery(e.target.value)} icon={<Search size={16} />} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-white/8">
              <th className="pb-3 font-medium">Student</th>
              <th className="pb-3 font-medium">Subjects</th>
              <th className="pb-3 font-medium">Sessions</th>
              <th className="pb-3 font-medium">Last active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map(student => (
              <tr key={student.id} className="hover:bg-white/3 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex flex-wrap gap-1">
                    {student.subjects.map(s => (
                      <span key={s} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="py-4 text-white font-medium">{student.sessions}</td>
                <td className="py-4 text-slate-400 text-sm">{student.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
