import type {
  DrawAnnotation,
  LearningTopic,
  TopicStep,
  WidgetState,
  WidgetType,
  CircleWidgetState,
  LinearWidgetState,
  QuadraticWidgetState,
  AngleWidgetState,
  PythagorasWidgetState,
  NumberLineWidgetState,
  BarChartWidgetState,
  ProcessDiagramWidgetState,
} from './learningTypes'

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined

export interface LearningResponse {
  response_text: string
  annotations: DrawAnnotation[]
  is_correct: boolean
  advance_step: boolean
}

// ── Correctness check ─────────────────────────────────────────────────────────

function isStateCorrect(widgetType: WidgetType, state: WidgetState, step: TopicStep): boolean {
  const correct = step.correctState
  const tol = step.tolerance ?? {}

  switch (widgetType) {
    case 'circle-graph': {
      const s = state as CircleWidgetState
      const c = correct as CircleWidgetState
      return Math.abs(s.center.x - c.center.x) < (tol.center ?? 0.6)
          && Math.abs(s.center.y - c.center.y) < (tol.center ?? 0.6)
          && Math.abs(s.radius - c.radius) < (tol.radius ?? 0.6)
    }
    case 'linear-graph': {
      const s = state as LinearWidgetState
      const c = correct as LinearWidgetState
      return Math.abs(s.slope - c.slope) < (tol.slope ?? 0.15)
          && Math.abs(s.intercept - c.intercept) < (tol.intercept ?? 0.35)
    }
    case 'quadratic-graph': {
      const s = state as QuadraticWidgetState
      const c = correct as QuadraticWidgetState
      return Math.abs(s.a - c.a) < (tol.a ?? 0.2)
          && Math.abs(s.h - c.h) < (tol.h ?? 0.4)
          && Math.abs(s.k - c.k) < (tol.k ?? 0.4)
    }
    case 'angle': {
      const s = state as AngleWidgetState
      const c = correct as AngleWidgetState
      return Math.abs(s.angleDeg - c.angleDeg) < (tol.angleDeg ?? 4)
    }
    case 'pythagoras': {
      const s = state as PythagorasWidgetState
      const c = correct as PythagorasWidgetState
      const pt = tol.side ?? 0.6
      return (Math.abs(s.a - c.a) < pt && Math.abs(s.b - c.b) < pt)
          || (Math.abs(s.a - c.b) < pt && Math.abs(s.b - c.a) < pt)
    }
    case 'number-line': {
      const s = state as NumberLineWidgetState
      const c = correct as NumberLineWidgetState
      return Math.abs(s.value - c.value) < (tol.value ?? 0.6)
    }
    case 'bar-chart': {
      const s = state as BarChartWidgetState
      const c = correct as BarChartWidgetState
      const bt = step.widgetConfig.barTolerance as number ?? tol.barTolerance ?? 3
      if (s.bars.length !== c.bars.length) return false
      return s.bars.every((b, i) => Math.abs(b - c.bars[i]) <= bt)
    }
    case 'process-diagram': {
      const s = state as ProcessDiagramWidgetState
      const c = correct as ProcessDiagramWidgetState
      return s.selectedStage === c.selectedStage && s.selectedStage !== ''
    }
  }
}

// ── State description for AI prompt ──────────────────────────────────────────

