import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Compass, GraduationCap, Shield, Eye, EyeOff, ChevronRight, ChevronLeft, Building2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import type { UserRole } from '../../lib/supabase'
import { AUTH_PAGE_BG } from '../../lib/constants'

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

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [step,         setStep]         = useState<1 | 2>(1)
  const [fullName,     setFullName]     = useState('')
  const [schoolName,   setSchoolName]   = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [role,         setRole]         = useState<UserRole>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [curriculum,   setCurriculum]   = useState('')
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)

  const passwordStrength = (() => {
    const checks = {
      length:  password.length >= 8,
      upper:   /[A-Z]/.test(password),
      lower:   /[a-z]/.test(password),
      number:  /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }
    const passed = Object.values(checks).filter(Boolean).length
    return { checks, score: passed }
  })()

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordStrength.score < 5) {
      setError('Password does not meet all requirements below.')
      return
    }
    setError('')
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!curriculum) { setError('Please choose your curriculum'); return }
    setLoading(true)
    const option = CURRICULUM_OPTIONS.find(o => o.id === curriculum)!
    const result = await signUp(email, password, fullName, role, [...option.codes], schoolName)
    setLoading(false)
    if (result.error) { setError(result.error); setStep(1) }
    else { navigate('/dashboard') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: AUTH_PAGE_BG }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-primary rounded-2xl glow mb-4">
            <Compass size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Join Compass</h1>
          <p className="text-slate-400 mt-2">
            {step === 1 ? 'Your AI-powered study companion' : 'What curriculum are you following?'}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2].map(n => (
            <div key={n} className={`h-1.5 rounded-full transition-all duration-300 ${n === step ? 'w-8 bg-indigo-500' : n < step ? 'w-4 bg-indigo-700' : 'w-4 bg-white/10'}`} />
          ))}
        </div>

        <div className="glass-dark rounded-2xl p-6">

          {/* ── Step 1: Credentials ─────────────────────────────────── */}
          {step === 1 && (
            <>
              <form onSubmit={handleStep1} className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-2">I am a…</p>
                  <div className="flex gap-3">
                    {(['student', 'admin'] as UserRole[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                          role === r
                            ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                            : 'border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {r === 'student' ? <GraduationCap size={22} /> : <Shield size={22} />}
                        <span className="text-sm font-medium capitalize">{r}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Input label="Full name" type="text" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} icon={<User size={16} />} required />
                <Input label="School name" type="text" placeholder="e.g. Harare High School" value={schoolName} onChange={e => setSchoolName(e.target.value)} icon={<Building2 size={16} />} required />
                <Input label="Email address" type="email" placeholder="you@school.edu" value={email} onChange={e => setEmail(e.target.value)} icon={<Mail size={16} />} required autoComplete="email" />
                <div>
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    icon={<Lock size={16} />}
                    rightIcon={
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="text-slate-400 hover:text-white transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                    required
                    autoComplete="new-password"
                  />
                  {password.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {[
                        { key: 'length',  label: 'At least 8 characters',       ok: passwordStrength.checks.length },
                        { key: 'upper',   label: 'One uppercase letter (A–Z)',   ok: passwordStrength.checks.upper },
                        { key: 'lower',   label: 'One lowercase letter (a–z)',   ok: passwordStrength.checks.lower },
                        { key: 'number',  label: 'One number (0–9)',             ok: passwordStrength.checks.number },
                        { key: 'special', label: 'One symbol (e.g. ! @ # $ %)', ok: passwordStrength.checks.special },
                      ].map(r => (
                        <div key={r.key} className="flex items-center gap-1.5">
                          <span className={`text-xs ${r.ok ? 'text-green-400' : 'text-slate-500'}`}>
                            {r.ok ? '✓' : '○'}
                          </span>
                          <span className={`text-xs ${r.ok ? 'text-green-400' : 'text-slate-500'}`}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
                )}

                <Button type="submit" size="lg" className="mt-2 w-full">
                  Continue <ChevronRight size={16} className="ml-1" />
                </Button>
              </form>
            </>
          )}

          {/* ── Step 2: Curriculum ──────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError('') }}
                  className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <Button type="submit" loading={loading} size="lg" className="flex-1">
                  Create account
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-slate-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
