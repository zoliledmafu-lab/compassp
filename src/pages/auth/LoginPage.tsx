import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Compass, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { AUTH_PAGE_BG } from '../../lib/constants'

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

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [showPassword,  setShowPassword]  = useState(false)
  const [rememberMe,    setRememberMe]    = useState(true)
  const [error,         setError]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  React.useEffect(() => {
    const oauthErr = sessionStorage.getItem('compass_oauth_error')
    if (oauthErr) { setError(oauthErr); sessionStorage.removeItem('compass_oauth_error') }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn(email, password, rememberMe)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/dashboard')
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const result = await signInWithGoogle()
    setGoogleLoading(false)
    if (result.error) setError(result.error)
  }

  const fillDemo = (role: 'student' | 'admin') => {
    setEmail(role === 'admin' ? 'admin@compass.edu' : 'student@compass.edu')
    const adminPw = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'admin123'
    const studentPw = import.meta.env.VITE_DEMO_STUDENT_PASSWORD || 'student123'
    setPassword(role === 'admin' ? adminPw : studentPw)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: AUTH_PAGE_BG }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-primary rounded-2xl glow mb-4">
            <Compass size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Welcome back</h1>
          <p className="text-slate-400 mt-2">Sign in to your Compass account</p>
        </div>

        {/* Demo shortcuts */}
        <div className="glass rounded-2xl p-4 mb-6">
          <p className="text-xs text-slate-400 mb-3 text-center font-medium uppercase tracking-wider">Quick Demo Access</p>
          <div className="flex gap-2">
            <button onClick={() => fillDemo('student')} className="flex-1 px-3 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 text-sm hover:bg-indigo-500/30 transition-colors border border-indigo-500/20">
              Student Demo
            </button>
            <button onClick={() => fillDemo('admin')} className="flex-1 px-3 py-2 rounded-xl bg-purple-500/20 text-purple-300 text-sm hover:bg-purple-500/30 transition-colors border border-purple-500/20">
              Admin Demo
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="glass-dark rounded-2xl p-6">
          {/* Google OAuth */}
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
            <span className="text-xs text-slate-500">or sign in with email</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
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
              autoComplete="current-password"
            />

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                role="checkbox"
                aria-checked={rememberMe}
                tabIndex={0}
                onClick={() => setRememberMe(v => !v)}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setRememberMe(v => !v) } }}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0f0f1a] ${rememberMe ? 'border-indigo-500 bg-indigo-500' : 'border-white/20 bg-transparent'}`}
              >
                {rememberMe && (
                  <svg viewBox="0 0 12 12" width="10" height="10">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-slate-400">Remember me</span>
            </label>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
              Sign in
            </Button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-5">
            New to Compass?{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
