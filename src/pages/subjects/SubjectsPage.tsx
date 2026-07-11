import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MessageSquare } from 'lucide-react'
import { SUBJECTS, SUBJECTS_BY_CURRICULUM, CURRICULUM_META, type CurriculumCode } from '../../lib/subjects'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'

type Tab = 'ALL' | CurriculumCode

const ALL_TABS: { id: Tab; label: string; flag: string }[] = [
  { id: 'ALL',         label: 'All',              flag: '🌐' },
  { id: 'NSC',         label: 'NSC',              flag: '🇿🇦' },
  { id: 'ZIMSEC-OL',   label: 'ZIMSEC O-Level',   flag: '🇿🇼' },
  { id: 'ZIMSEC-AL',   label: 'ZIMSEC A-Level',   flag: '🇿🇼' },
  { id: 'CAM-IGCSE',   label: 'IGCSE',            flag: '🎓' },
  { id: 'CAM-AL',      label: 'A Level',          flag: '🎓' },
]

function getDefaultTab(curricula?: string[]): Tab {
  if (!curricula?.length) return 'ALL'
  if (curricula.includes('ZIMSEC-OL')) return 'ZIMSEC-OL'
  if (curricula.includes('CAM-IGCSE')) return 'CAM-IGCSE'
  if (curricula.includes('NSC')) return 'NSC'
  return 'ALL'
}

export function SubjectsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const TABS = useMemo(() => {
    const curricula = user?.curricula
    if (!curricula?.length) return ALL_TABS
    return ALL_TABS.filter(tab => {
      if (tab.id === 'ALL') return true
      return curricula.includes(tab.id)
    })
  }, [user?.curricula])

  const [query,       setQuery]       = useState('')
  const [activeTab,   setActiveTab]   = useState<Tab>(() => getDefaultTab(user?.curricula))

  const pool = activeTab === 'ALL' ? SUBJECTS : (SUBJECTS_BY_CURRICULUM[activeTab as CurriculumCode] ?? [])

  const filtered = pool.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.description.toLowerCase().includes(query.toLowerCase())
  )

  const meta = activeTab !== 'ALL' ? CURRICULUM_META[activeTab as CurriculumCode] : null

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Subjects</h1>
        <p className="text-slate-400 text-sm sm:text-base">Choose your curriculum and subject — Compass will guide you through it.</p>
      </div>

      {/* Curriculum tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setQuery('') }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
              activeTab === tab.id
                ? 'bg-white/15 text-white border border-white/20'
                : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/8'
            }`}
          >
            <span>{tab.flag}</span>
            <span>{tab.label}</span>
            <span className="ml-1 text-xs text-slate-500">
              {tab.id === 'ALL' ? SUBJECTS.length : SUBJECTS_BY_CURRICULUM[tab.id as CurriculumCode]?.length ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Curriculum description banner */}
      {meta && (
        <div
          className="mb-5 rounded-xl px-4 py-3 border flex items-start gap-3"
          style={{ background: `${meta.color}10`, borderColor: `${meta.color}30` }}
        >
          <span className="text-2xl mt-0.5">{meta.flag}</span>
          <div>
            <p className="text-sm font-semibold text-white">{meta.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === 'ZIMSEC-OL' && 'Zimbabwe School Examinations Council — Ordinary Level (Form 3–4). Sit papers in November. Grades A–U.'}
              {activeTab === 'ZIMSEC-AL' && 'Zimbabwe School Examinations Council — Advanced Level (Form 5–6). University entry qualification. Grades A–E.'}
              {activeTab === 'CAM-IGCSE' && 'Cambridge Assessment International Education — IGCSE. Globally recognised at age 14–16. Core and Extended tiers available.'}
              {activeTab === 'CAM-AL' && 'Cambridge AS & A Level — internationally recognised university entry qualification. AS is Year 1; A Level adds Year 2.'}
              {activeTab === 'NSC' && 'South African National Senior Certificate — CAPS curriculum. Matric qualification. Exam in October–November.'}
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-5 sm:mb-6 max-w-full sm:max-w-sm">
        <Input
          placeholder={`Search ${activeTab === 'ALL' ? 'all subjects' : meta?.label ?? ''} …`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          icon={<Search size={16} />}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          No subjects match "{query}"
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(subject => {
            const cMeta = CURRICULUM_META[subject.curriculumCode]
            return (
              <Card
                key={subject.id}
                hover
                onClick={() => navigate(`/chat?subject=${subject.id}`)}
                className="flex flex-col gap-3"
              >
                {/* Icon + name row */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${subject.color}22`, border: `1px solid ${subject.color}44` }}
                  >
                    {subject.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white leading-tight text-sm">{subject.name}</h3>
                    {/* Curriculum badge */}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs">{cMeta.flag}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                        style={{ background: `${cMeta.color}20`, color: cMeta.color }}
                      >
                        {cMeta.shortLabel}
                      </span>
                      {subject.paperCodes?.length && (
                        <span className="text-xs text-slate-600 font-mono">{subject.paperCodes[0]}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed flex-1">{subject.description}</p>

                {/* Exam style + CTA */}
                <div className="flex items-end justify-between pt-2 border-t border-white/5 gap-2">
                  <span className="text-xs text-slate-600 leading-tight line-clamp-2 flex-1">{subject.examStyle}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={e => { e.stopPropagation(); navigate(`/chat?subject=${subject.id}`) }}
                  >
                    <MessageSquare size={12} /> Study
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
