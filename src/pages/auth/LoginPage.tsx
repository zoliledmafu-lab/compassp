import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Compass, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/dashboard')
    }
  }

  const fillDemo = (role: 'student' | 'admin') => {
    setEmail(role === 'admin' ? 'admin@compass.edu' : 'student@compass.edu')
    setPassword(role === 'admin' ? 'admin123' : 'student123')
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(79,70,229,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(124,58,237,0.1) 0%, transparent 60%), #0f0f1a' }}>
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
