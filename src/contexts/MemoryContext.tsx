import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase, SUPABASE_ENABLED } from '../lib/supabase'
import type { StudentMemory } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface MemoryContextValue {
  getMemory: (studentId: string, subject: string) => StudentMemory | null
  updateMemory: (studentId: string, subject: string, updates: Partial<StudentMemory>) => void
}

const MemoryContext = createContext<MemoryContextValue | null>(null)

// ─── localStorage fallback ────────────────────────────────────────────────────

const LS_KEY = 'compass_memory'

function lsLoadAll(): Record<string, StudentMemory> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function lsSaveAll(data: Record<string, StudentMemory>) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

function memKey(studentId: string, subject: string) {
  return `${studentId}:${subject}`
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  // In-memory cache keyed by "studentId:subject"
  const [cache, setCache] = useState<Record<string, StudentMemory>>(lsLoadAll)
  const cacheRef = useRef(cache)
  cacheRef.current = cache

  // ── Load from Supabase when user changes ──────────────────────────────────
  useEffect(() => {
    if (!SUPABASE_ENABLED || !user) return
    supabase
      .from('student_memory')
      .select('*')
      .eq('student_id', user.id)
      .then(({ data }) => {
        if (!data) return
        setCache(prev => {
          const next = { ...prev }
          data.forEach((m: StudentMemory) => { next[memKey(m.student_id, m.subject)] = m })
          return next
        })
      })
  }, [user?.id]) // eslint-disable-line

  // ── Synchronous read (from cache) ─────────────────────────────────────────
  const getMemory = useCallback(
    (studentId: string, subject: string): StudentMemory | null =>
      cacheRef.current[memKey(studentId, subject)] ?? null,
    [],
  )

  // ── Write: update cache + sync to Supabase (or localStorage) ─────────────
  const updateMemory = useCallback((
    studentId: string,
    subject: string,
    updates: Partial<StudentMemory>,
  ) => {
    setCache(prev => {
      const key = memKey(studentId, subject)
      const existing: StudentMemory = prev[key] ?? {
        id: `mem-${Date.now()}`,
        student_id: studentId,
        subject,
        strengths: [],
        struggles: [],
        preferred_style: 'mixed' as const,
        topics_covered: [],
        session_count: 0,
        last_session_summary: '',
        last_session_date: '',
        updated_at: new Date().toISOString(),
      }
      const next: StudentMemory = { ...existing, ...updates, updated_at: new Date().toISOString() }
      const nextCache = { ...prev, [key]: next }

      if (SUPABASE_ENABLED && studentId && !studentId.startsWith('user-')) {
        // Upsert to Supabase (fire and forget)
        supabase.from('student_memory').upsert({
          student_id: studentId,
          subject,
          strengths:            next.strengths,
          struggles:            next.struggles,
          preferred_style:      next.preferred_style,
          topics_covered:       next.topics_covered,
          session_count:        next.session_count,
          last_session_summary: next.last_session_summary,
          last_session_date:    next.last_session_date,
        }, { onConflict: 'student_id,subject' })
      } else {
        lsSaveAll(nextCache)
      }

      return nextCache
    })
  }, [])

  return (
    <MemoryContext.Provider value={{ getMemory, updateMemory }}>
      {children}
    </MemoryContext.Provider>
  )
}

export function useMemory() {
  const ctx = useContext(MemoryContext)
  if (!ctx) throw new Error('useMemory must be used inside MemoryProvider')
  return ctx
}
