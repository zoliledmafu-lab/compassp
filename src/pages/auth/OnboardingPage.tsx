import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Building2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const CURRICULUM_OPTIONS = [
  {
    id: 'zimsec',
    label: 'ZIMSEC',
    sub: 'O-Level & A-Level · Zimbabwe',
    flag: '🇿🇼',
    color: '#f59e0b',
    codes: ['ZIMSEC-OL', 'ZIMSEC-AL'],
  },
  {
    id: 'cambridge',
    label: 'Cambridge',
    sub: 'IGCSE & A Level · International',
    flag: '🎓',
    color: '#3b82f6',
    codes: ['CAM-IGCSE', 'CAM-AL'],
  },
  {
    id: 'both',
    label: 'Both',
    sub: 'ZIMSEC + Cambridge',
    flag: '🌐',
    color: '#8b5cf6',
    codes: ['ZIMSEC-OL', 'ZIMSEC-AL', 'CAM-IGCSE', 'CAM-AL'],
  },
] as const

const bg = 'radial-gradient(ellipse at 30% 20%, rgba(79,70,229,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(124,58,237,0.1) 0%, transparent 60%), #0f0f1a'

export function OnboardingPage() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()

  const [schoolName, setSchoolName] = useState('')
  const [curriculum, setCurriculum] = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!curriculum) { setError('Please choose your curriculum'); return }
    setError('')
    setLoading(true)

    const option = CURRICULUM_OPTIONS.find(o => o.id === curriculum)!
    const curricula = [...option.codes]

    try {
      if (user) {
        await supabase
          .from('profiles')
          .update({ school_name: schoolName.trim(), curricula })
          .eq('id', user.id)
        updateProfile({ school_name: schoolName.trim(), curricula })
      }
    } catch {
      // profiles table may not be ready — still proceed
    }

    setLoading(false)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: bg }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-primary rounded-2xl glow mb-4">
            <Compass size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Almost there!</h1>
          <p className="text-slate-400 mt-2">Just a couple more things to personalise your experience</p>
        </div>

        <div className="glass-dark rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="School name (optional)"
              type="text"
              placeholder="e.g. Harare High School"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              icon={<Building2 size={16} />}
            />

            <div>
              <p className="text-sm font-medium text-slate-300 mb-3">Which curriculum are you following?</p>
              <div className="grid gap-3">
                {CURRICULUM_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setCurriculum(opt.id); setError('') }}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      curriculum === opt.id
                        ? 'border-indigo-500 bg-indigo-500/15'
                        : 'border-white/10 hover:border-white/25 hover:bg-white/5'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: `${opt.color}18`, border: `1px solid ${opt.color}33` }}
                    >
                      {opt.flag}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${curriculum === opt.id ? 'text-indigo-300' : 'text-white'}`}>{opt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${curriculum === opt.id ? 'border-indigo-500 bg-indigo-500' : 'border-white/20'}`}>
                      {curriculum === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              Get started
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
