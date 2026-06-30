import type { DrawAnnotation, LearningTopic, TopicStep, CircleWidgetState } from './learningTypes'

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined

export interface LearningResponse {
  response_text: string
  annotations: DrawAnnotation[]
  is_correct: boolean
  advance_step: boolean
}

export async function queryLearningCompanion(
  topic: LearningTopic,
  step: TopicStep,
  widgetState: CircleWidgetState,
  trigger: 'widget_change' | 'check' | 'session_start',
  hintsUsed: number,
): Promise<LearningResponse> {
  if (!ANTHROPIC_KEY || ANTHROPIC_KEY.includes('placeholder')) {
    return getMockResponse(step, widgetState, trigger)
  }

  const correct = step.correctState
  const systemPrompt = `You are Compass — a warm, playful AI tutor for Zimbabwean students (ZIMSEC curriculum).
You live INSIDE an interactive widget. The student can see you. You are brief and encouraging.

Topic: "${topic.title}"
Step instruction: "${step.instruction}" ${step.equation ? `| Equation: ${step.equation}` : ''}
Correct answer: centre (${correct.center.x}, ${correct.center.y}), radius ${correct.radius}
Student's current state: centre (${widgetState.center.x}, ${widgetState.center.y}), radius ${widgetState.radius}
Trigger: ${trigger} | Hints given so far: ${hintsUsed}

RULES:
- Never reveal the direct answer
- Max 2 sentences. Warm, conversational, specific to what you see
- Use Zimbabwe-relevant language naturally
- ghost_sketch: faint dashed circle showing roughly the right size/position (opacity 0.2, never full answer)
- Only add annotations when genuinely helpful
- If state is correct: is_correct=true, advance_step=true, celebrate with 1 joyful sentence

Respond ONLY with valid JSON (no markdown fences):
{"response_text":"...","annotations":[],"is_correct":false,"advance_step":false}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Respond now.' }],
      }),
    })
    const data = await res.json()
    const raw = (data.content?.[0]?.text ?? '{}').trim()
    const parsed = JSON.parse(raw)
    return {
      response_text: parsed.response_text ?? "Keep going!",
      annotations: (parsed.annotations ?? []) as DrawAnnotation[],
      is_correct: parsed.is_correct ?? false,
      advance_step: parsed.advance_step ?? false,
    }
  } catch {
    return getMockResponse(step, widgetState, trigger)
  }
}

function getMockResponse(
  step: TopicStep,
  widgetState: CircleWidgetState,
  trigger: 'widget_change' | 'check' | 'session_start',
): LearningResponse {
  const c = step.correctState
  const s = widgetState
  const centerOk = Math.abs(s.center.x - c.center.x) < 0.6 && Math.abs(s.center.y - c.center.y) < 0.6
  const radiusOk = Math.abs(s.radius - c.radius) < 0.6

  if (centerOk && radiusOk) {
    return { response_text: "YES — that's exactly it! Perfect circle, well done!", annotations: [], is_correct: true, advance_step: true }
  }

  if (trigger === 'session_start') {
    return {
      response_text: `Let's graph this one together — start by finding the centre from the equation.`,
      annotations: [],
      is_correct: false,
      advance_step: false,
    }
  }

  if (trigger === 'check') {
    if (!centerOk) {
      return {
        response_text: `The centre needs a small adjustment — look at what (x − h)² tells you about h.`,
        annotations: [
          { id: 'a1', type: 'highlight', target: { x: c.center.x - 0.5, y: c.center.y + 0.5, x2: 1, y2: 1 }, style: { color: '#f59e0b', opacity: 0.35 } },
        ],
        is_correct: false,
        advance_step: false,
      }
    }
    if (!radiusOk) {
      return {
        response_text: `Centre is spot on! Now check your radius — r² = ${c.radius ** 2} means r = ?`,
        annotations: [
          { id: 'a2', type: 'ghost_sketch', target: { x: c.center.x, y: c.center.y, r: c.radius }, style: { color: '#6366f1', opacity: 0.22, dashArray: '8 5', strokeWidth: 2 } },
        ],
        is_correct: false,
        advance_step: false,
      }
    }
  }

  return {
    response_text: "Looking good — drag the centre first, then pull the radius handle.",
    annotations: [],
    is_correct: false,
    advance_step: false,
  }
}
