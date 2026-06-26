import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Compass, GraduationCap, Shield, Eye, EyeOff, ChevronRight, ChevronLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import type { UserRole } from '../../lib/supabase'

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [step,         setStep]         = useState<1 | 2>(1)
  const [fullName,     setFullName]     = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [role,         setRole]         = useState<UserRole>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [curriculum,   setCurriculum]   = useState('')

  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError('')
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!curriculum) { setError('Please choose your curriculum'); return }
    setError('')
    setLoading(true)
    const option = CURRICULUM_OPTIONS.find(o => o.id === curriculum)!
    const result = await signUp(email, password, fullName, role, [...option.codes])
    setLoading(false)
    if (result.error) { setError(result.error); setStep(1) }
    else navigate('/dashboard')
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const result = await signInWithGoogle()
    setGoogleLoading(false)
    if (result.error) setError(result.error)
  }

  const bg = 'radial-gradient(ellipse at 30% 20%, rgba(79,70,229,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(124,58,237,0.1) 0%, transparent 60%), #0f0f1a'

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: bg }}>
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
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-slate-800 font-medium text-sm hover:bg-slate-100 transition-colors mb-4 disabled:opacity-60"
              >
                <GoogleIcon />
                {googleLoading ? 'Redirecting…' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-xs text-slate-500">or sign up with email</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

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
                <Input label="Email address" type="email" placeholder="you@school.edu" value={email} onChange={e => setEmail(e.target.value)} icon={<Mail size={16} />} required autoComplete="email" />
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
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
