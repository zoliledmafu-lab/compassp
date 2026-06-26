import { SUBJECTS, type Subject, type CurriculumCode } from './subjects'
import type { UserProfile } from './supabase'

const PREFIX = 'compass_pinned_'

export function getPinnedIds(userId: string): string[] {
  try { return JSON.parse(localStorage.getItem(PREFIX + userId) || '[]') } catch { return [] }
}

export function setPinnedIds(userId: string, ids: string[]): void {
  localStorage.setItem(PREFIX + userId, JSON.stringify(ids))
}

export function togglePin(userId: string, id: string): string[] {
  const current = getPinnedIds(userId)
  const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
  setPinnedIds(userId, next)
  return next
}

export function getPinnedSubjects(userId: string): Subject[] {
  const ids = getPinnedIds(userId)
  return ids.map(id => SUBJECTS.find(s => s.id === id)).filter(Boolean) as Subject[]
}

// Returns subjects allowed by the user's curriculum selection
export function getCurriculumSubjects(user: UserProfile | null): Subject[] {
  if (!user?.curricula?.length) return SUBJECTS
  const codes = user.curricula as CurriculumCode[]
  return SUBJECTS.filter(s => codes.includes(s.curriculumCode))
}