function describeState(widgetType: WidgetType, state: WidgetState, correct: WidgetState): string {
  switch (widgetType) {
    case 'circle-graph': {
      const s = state as CircleWidgetState; const c = correct as CircleWidgetState
      return `Student: centre (${s.center.x}, ${s.center.y}), radius ${s.radius}. Correct: centre (${c.center.x}, ${c.center.y}), radius ${c.radius}.`
    }
    case 'linear-graph': {
      const s = state as LinearWidgetState; const c = correct as LinearWidgetState
      return `Student: slope=${s.slope}, intercept=${s.intercept}. Correct: slope=${c.slope}, intercept=${c.intercept}.`
    }
    case 'quadratic-graph': {
      const s = state as QuadraticWidgetState; const c = correct as QuadraticWidgetState
      return `Student: a=${s.a}, vertex (${s.h}, ${s.k}). Correct: a=${c.a}, vertex (${c.h}, ${c.k}).`
    }
    case 'angle': {
      const s = state as AngleWidgetState; const c = correct as AngleWidgetState
      return `Student angle: ${s.angleDeg}°. Correct: ${c.angleDeg}°.`
    }
    case 'pythagoras': {
      const s = state as PythagorasWidgetState; const c = correct as PythagorasWidgetState
      return `Student: a=${s.a}, b=${s.b}. Correct: a=${c.a}, b=${c.b}.`
    }
    case 'number-line': {
      const s = state as NumberLineWidgetState; const c = correct as NumberLineWidgetState
      return `Student value: ${s.value}. Correct: ${c.value}.`
    }
    case 'bar-chart': {
      const s = state as BarChartWidgetState; const c = correct as BarChartWidgetState
      return `Student bars: [${s.bars.join(', ')}]. Correct: [${c.bars.join(', ')}].`
    }
    case 'process-diagram': {
      const s = state as ProcessDiagramWidgetState; const c = correct as ProcessDiagramWidgetState
      return `Student clicked: "${s.selectedStage || 'nothing yet'}". Target: "${c.selectedStage}". Visited: [${s.visitedStages.join(', ')}].`
    }
  }
}

// ── Main function ─────────────────────────────────────────────────────────────

