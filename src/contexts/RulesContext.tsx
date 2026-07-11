import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, SUPABASE_ENABLED } from '../lib/supabase'
import type { RuleConfig } from '../lib/supabase'
import { DEFAULT_RULES } from '../lib/ruleEngine'
import { useAuth } from './AuthContext'

interface RulesContextValue {
  rules: RuleConfig
  updateRules: (updates: Partial<RuleConfig>) => void
}

const RulesContext = createContext<RulesContextValue | null>(null)

function lsKey(schoolName: string) {
  return `compass_rules_${schoolName || 'default'}`
}

export function RulesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const schoolName = user?.school_name || ''

  const [rules, setRules] = useState<RuleConfig>(() => {
    try {
      // Try school-scoped key first, fall back to legacy key
      const stored = localStorage.getItem(lsKey(schoolName))
        || localStorage.getItem('compass_rules')
      return stored ? { ...DEFAULT_RULES, ...JSON.parse(stored) } : DEFAULT_RULES
    } catch {
      return DEFAULT_RULES
    }
  })

  // Reload rules when the user/school changes
  useEffect(() => {
    if (!schoolName) return

    if (SUPABASE_ENABLED && user && !user.id.startsWith('user-')) {
      // Load from Supabase filtered by school (institution_id)
      supabase
        .from('rules')
        .select('*')
        .eq('institution_id', schoolName)
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setRules({ ...DEFAULT_RULES, ...data } as RuleConfig)
          } else {
            // No school-specific rules yet — use defaults
            setRules(DEFAULT_RULES)
          }
        })
    } else {
      // localStorage path — load school-scoped rules
      try {
        const stored = localStorage.getItem(lsKey(schoolName))
        if (stored) setRules({ ...DEFAULT_RULES, ...JSON.parse(stored) })
        else setRules(DEFAULT_RULES)
      } catch {
        setRules(DEFAULT_RULES)
      }
    }
  }, [schoolName, user?.id]) // eslint-disable-line

  const updateRules = (updates: Partial<RuleConfig>) => {
    // Only admins may update rules
    if (user?.role !== 'admin') return

    setRules(prev => {
      const next: RuleConfig = {
        ...prev,
        ...updates,
        institution_id: schoolName,
        updated_at: new Date().toISOString(),
      }

      if (SUPABASE_ENABLED && user && !user.id.startsWith('user-')) {
        supabase.from('rules').upsert({
          institution_id:                next.institution_id,
          no_direct_answers:             next.no_direct_answers,
          ask_clarifying_question:       next.ask_clarifying_question,
          always_encouraging:            next.always_encouraging,
          max_hints_before_break:        next.max_hints_before_break,
          flag_repeated_answer_attempts: next.flag_repeated_answer_attempts,
          max_scaffold_level:            next.max_scaffold_level,
          emotional_detection_enabled:   next.emotional_detection_enabled,
          celebration_tone:              next.celebration_tone,
          updated_at:                    next.updated_at,
        }, { onConflict: 'institution_id' })
      } else {
        localStorage.setItem(lsKey(schoolName), JSON.stringify(next))
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
