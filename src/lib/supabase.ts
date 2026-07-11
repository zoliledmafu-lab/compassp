import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const SUPABASE_ENABLED =
  !!supabaseUrl &&
  !supabaseUrl.includes('placeholder') &&
  !!supabaseAnonKey &&
  !supabaseAnonKey.includes('placeholder')

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
)

// ─── Shared types ─────────────────────────────────────────────────

export type UserRole = 'student' | 'admin'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  school_name?: string
  created_at: string
  curricula?: string[]
}

export interface StudentMemory {
  id: string
  student_id: string
  subject: string
  strengths: string[]
  struggles: string[]
  preferred_style: 'visual' | 'verbal' | 'step-by-step' | 'mixed'
  topics_covered: string[]
  session_count: number
  last_session_summary: string
  last_session_date: string
  updated_at: string
}

export interface RuleConfig {
  id: string
  institution_id?: string
  no_direct_answers: boolean
  ask_clarifying_question: boolean
  always_encouraging: boolean
  max_hints_before_break: number
  flag_repeated_answer_attempts: boolean
  // Progressive scaffolding settings
  max_scaffold_level: number                   // hintCount at which Level 4 triggers (default 3)
  emotional_detection_enabled: boolean         // detect & acknowledge frustration signals (default true)
  celebration_tone: 'formal' | 'informal'      // tone for correct-answer praise (default 'informal')
  updated_at: string
}

export interface ChatSession {
  id: string
  student_id: string
  subject: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface CanvasItem {
  id: string
  student_id: string
  type: 'note' | 'image' | 'excerpt' | 'diagram'
  content: string
  x: number
  y: number
  width: number
  height: number
  color: string
  created_at: string
}
