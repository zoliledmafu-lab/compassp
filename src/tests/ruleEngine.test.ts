import { describe, it, expect } from 'vitest'
import {
  getScaffoldLevel,
  detectDirectAnswerAttempt,
  detectFrustration,
  buildSystemPrompt,
} from '../lib/ruleEngine'
import type { Subject } from '../lib/subjects'
import type { RuleConfig } from '../lib/supabase'

const mockSubject: Subject = {
  id: 'nsc-mathematics',
  name: 'Mathematics',
  icon: '∑',
  color: '#4f46e5',
  description: 'Algebra, calculus, geometry',
  curriculum: 'NSC',
  curriculumCode: 'NSC',
  examStyle: 'Structured problems with full working required',
}

const mockRules: RuleConfig = {
  id: 'test',
  no_direct_answers: true,
  ask_clarifying_question: true,
  always_encouraging: true,
  max_hints_before_break: 5,
  flag_repeated_answer_attempts: true,
  max_scaffold_level: 3,
  emotional_detection_enabled: true,
  celebration_tone: 'informal',
  updated_at: new Date().toISOString(),
}

// ─── getScaffoldLevel ──────────────────────────────────────────────────────────

describe('getScaffoldLevel', () => {
  it('returns 1 when hintCount is 0', () => {
    expect(getScaffoldLevel(0, 3)).toBe(1)
  })

  it('returns 2 when hintCount is 1', () => {
    expect(getScaffoldLevel(1, 3)).toBe(2)
  })

  it('returns 3 when hintCount is 2 with maxScaffoldLevel 3', () => {
    expect(getScaffoldLevel(2, 3)).toBe(3)
  })

  it('returns 4 when hintCount equals maxScaffoldLevel', () => {
    expect(getScaffoldLevel(3, 3)).toBe(4)
  })

  it('returns 4 when hintCount exceeds maxScaffoldLevel', () => {
    expect(getScaffoldLevel(10, 3)).toBe(4)
  })
})

// ─── detectDirectAnswerAttempt ─────────────────────────────────────────────────

describe('detectDirectAnswerAttempt', () => {
  it('detects "just give me the answer"', () => {
    expect(detectDirectAnswerAttempt('just give me the answer')).toBe(true)
  })

  it('detects "solve this for me"', () => {
    expect(detectDirectAnswerAttempt('solve this for me')).toBe(true)
  })

  it('detects "stop asking questions"', () => {
    expect(detectDirectAnswerAttempt('stop asking questions')).toBe(true)
  })

  it('returns false for a normal explanatory question', () => {
    expect(detectDirectAnswerAttempt('can you explain this concept to me')).toBe(false)
  })
})

// ─── detectFrustration ────────────────────────────────────────────────────────

describe('detectFrustration', () => {
  it('returns true when message matches a direct-answer pattern', () => {
    expect(detectFrustration('just tell me the answer', [])).toBe(true)
  })

  it('returns true for very short messages (under 5 words)', () => {
    expect(detectFrustration('help', [])).toBe(true)
  })

  it('returns true when message is repeated verbatim in recent messages', () => {
    const msg = 'I still do not understand this topic at all'
    expect(detectFrustration(msg, [msg])).toBe(true)
  })

  it('returns true for case-insensitive repetition', () => {
    expect(
      detectFrustration('I Need Help With This Please', ['i need help with this please'])
    ).toBe(true)
  })

  it('returns false for a new, normal-length, non-frustrated message', () => {
    expect(detectFrustration('I need more help with this problem', [])).toBe(false)
  })
})

// ─── buildSystemPrompt ────────────────────────────────────────────────────────

describe('buildSystemPrompt', () => {
  it('starts with the English-only rule', () => {
    const prompt = buildSystemPrompt(mockRules, mockSubject, null, 0)
    expect(prompt.startsWith('=== LANGUAGE RULE')).toBe(true)
  })

  it('includes FRUSTRATION DETECTED section when frustration flag is true', () => {
    const prompt = buildSystemPrompt(mockRules, mockSubject, null, 0, true)
    expect(prompt).toContain('FRUSTRATION DETECTED')
  })

  it('omits FRUSTRATION DETECTED section when frustration flag is false', () => {
    const prompt = buildSystemPrompt(mockRules, mockSubject, null, 0, false)
    expect(prompt).not.toContain('FRUSTRATION DETECTED')
  })

  it('includes the subject name in the generated prompt', () => {
    const prompt = buildSystemPrompt(mockRules, mockSubject, null, 0)
    expect(prompt).toContain('Mathematics')
  })

  it('includes scaffold level instruction in the prompt', () => {
    const prompt = buildSystemPrompt(mockRules, mockSubject, null, 0)
    expect(prompt).toContain('LEVEL 1')
  })
})