export async function queryLearningCompanion(
  topic: LearningTopic,
  step: TopicStep,
  widgetState: WidgetState,
  trigger: 'widget_change' | 'check' | 'session_start',
  hintsUsed: number,
  languageInstruction?: string,
): Promise<LearningResponse> {
  if (!ANTHROPIC_KEY || ANTHROPIC_KEY.includes('placeholder')) {
    return getMockResponse(step, widgetState, trigger)
  }

  const systemPrompt = `${languageInstruction ? `${languageInstruction}\n\n` : ''}You are Compass — a warm, playful AI tutor for Zimbabwean students (ZIMSEC curriculum).
You live INSIDE an interactive widget. You are brief and encouraging.

Topic: "${topic.title}" (${topic.subjectId})
Step: "${step.title}" — ${step.instruction}${step.equation ? ` | Formula: ${step.equation}` : ''}
Widget type: ${step.widgetType}
${describeState(step.widgetType, widgetState, step.correctState)}
Trigger: ${trigger} | Hints used: ${hintsUsed}

RULES:
- Max 2 sentences. Warm, specific, relevant to ZIMSEC Zimbabwe context
- For graph widgets (circle-graph, linear-graph, quadratic-graph): use annotations when helpful
- For number-line, bar-chart, angle, pythagoras: empty annotations []
- If correct: is_correct=true, advance_step=true, one joyful sentence

Respond ONLY with valid JSON (no markdown):
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

// ── Chat with companion ───────────────────────────────────────────────────────

export async function chatWithCompanion(
  topic: LearningTopic,
  step: TopicStep,
  widgetState: WidgetState,
  studentMessage: string,
): Promise<{ text: string; annotations: DrawAnnotation[] }> {
  if (!ANTHROPIC_KEY || ANTHROPIC_KEY.includes('placeholder')) {
    return { text: getMockChatReply(step, studentMessage), annotations: [] }
  }

  const systemPrompt = `You are Compass — a warm, encouraging AI tutor for Zimbabwean ZIMSEC students.
Context: "${topic.title}" (${topic.subjectId}) | Step: "${step.title}"
Widget: ${step.widgetType} | State: ${describeState(step.widgetType, widgetState, step.correctState)}
Instruction: ${step.instruction}${step.equation ? ` | Formula: ${step.equation}` : ''}

RULES: Max 3 sentences. Answer the student's specific question. ZIMSEC context. Warm and specific.
For graph widgets (circle-graph, linear-graph, quadratic-graph): include annotations if it helps.
Respond ONLY with valid JSON: {"text":"...","annotations":[]}`

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
        messages: [{ role: 'user', content: studentMessage }],
      }),
    })
    const data = await res.json()
    const raw  = (data.content?.[0]?.text ?? '{}').trim()
    const parsed = JSON.parse(raw)
    return {
      text: parsed.text ?? "Great question! Keep exploring the widget.",
      annotations: (parsed.annotations ?? []) as DrawAnnotation[],
    }
  } catch {
    return { text: getMockChatReply(step, studentMessage), annotations: [] }
  }
}

function getMockChatReply(step: TopicStep, message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('hint') || lower.includes('help') || lower.includes('stuck') || lower.includes('how')) {
    return step.hints[0] ?? "Try moving the widget handle slowly and watch what changes!"
  }
  if (lower.includes('why') || lower.includes('what') || lower.includes('explain')) {
    return `${step.instruction}${step.equation ? ` The formula to use is: ${step.equation}.` : ''}`
  }
  if (lower.includes('correct') || lower.includes('right') || lower.includes('done')) {
    return "Press the Check button and I'll tell you if you've got it! Keep adjusting until it feels right."
  }
  return "Good thinking! Keep experimenting with the widget — you're making progress. Use the Hint button if you need a nudge."
}

// ── Mock responses per widget type ────────────────────────────────────────────

function getMockResponse(
  step: TopicStep,
  widgetState: WidgetState,
  trigger: 'widget_change' | 'check' | 'session_start',
): LearningResponse {
  if (isStateCorrect(step.widgetType, widgetState, step)) {
    return { response_text: "Yes — that's perfect! Well done!", annotations: [], is_correct: true, advance_step: true }
  }
  if (trigger === 'session_start') {
    return { response_text: getSessionStartMessage(step), annotations: [], is_correct: false, advance_step: false }
  }
  return getCheckOrChangeResponse(step, widgetState)
}

function getSessionStartMessage(step: TopicStep): string {
  switch (step.widgetType) {
    case 'circle-graph':    return "Let's graph this circle — start by finding the centre from the equation."
    case 'linear-graph':    return "Let's draw this line — start with the y-intercept, then set the gradient."
    case 'quadratic-graph': return "Let's sketch this parabola — first drag the vertex to the right position."
    case 'angle':           return "Drag the arm of the protractor to match the required angle."
    case 'pythagoras':      return "Drag the base and height handles to build the right triangle."
    case 'number-line':     return "Drag the marker to the correct position on the scale."
    case 'bar-chart':       return "Drag each bar's handle to the correct height — use the y-axis as your guide."
    case 'process-diagram': return "Explore the diagram — click on each part to learn what it does. Then click the one the question asks about."
  }
}

function getCheckOrChangeResponse(step: TopicStep, widgetState: WidgetState): LearningResponse {
  const correct = step.correctState
  switch (step.widgetType) {
    case 'circle-graph': {
      const s = widgetState as CircleWidgetState; const c = correct as CircleWidgetState
      const tol = step.tolerance ?? {}
      const centerOk = Math.abs(s.center.x - c.center.x) < (tol.center ?? 0.6) && Math.abs(s.center.y - c.center.y) < (tol.center ?? 0.6)
      if (!centerOk) return { response_text: `The centre needs adjusting — look at (x − h)² to find h and (y − k)² for k.`, annotations: [{ id: 'a1', type: 'highlight', target: { x: c.center.x, y: c.center.y, x2: 1.2, y2: 1.2 }, style: { color: '#f59e0b', opacity: 0.3 } }], is_correct: false, advance_step: false }
      return { response_text: `Centre is spot on! Now check your radius — r² = ${c.radius ** 2} so r = ${c.radius}.`, annotations: [{ id: 'a2', type: 'ghost_sketch', target: { x: c.center.x, y: c.center.y, r: c.radius }, style: { color: '#6366f1', opacity: 0.22, dashArray: '8 5', strokeWidth: 2 } }], is_correct: false, advance_step: false }
    }
    case 'linear-graph': {
      const s = widgetState as LinearWidgetState; const c = correct as LinearWidgetState
      const tol = step.tolerance ?? {}
      const interceptOk = Math.abs(s.intercept - c.intercept) < (tol.intercept ?? 0.35)
      if (!interceptOk) return { response_text: `Check the y-intercept — the line should cross the y-axis at ${c.intercept}.`, annotations: [], is_correct: false, advance_step: false }
      return { response_text: `Intercept is right! Adjust the gradient — it should be ${c.slope > 0 ? '+' : ''}${c.slope}.`, annotations: [], is_correct: false, advance_step: false }
    }
    case 'quadratic-graph': {
      const s = widgetState as QuadraticWidgetState; const c = correct as QuadraticWidgetState
      const tol = step.tolerance ?? {}
      const vertexOk = Math.abs(s.h - c.h) < (tol.h ?? 0.4) && Math.abs(s.k - c.k) < (tol.k ?? 0.4)
      if (!vertexOk) return { response_text: `Move the vertex to (${c.h}, ${c.k}).`, annotations: [], is_correct: false, advance_step: false }
      return { response_text: `Vertex is correct! Adjust the width handle — a = ${c.a}.`, annotations: [], is_correct: false, advance_step: false }
    }
    case 'angle': {
      const s = widgetState as AngleWidgetState; const c = correct as AngleWidgetState
      const diff = Math.abs(s.angleDeg - c.angleDeg)
      if (diff < 15) return { response_text: `Almost! You're at ${Math.round(s.angleDeg)}° — nudge ${s.angleDeg < c.angleDeg ? 'further' : 'back'} to ${c.angleDeg}°.`, annotations: [], is_correct: false, advance_step: false }
      return { response_text: `You're at ${Math.round(s.angleDeg)}°. Target is ${c.angleDeg}° — keep rotating.`, annotations: [], is_correct: false, advance_step: false }
    }
    case 'pythagoras': {
      const s = widgetState as PythagorasWidgetState; const c = correct as PythagorasWidgetState
      const pt = (step.tolerance ?? {}).side ?? 0.6
      const aOk = Math.abs(s.a - c.a) < pt || Math.abs(s.a - c.b) < pt
      if (!aOk) return { response_text: `Adjust the base leg to ${c.a}.`, annotations: [], is_correct: false, advance_step: false }
      return { response_text: `Base looks right! Drag the height to ${c.b}.`, annotations: [], is_correct: false, advance_step: false }
    }
    case 'number-line': {
      const s = widgetState as NumberLineWidgetState; const c = correct as NumberLineWidgetState
      const diff = Math.abs(s.value - c.value)
      if (diff < 2) return { response_text: `Very close! Nudge ${s.value < c.value ? 'right' : 'left'} to reach ${c.value}.`, annotations: [], is_correct: false, advance_step: false }
      return { response_text: `You're at ${s.value} — the target is ${c.value}. ${s.value < c.value ? 'Drag right.' : 'Drag left.'}`, annotations: [], is_correct: false, advance_step: false }
    }
    case 'bar-chart': {
      const s = widgetState as BarChartWidgetState; const c = correct as BarChartWidgetState
      const bt = (step.widgetConfig.barTolerance as number) ?? 3
      const wrongIdx = s.bars.findIndex((b, i) => Math.abs(b - c.bars[i]) > bt)
      if (wrongIdx >= 0) {
        const label = (step.widgetConfig.labels as string[])?.[wrongIdx] ?? `Bar ${wrongIdx + 1}`
        return { response_text: `${label} needs adjusting — it should be ${c.bars[wrongIdx]}.`, annotations: [], is_correct: false, advance_step: false }
      }
      return { response_text: "Almost there — check all bars are at the correct heights.", annotations: [], is_correct: false, advance_step: false }
    }
    case 'process-diagram': {
      const s = widgetState as ProcessDiagramWidgetState
      const c = correct as ProcessDiagramWidgetState
      if (!s.selectedStage) return { response_text: "Click on one of the labelled parts of the diagram to begin exploring!", annotations: [], is_correct: false, advance_step: false }
      if (s.selectedStage !== c.selectedStage) return { response_text: "Good exploration! But the question is asking about a different part — re-read the instruction carefully.", annotations: [], is_correct: false, advance_step: false }
      return { response_text: "That's the right one — well done!", annotations: [], is_correct: true, advance_step: true }
    }
  }
}
