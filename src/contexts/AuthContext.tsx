import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, SUPABASE_ENABLED } from '../lib/supabase'
import type { UserProfile, UserRole } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName: string, role: UserRole, curricula: string[], schoolName?: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signOut: () => void
  updateProfile: (updates: Partial<UserProfile>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── localStorage demo fallback ───────────────────────────────────────────────

const DEMO_USERS_KEY = 'compass_demo_users'
const DEMO_SESSION_KEY = 'compass_session'

function getDemoUsers(): Record<string, UserProfile & { password: string }> {
  try { return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '{}') } catch { return {} }
}
function saveDemoUsers(u: Record<string, UserProfile & { password: string }>) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(u))
}
function seedDemoUsers() {
  const users = getDemoUsers()
  if (!users['admin@compass.edu']) {
    users['admin@compass.edu'] = { id: 'admin-001', email: 'admin@compass.edu', full_name: 'Admin User', role: 'admin', created_at: new Date().toISOString(), password: 'admin123', curricula: ['ZIMSEC-OL', 'ZIMSEC-AL', 'CAM-IGCSE', 'CAM-AL'] }
    users['student@compass.edu'] = { id: 'student-001', email: 'student@compass.edu', full_name: 'Demo Student', role: 'student', created_at: new Date().toISOString(), password: 'student123', curricula: ['ZIMSEC-OL', 'ZIMSEC-AL'] }
    saveDemoUsers(users)
  }
}

// ─── Build a UserProfile from a Supabase auth User ───────────────────────────

function profileFromAuthUser(authUser: User): UserProfile {
  return {
    id:          authUser.id,
    email:       authUser.email ?? '',
    full_name:   authUser.user_metadata?.full_name ?? authUser.email?.split('@')[0] ?? 'User',
    role:        (authUser.user_metadata?.role as UserRole) ?? 'student',
    school_name: authUser.user_metadata?.school_name ?? '',
    created_at:  authUser.created_at,
    curricula:   authUser.user_metadata?.curricula ?? [],
  }
}

// Try to load the richer DB profile; fall back to auth-derived one.
async function resolveProfile(authUser: User): Promise<UserProfile> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()
    if (data) {
      // Merge curricula: prefer DB column, fall back to auth metadata
      const curricula: string[] =
        (data.curricula as string[] | null)?.length
          ? (data.curricula as string[])
          : (authUser.user_metadata?.curricula ?? [])
      return { ...data, curricula } as UserProfile
    }
  } catch { /* profiles table may not exist yet */ }
  return profileFromAuthUser(authUser)
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!SUPABASE_ENABLED) {
      seedDemoUsers()
      try {
        const raw = localStorage.getItem(DEMO_SESSION_KEY)
        if (raw) setUser(JSON.parse(raw))
      } catch { /* */ }
      setLoading(false)
      return
    }

    // Handle "don't remember me" — if flag set and no active tab, sign out
    const noPeristEmail = localStorage.getItem('compass_no_persist')
    if (noPeristEmail && !sessionStorage.getItem('compass_tab')) {
      supabase.auth.signOut().finally(() => {
        localStorage.removeItem('compass_no_persist')
      })
    }
    sessionStorage.setItem('compass_tab', '1')

    // Check for an existing session on mount — 6s timeout so a paused/slow
    // Supabase project never leaves the app stuck on the loading spinner.
    const timeout = new Promise<{ data: { session: null } }>(res =>
      setTimeout(() => res({ data: { session: null } }), 6000)
    )
    Promise.race([supabase.auth.getSession(), timeout]).then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(await resolveProfile(session.user))
      } else {
        // Capture OAuth error from URL before the router redirects away (e.g. failed Google sign-in)
        const params = new URLSearchParams(window.location.search)
        const oauthError = params.get('error_description') || params.get('error')
        if (oauthError) {
          sessionStorage.setItem('compass_oauth_error', decodeURIComponent(oauthError))
        }
      }
      setLoading(false)
    }).catch(() => setLoading(false))

    // Keep in sync with Supabase auth events (token refresh, sign-out from another tab, OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        if (session?.user) {
          setUser(await resolveProfile(session.user))
        } else {
          setUser(null)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line

  // ── Sign in ───────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string, rememberMe = true) => {
    if (!SUPABASE_ENABLED) {
      const users = getDemoUsers()
      const record = users[email.toLowerCase()]
      if (!record || record.password !== password) return { error: 'Invalid email or password' }
      const { password: _pw, ...profile } = record
      setUser(profile)
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(profile))
      if (!rememberMe) {
        window.addEventListener('pagehide', () => localStorage.removeItem(DEMO_SESSION_KEY), { once: true })
      }
      return {}
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    if (!rememberMe) {
      // Clear Supabase session from localStorage when tab/browser closes
      localStorage.setItem('compass_no_persist', email)
      window.addEventListener('pagehide', () => {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sb-') && key.includes('-auth-token')) {
            localStorage.removeItem(key)
          }
        }
        localStorage.removeItem('compass_no_persist')
      }, { once: true })
    }

    const profile = await resolveProfile(data.user)
    setUser(profile)
    return {}
  }, [])

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    if (!SUPABASE_ENABLED) return { error: 'Google sign-in requires Supabase — running in demo mode.' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) return { error: error.message }
    return {}
  }, [])

  // ── Sign up ───────────────────────────────────────────────────────────────
  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    curricula: string[],
    schoolName = '',
  ) => {
    if (!SUPABASE_ENABLED) {
      const users = getDemoUsers()
      if (users[email.toLowerCase()]) return { error: 'An account with this email already exists' }
      const profile: UserProfile = { id: `user-${Date.now()}`, email: email.toLowerCase(), full_name: fullName, role, school_name: schoolName, created_at: new Date().toISOString(), curricula }
      users[email.toLowerCase()] = { ...profile, password }
      saveDemoUsers(users)
      sessionStorage.setItem('compass_new_signup', '1')
      setUser(profile)
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(profile))
      return {}
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role, curricula, school_name: schoolName } },
    })
    if (signUpError) return { error: signUpError.message }

    // Sign in immediately after signup
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) return { error: 'Account created! Please sign in.' }

    // Save all profile fields to the profiles table
    try {
      await supabase.from('profiles').update({ curricula, school_name: schoolName }).eq('id', data.user.id)
    } catch { /* table might not exist yet */ }

    const profile = await resolveProfile(data.user)
    sessionStorage.setItem('compass_new_signup', '1')
    setUser(profile)
    return {}
  }, [])

  // ── Sign out ──────────────────────────────────────────────────────────────
  const signOut = useCallback(() => {
    setUser(null)
    localStorage.removeItem('compass_no_persist')
    if (!SUPABASE_ENABLED) {
      localStorage.removeItem(DEMO_SESSION_KEY)
    } else {
      supabase.auth.signOut()
    }
  }, [])

  // ── Update profile ────────────────────────────────────────────────────────
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      if (SUPABASE_ENABLED) {
        supabase.from('profiles').update(updates).eq('id', prev.id)
      } else {
        localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(next))
      }
      return next
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
