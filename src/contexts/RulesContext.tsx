import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, SUPABASE_ENABLED } from '../lib/supabase'
import type { RuleConfig } from '../lib/supabase'
import { DEFAULT_RULES } from '../lib/ruleEngine'

interface RulesContextValue {
  rules: RuleConfig
  updateRules: (updates: Partial<RuleConfig>) => void
}

const RulesContext = createContext<RulesContextValue | null>(null)
const LS_KEY = 'compass_rules'

export function RulesProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<RuleConfig>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      return stored ? JSON.parse(stored) : DEFAULT_RULES
    } catch {
      return DEFAULT_RULES
    }
  })

  // ── Load from Supabase on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!SUPABASE_ENABLED) return
    supabase
      .from('rules')
      .select('*')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setRules(data as RuleConfig)
      })
  }, [])

  const updateRules = (updates: Partial<RuleConfig>) => {
    setRules(prev => {
      const next: RuleConfig = { ...prev, ...updates, updated_at: new Date().toISOString() }

      if (SUPABASE_ENABLED) {
        supabase.from('rules').update({
          no_direct_answers:            next.no_direct_answers,
          ask_clarifying_question:      next.ask_clarifying_question,
          always_encouraging:           next.always_encouraging,
          max_hints_before_break:       next.max_hints_before_break,
          flag_repeated_answer_attempts: next.flag_repeated_answer_attempts,
        }).eq('id', next.id)
      } else {
        localStorage.setItem(LS_KEY, JSON.stringify(next))
      }

      return next
    })
  }

  return (
    <RulesContext.Provider value={{ rules, updateRules }}>
      {children}
    </RulesContext.Provider>
  )
}

export function useRules() {
  const ctx = useContext(RulesContext)
  if (!ctx) throw new Error('useRules must be used inside RulesProvider')
  return ctx
}
