import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Compass, GraduationCap, Shield, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import type { UserRole } from '../../lib/supabase'

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError('')
    setLoading(true)
    const result = await signUp(email, password, fullName, role)
    setLoading(false)
    if (result.error) setError(result.error)
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(79,70,229,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(124,58,237,0.1) 0%, transparent 60%), #0f0f1a' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-primary rounded-2xl glow mb-4">
            <Compass size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Join Compass</h1>
          <p className="text-slate-400 mt-2">Your AI-powered study companion</p>
        </div>

        <div className="glass-dark rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Role selector */}
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">I am a...</p>
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
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-slate-400 hover:text-white transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
              autoComplete="new-password"
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
              Create account
            </Button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
