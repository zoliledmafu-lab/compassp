export interface Message {
  role: 'user' | 'assistant'
  content: string
}

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

// ─── Child safety: input screening ───────────────────────────────────────────
// Called before any AI request. Returns true when the input is safe to send.

const UNSAFE_INPUT_PATTERNS = [
  /\b(porn|sex(ual)?|naked|nude|explicit|xxx|adult content|erotic)\b/i,
  /\b(how to (kill|hurt|harm|attack|murder|stab|shoot)|make (a bomb|a weapon|explosives))\b/i,
  /\b(where do you live|how old are you|are you alone|meet (me|up)|send (me|a) (photo|pic)|personal (number|address|details))\b/i,
  /\b(how to (suicide|self.harm|cut myself|overdose)|ways to (die|kill myself))\b/i,
]

export function isSafeInput(message: string): boolean {
  return !UNSAFE_INPUT_PATTERNS.some(p => p.test(message))
}

// ─── Child safety: output screening ──────────────────────────────────────────
// Checks an accumulated AI response before delivering to the student.
// Returns true when the response is safe to display.

const UNSAFE_OUTPUT_PATTERNS = [
  /\b(where do you live|how old are you|are you alone|send (me|a) (photo|pic))\b/i,
  /\b(porn|explicit sexual|nude|naked)\b/i,
  /\b(you should (hurt|harm|kill)|it('s| is) okay to (hurt|harm))\b/i,
]

const SAFE_REDIRECT =
  "I can only help with your school subjects. Let's get back to your studies — what topic are you working on?"

export function isResponseSafe(text: string): boolean {
  return !UNSAFE_OUTPUT_PATTERNS.some(p => p.test(text))
}

export async function streamCompletion(
  systemPrompt: string,
  messages: Message[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<void> {
  if (!API_KEY || API_KEY === 'placeholder_api_key') {
    // Parse scaffold level and frustration flag from system prompt meta marker
    const levelMatch = systemPrompt.match(/\[META: scaffold_level=(\d)/)
    const demoLevel = levelMatch ? (parseInt(levelMatch[1]) as 1 | 2 | 3 | 4) : 1
    const frustMatch = systemPrompt.match(/frustration=(true|false)/)
    const demoFrustrated = frustMatch?.[1] === 'true'
    const demoResponse = getDemoResponse(messages, demoLevel, demoFrustrated, systemPrompt)
    let i = 0
    const interval = setInterval(() => {
      if (i < demoResponse.length) {
        onChunk(demoResponse[i])
        i++
      } else {
        clearInterval(interval)
        onDone()
      }
    }, 18)
    return
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        // PROTOTYPE ONLY — move to a server-side Edge Function before production (see KNOWN_LIMITATIONS.md #1)
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
      }),
    })

    if (!response.ok) {
      onError('We couldn\'t reach Compass at the moment. Please check your connection and try again.')
      return
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) { onError('We couldn\'t reach Compass at the moment. Please try again.'); return }

    let buffer = ''
    let accumulated = ''
    const chunks: string[] = []

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              chunks.push(parsed.delta.text)
              accumulated += parsed.delta.text
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    }

    // Screen the full accumulated response before delivering to the student.
    if (!isResponseSafe(accumulated)) {
      onChunk(SAFE_REDIRECT)
      onDone()
      return
    }

    // Safe — stream all chunks to the UI.
    for (const chunk of chunks) onChunk(chunk)
    onDone()
  } catch {
    onError('We couldn\'t reach Compass at the moment. Please check your connection and try again.')
  }
}

// ─── Canvas quiz / exam helpers ─────────────────────────────────

export interface QuizQuestion {
  id: string
  question: string
  hint: string
}

export interface CanvasContentItem {
  type: 'text' | 'image'
  content?: string     // for text nodes
  src?: string         // base64 data URL for image nodes
  caption?: string     // image caption / alt
}

export async function generateQuizQuestions(
  items: CanvasContentItem[],
  count = 5,
  systemPrompt = '',
): Promise<QuizQuestion[]> {
  const textParts = items.filter(i => i.type === 'text').map(i => i.content || '').join('\n\n---\n\n')
  const imageCount = items.filter(i => i.type === 'image').length

  if (!API_KEY || API_KEY === 'placeholder_api_key') {
    return generateDemoQuizQuestions(textParts, imageCount, count)
  }

  // Build multimodal content block
  const userContent: any[] = []
  if (textParts) {
    userContent.push({ type: 'text', text: `Study notes:\n${textParts}` })
  }
  for (const item of items.filter(i => i.type === 'image' && i.src)) {
    // Only include base64 images (data URLs) — strip the prefix
    const src = item.src!
    if (src.startsWith('data:image/')) {
      const [meta, data] = src.split(',')
      const mediaType = (meta.match(/data:(image\/\w+);/) || [])[1] || 'image/jpeg'
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data },
      })
      if (item.caption) userContent.push({ type: 'text', text: `Image caption: ${item.caption}` })
    }
  }
  userContent.push({
    type: 'text',
    text: `Generate exactly ${count} quiz questions from the above study material. Test DEEP UNDERSTANDING, not just recall of exact wording. Return ONLY valid JSON: [{"id":"1","question":"...","hint":"a nudge toward the answer without giving it away"}]`,
  })

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        // PROTOTYPE ONLY — move to a server-side Edge Function before production (see KNOWN_LIMITATIONS.md #1)
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt || 'You generate quiz questions for students. Return only valid JSON arrays.',
        messages: [{ role: 'user', content: userContent }],
      }),
    })
    if (!res.ok) throw new Error('quiz gen failed')
    const data = await res.json()
    const text = data.content?.[0]?.text || '[]'
    const match = text.match(/\[[\s\S]*\]/)
    return match ? JSON.parse(match[0]) : generateDemoQuizQuestions(textParts, imageCount, count)
  } catch {
    return generateDemoQuizQuestions(textParts, imageCount, count)
  }
}

function generateDemoQuizQuestions(text: string, imageCount: number, count: number): QuizQuestion[] {
  const lower = text.toLowerCase()
  const pool: QuizQuestion[] = [
    { id: '1', question: 'Explain the main concept from your notes in your own words — as if teaching it to a friend who\'s never seen it before.', hint: 'Focus on the "why" not just the "what". What purpose does this concept serve?' },
    { id: '2', question: 'What is the key formula, rule, or process at the heart of this topic? Write it out and explain each part.', hint: 'Break it into components — what does each symbol or step actually mean?' },
    { id: '3', question: 'Where would this concept come up in a real exam question? Describe the type of question and what you\'d need to do to solve it.', hint: 'Think about what information you\'d be given, and what you\'d need to find.' },
    { id: '4', question: 'What\'s the most common mistake students make with this topic, and why does it happen?', hint: 'Think about where the logic could break down if you\'re not careful.' },
    { id: '5', question: 'How does this concept connect to something else you\'ve studied? Describe the link.', hint: 'Look for cause-and-effect, shared principles, or contrasting ideas.' },
    { id: '6', question: 'If you had to summarise this entire topic in 3 bullet points for a classmate, what would they be?', hint: 'Prioritise: what are the 3 things without which you cannot understand the rest?' },
    { id: '7', question: 'Create a simple example or scenario that illustrates how this concept works in practice.', hint: 'The best examples are concrete and specific — avoid vague generalisations.' },
  ]
  if (imageCount > 0) {
    pool.push({ id: '8', question: 'Look at the diagram/image in your notes. Describe what process or concept it is showing, step by step.', hint: 'Work through it sequentially — what happens first, next, and last?' })
    pool.push({ id: '9', question: 'What would change in the diagram or image if one of the key variables were different? Explain your reasoning.', hint: 'Pick one element and trace the knock-on effects through the rest of the system.' })
  }
  // Match questions to content keywords
  if (lower.includes('equation') || lower.includes('formula')) {
    pool.unshift({ id: '10', question: 'Step through the solution process for the type of equation in your notes, explaining your reasoning at each step.', hint: 'Don\'t just state the steps — explain WHY each step is valid.' })
  }
  return pool.slice(0, count).map((q, i) => ({ ...q, id: String(i + 1) }))
}

/** Evaluate a quiz answer in Socratic style (streaming). */
export async function evaluateAnswer(
  question: string,
  studentAnswer: string,
  context: string,
  systemPrompt: string,
  onChunk: (t: string) => void,
  onDone: () => void,
  onError: (e: string) => void,
) {
  const prompt = `The student is answering this quiz question:\n\n"${question}"\n\nTheir answer:\n"${studentAnswer}"\n\nCanvas context:\n${context.substring(0, 800)}\n\nGive Socratic feedback: acknowledge what they got right, gently address gaps, and ask ONE follow-up question to deepen their thinking. Do NOT reveal the full answer. Keep it under 120 words.`
  await streamCompletion(systemPrompt, [{ role: 'user', content: prompt }], onChunk, onDone, onError)
}

/** Generate a branch conversation context message from a parent node. */
export function buildBranchContext(
  parentType: 'text' | 'image' | 'branch',
  parentContent: string,
  parentSummary?: string,
): string {
  if (parentType === 'text') {
    return `CANVAS NODE CONTEXT — the student has branched from a text note on their canvas. The note says:\n\n"${parentContent}"\n\nHelp them explore, understand, and question this material. Build on it step by step.`
  }
  if (parentType === 'image') {
    return `CANVAS NODE CONTEXT — the student has branched from an image/diagram on their canvas${parentContent ? ` captioned "${parentContent}"` : ''}. Help them understand what the image shows, interpret it, and connect it to the broader topic.`
  }
  return `CANVAS NODE CONTEXT — the student has branched from another conversation thread${parentSummary ? `. That thread covered: "${parentSummary}"` : ''}. They want to explore a related tangent. Help them dig deeper.`
}

/** Summarise a branch conversation into 1-2 sentences. */
export async function summariseBranch(messages: Message[]): Promise<string> {
  if (messages.length < 2) return ''
  const transcript = messages.map(m => `${m.role === 'user' ? 'Student' : 'Compass'}: ${m.content.substring(0, 200)}`).join('\n')

  if (!API_KEY || API_KEY === 'placeholder_api_key') {
    const userMessages = messages.filter(m => m.role === 'user')
    const firstUserMsg = userMessages[0]?.content || ''
    return `Explored: "${firstUserMsg.substring(0, 60)}${firstUserMsg.length > 60 ? '…' : ''}". Worked through ${messages.length} exchanges with Socratic guidance.`
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        // PROTOTYPE ONLY — move to a server-side Edge Function before production (see KNOWN_LIMITATIONS.md #1)
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 80,
        system: 'Summarise a tutoring conversation in 1-2 sentences. Focus on what the student explored and what they understood.',
        messages: [{ role: 'user', content: transcript }],
      }),
    })
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.content?.[0]?.text || ''
  } catch {
    return `Explored ${messages.filter(m => m.role === 'user').length} questions with Compass guidance.`
  }
}

export interface SessionInsights {
  topics: string[]
  strengths: string[]
  struggles: string[]
  summary: string
}

export async function extractSessionInsights(
  subjectName: string,
  messages: Message[],
): Promise<SessionInsights> {
  // Need at least one exchange to extract from
  if (messages.length < 2) {
    return { topics: [], strengths: [], struggles: [], summary: '' }
  }

  // Take the last 20 messages for extraction (keep the call cheap)
  const excerpt = messages.slice(-20)
  const transcript = excerpt
    .map(m => `${m.role === 'user' ? 'Student' : 'Compass'}: ${m.content.substring(0, 300)}`)
    .join('\n\n')

  if (!API_KEY || API_KEY === 'placeholder_api_key') {
    return extractDemoInsights(subjectName, transcript)
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        // PROTOTYPE ONLY — move to a server-side Edge Function before production (see KNOWN_LIMITATIONS.md #1)
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        system: 'You are a learning analytics assistant. Analyse study session transcripts and return ONLY valid JSON.',
        messages: [{
          role: 'user',
          content: `Analyse this ${subjectName} tutoring session and return JSON with exactly these fields:
{
  "topics": ["topic1", "topic2"],
  "strengths": ["what student demonstrated understanding of"],
  "struggles": ["what student found difficult or got wrong"],
  "summary": "2-3 sentence summary of what was covered and where student is now"
}

TRANSCRIPT:
${transcript}`,
        }],
      }),
    })
    if (!response.ok) throw new Error('extraction failed')
    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    return { topics: [], strengths: [], struggles: [], summary: '' }
  } catch {
    return extractDemoInsights(subjectName, transcript)
  }
}

// ─── Widget guidance ─────────────────────────────────────────────

/**
 * Ask Compass to evaluate a widget state description and stream back Socratic feedback.
 * Used by both explicit Check actions and proactive struggle nudges.
 */
export async function streamWidgetGuidance(
  systemPrompt: string,
  stateDescription: string,
  isNudge: boolean,
  hintCount: number,
  maxHints: number,
  onChunk: (t: string) => void,
  onDone: () => void,
  onError: (e: string) => void,
) {
  const overLimit = hintCount >= maxHints
  const nudgeIntro = isNudge
    ? "The student has been adjusting the graph repeatedly without asking for help. Offer a gentle, encouraging observation — don't lecture, just open a door."
    : "The student has clicked 'Check' and wants feedback on their current work."

  const limitWarning = overLimit
    ? "\n\nIMPORTANT: The student has used many hints. Gently suggest they try the next step independently before you give another hint. Encourage a short break if needed."
    : ""

  const prompt =
    `${nudgeIntro}\n\nCurrent graph state:\n${stateDescription}${limitWarning}\n\n` +
    `Give Socratic feedback in 2-4 sentences. Ask ONE guiding question. Do NOT reveal the answer. Be warm and specific.`

  if (!API_KEY || API_KEY === 'placeholder_api_key') {
    const demo = getDemoWidgetGuidance(stateDescription, isNudge, overLimit)
    let i = 0
    const iv = setInterval(() => {
      if (i < demo.length) { onChunk(demo[i]); i++ }
      else { clearInterval(iv); onDone() }
    }, 16)
    return
  }

  await streamCompletion(
    systemPrompt,
    [{ role: 'user', content: prompt }],
    onChunk,
    onDone,
    onError,
  )
}

function getDemoWidgetGuidance(stateDesc: string, isNudge: boolean, overLimit: boolean): string {
  if (overLimit) {
    return "You've been at this for a while — respect for sticking with it! Before I drop another hint, I want you to try one thing on your own: look at that slope value and ask yourself — does it *feel* too big, too small, or roughly right for the line you can see? Trust your instinct first, then we'll check it together."
  }
  if (isNudge) {
    return "I see you've been moving those points around — nice! Here's a fun thing to notice: as you drag, *what changes* and *what stays the same*? Try moving just Point B and watch what happens to the equation. What do you observe?"
  }
  const slopeMatch = stateDesc.match(/m = ([-\d.]+)/)
  const slope = slopeMatch ? parseFloat(slopeMatch[1]) : null
  if (slope !== null) {
    if (Math.abs(slope) < 0.01) return "Oh nice — perfectly horizontal! That means slope = 0. So here's an interesting question: **what does it actually mean when the slope is zero?** What's happening between your two points in the real world?"
    if (slope > 0) return `Positive slope of ${slope.toFixed(2)} — so the line climbs as you go right. Love it. Now here's a prediction challenge: **if you moved Point B up by 2, what do you think happens to the slope number?** Make a guess, then try it and see if you were right!`
    if (slope < 0) return `Negative slope — ${slope.toFixed(2)} — the line falls as we move right. Solid! Now: **what would you need to change to make this slope less steep** (bring it closer to zero) without flipping it to positive? What's your move?`
  }
  return "Interesting spot for your points! Here's a quick one: **if you drew a line through Point A and Point B with a ruler — would it go up, go down, or stay flat as you move left to right?** Now check the slope sign in the equation. Does it match your prediction?"
}

function extractDemoInsights(subjectName: string, transcript: string): SessionInsights {
  const lower = transcript.toLowerCase()
  const topicPatterns: Record<string, string[]> = {
    mathematics: ['algebra', 'calculus', 'geometry', 'trigonometry', 'equations', 'functions', 'quadratic', 'differentiation', 'integration', 'statistics', 'probability'],
    'physical-sciences': ['newton', 'force', 'energy', 'momentum', 'waves', 'electricity', 'magnetism', 'acids', 'bases', 'reactions', 'motion'],
    'life-sciences': ['cell', 'dna', 'evolution', 'genetics', 'photosynthesis', 'respiration', 'ecology', 'reproduction', 'nervous system'],
    chemistry: ['reaction', 'mole', 'electron', 'bond', 'organic', 'acid', 'base', 'periodic', 'oxidation', 'reduction'],
    accounting: ['debit', 'credit', 'trial balance', 'income statement', 'balance sheet', 'depreciation', 'cash flow', 'ledger'],
    english: ['grammar', 'essay', 'comprehension', 'poetry', 'figurative language', 'thesis', 'argument', 'narrative'],
  }

  const subjectKey = subjectName.toLowerCase().replace(/\s+/g, '-')
  const patterns = topicPatterns[subjectKey] || []
  const foundTopics = patterns.filter(t => lower.includes(t))

  const strengths: string[] = []
  const struggles: string[] = []

  if (/i (understand|get it|see it now|that makes sense|got it)/i.test(transcript)) {
    strengths.push(`Demonstrated understanding during ${subjectName} session`)
  }
  if (/i('m| am) (confused|stuck|lost|not sure)|don't understand|i don't get/i.test(transcript)) {
    struggles.push(`Needed extra guidance on concepts in ${subjectName}`)
  }

  const summary = foundTopics.length > 0
    ? `Worked through ${foundTopics.slice(0, 3).join(', ')} in ${subjectName}. Student engaged with guided questions and built understanding step by step.`
    : `Completed a ${subjectName} study session. Student asked questions and worked through concepts with Socratic guidance.`

  return { topics: foundTopics.slice(0, 5), strengths, struggles, summary }
}

// Scan full conversation history for the dominant topic so fallbacks stay relevant
function getTopicFromHistory(messages: Message[]): string {
  const allText = messages.map(m => m.content).join(' ').toLowerCase()
  if (/triangle|area of|perimeter|polygon|geometry|rectangle|square|circle area|sector/i.test(allText)) return 'geometry'
  if (/quadratic|parabola|x\s*\^?\s*2|factoris|factori[sz]/i.test(allText)) return 'quadratic'
  if (/circle\s*(equation|theorem)|radius|circumference|diameter/i.test(allText)) return 'circle'
  if (/fraction|denominator|numerator|simplif|ratio|proportion/i.test(allText)) return 'fractions'
  if (/pythagoras|hypotenuse|right.angle|right.triangle/i.test(allText)) return 'pythagoras'
  if (/linear|gradient|slope|y\s*=\s*mx|straight line/i.test(allText)) return 'linear'
  if (/force|newton|motion|velocity|acceleration|momentum/i.test(allText)) return 'physics'
  if (/photosynthesis|respiration|cell|biology|dna|genetics/i.test(allText)) return 'biology'
  if (/account|debit|credit|ledger|balance sheet/i.test(allText)) return 'accounting'
  if (/history|timeline|war|independence|revolution|colonial/i.test(allText)) return 'history'
  if (/essay|paragraph|thesis|argument|narrative|comprehension/i.test(allText)) return 'english'
  if (/equation|algebra|solve|expression|expand|simplify/i.test(allText)) return 'algebra'
  if (/probability|statistic|mean|median|mode|sample|data/i.test(allText)) return 'statistics'
  return 'general'
}

function getDemoResponse(messages: Message[], level: 1 | 2 | 3 | 4 = 1, frustrated = false, systemPrompt = ''): string {
  const userMsg = messages[messages.length - 1]?.content || ''
  const lower = userMsg.toLowerCase()
  const turnCount = messages.filter(m => m.role === 'assistant').length
  // Look at full history to keep fallbacks on-topic even when the latest message is short
  const topic = getTopicFromHistory(messages)

  // ── Subject awareness — only show relevant visualizations ────────
  const subjectMatch = systemPrompt.match(/SUBJECT:\s*([^|]+)/)
  const currentSubject = subjectMatch ? subjectMatch[1].trim().toLowerCase() : ''
  const inMaths     = /math|statistic|pure math|further math/i.test(currentSubject)
  const inPhysics   = /physics|physical science/i.test(currentSubject)
  const inBiology   = /biology|life science|combined science/i.test(currentSubject)
  const inChemistry = /chemistry/i.test(currentSubject)
  const inGeography = /geography|environmental/i.test(currentSubject)
  const inHistory   = /history/i.test(currentSubject)
  const inEconomics = /economics|business|commerce/i.test(currentSubject)
  const inAccounting= /accounting|accounts/i.test(currentSubject)
  const inEnglish   = /english|language|literature/i.test(currentSubject)
  // If subject is unknown (no system prompt), allow everything
  const noSubject   = !currentSubject

  // ── Frustration acknowledgement ───────────────────────────────
  const frustrationPrefix = frustrated
    ? "I can hear this is getting tough — that's completely normal. Let's slow right down and go one step at a time.\n\n"
    : ''

  // ── Greeting ──────────────────────────────────────────────────
  if (turnCount === 0 && /^(hello|hi|hey|good (morning|afternoon|evening))/i.test(lower)) {
    const nameMatch = systemPrompt.match(/\[META:[^\]]*name=([^\]\s\]]+)/)
    const name = nameMatch?.[1] && nameMatch[1] !== 'Student' ? nameMatch[1] : null
    const greeting = name ? `Hey ${name}!` : 'Hey there!'
    return `${greeting} I'm Compass — really glad you're here. Think of me as a study buddy who loves figuring things out together. Whatever you're working on, we'll break it down step by step until it actually makes sense.\n\n**So, what are we diving into today?**`
  }

  // ── First message (not a greeting) — respond warmly to topic ──
  if (turnCount === 0) {
    const nameMatch = systemPrompt.match(/\[META:[^\]]*name=([^\]\s\]]+)/)
    const name = nameMatch?.[1] && nameMatch[1] !== 'Student' ? nameMatch[1] : null
    const opener = name ? `Great, ${name}!` : 'Great topic!'
    if (/triangle|area|perimeter|geometry|rectangle|polygon/i.test(lower) || topic === 'geometry') {
      return `${opener} Let's figure this out together. **What information does your question give you — do you have the base and height, or something else?**`
    }
    if (/quadratic|parabola|x\^?2|factoris/i.test(lower) || topic === 'quadratic') {
      return `${opener} Quadratics are fascinating once you see the pattern. **First — can you tell me the equation you're working with?**`
    }
    if (/pythagoras|hypotenuse|right.angle/i.test(lower) || topic === 'pythagoras') {
      return `${opener} Pythagoras is really satisfying once it clicks. **Which sides of the triangle does your question give you?**`
    }
    if (/fraction|ratio|proportion/i.test(lower) || topic === 'fractions') {
      return `${opener} **What exactly does the question ask you to do — simplify, add, subtract, or something else?**`
    }
    if (/force|newton|motion|velocity/i.test(lower) || topic === 'physics') {
      return `${opener} **What values does the question give you, and what does it ask you to find?**`
    }
    if (/account|debit|credit/i.test(lower) || topic === 'accounting') {
      return `${opener} Bookkeeping is very logical once you know the rules. **Which transaction are you trying to record?**`
    }
    if (/essay|paragraph|thesis/i.test(lower) || topic === 'english') {
      return `${opener} **What's the essay question asking you to argue or discuss?**`
    }
    return `${opener} Let's work through it together. **Can you share the question or problem you're looking at?**`
  }

  // ── Visualization requests (handled at any level) ─────────────

  // Flowchart / diagram requests
  if (/flowchart|diagram|show me|draw|visuali[sz]e|mind.?map|chart/i.test(lower)) {
    if ((inMaths || noSubject) && /quadratic|x²|parabola|factori[sz]/i.test(lower)) {
      return `${frustrationPrefix}Here's a flowchart for solving a quadratic equation:

\`\`\`mermaid
flowchart TD
    A[ax2 plus bx plus c equals 0] --> B{Can you factorise}
    B -->|Yes| C[Find two numbers]
    C --> D[Numbers multiply to c and add to b]
    D --> G[Write as two brackets]
    G --> H[Set each bracket to zero and solve]
    B -->|No| E{Simple form}
    E -->|Yes| F[Square root both sides]
    E -->|No| I[Use the quadratic formula]
    F --> J[Solve for x]
    H --> J
    I --> J
    J --> K[Check by substituting back]
\`\`\`

Three paths exist — factorising is fastest when it works, the formula always works.

**Which path do you think applies to your equation?**`
    }

    if ((inBiology || noSubject) && /photosynthesis|respiration|cell|biology|life/i.test(lower)) {
      return `${frustrationPrefix}Here's a visual breakdown of photosynthesis:

\`\`\`viz
{"type":"bar","title":"Inputs and outputs of photosynthesis (relative amounts)","unit":" units","data":[{"label":"CO2 (input)","value":6},{"label":"H2O (input)","value":6},{"label":"Light energy","value":10},{"label":"Glucose (output)","value":1},{"label":"O2 (output)","value":6}]}
\`\`\`

The overall equation: **6CO2 + 6H2O + light → C6H12O6 + 6O2**

Light drives the reaction — without it, glucose cannot be made.

**What do you think would happen to the rate of photosynthesis if you doubled the CO2 concentration?**`
    }

    if ((inHistory || noSubject) && /history|timeline|event|war|independen/i.test(lower)) {
      return `${frustrationPrefix}Here's a visual timeline of Zimbabwe's key moments:

\`\`\`viz
{"type":"timeline","title":"Zimbabwe — Key Historical Events","events":[{"year":"1890","label":"BSAC arrives","detail":"British South Africa Company colonises Mashonaland"},{"year":"1923","label":"Self-governing colony","detail":"White minority rule under Britain"},{"year":"1965","label":"UDI declared","detail":"Ian Smith's unilateral declaration"},{"year":"1972","label":"Chimurenga War","detail":"Liberation struggle intensifies"},{"year":"1980","label":"Independence","detail":"Robert Mugabe becomes PM"},{"year":"2017","label":"Change of leadership","detail":"Military transition ends Mugabe era"}]}
\`\`\`

**Which event do you think had the biggest long-term impact on Zimbabwe — and why?**`
    }

    if ((inPhysics || noSubject) && /force|newton|physics|motion|energy/i.test(lower)) {
      return `${frustrationPrefix}Here's a comparison of Newton's Three Laws:

\`\`\`viz
{"type":"comparison","title":"Newton's Three Laws of Motion","labelA":"The Law","labelB":"Real-life example","rows":[{"aspect":"1st Law (Inertia)","a":"An object stays at rest or in uniform motion unless acted on by a net force","b":"A book stays on a table until you push it"},{"aspect":"2nd Law (F = ma)","a":"Force = mass × acceleration; bigger force → bigger acceleration","b":"Kicking a football harder makes it fly faster"},{"aspect":"3rd Law (Action-Reaction)","a":"Every action has an equal and opposite reaction","b":"Rocket exhaust pushes down, rocket goes up"}]}
\`\`\`

**Can you describe a scenario where all three laws are at play at the same time — like a car braking?**`
    }

    if ((inAccounting || noSubject) && /account|debit|credit|ledger|bookkeeping/i.test(lower)) {
      return `${frustrationPrefix}Here's a visual breakdown of double-entry bookkeeping:

\`\`\`viz
{"type":"process","title":"Double-Entry Bookkeeping — Step by Step","steps":[{"step":"Transaction occurs","detail":"e.g. Buy equipment for cash"},{"step":"Identify 2 accounts","detail":"Cash (asset) + Equipment (asset)"},{"step":"Determine effect","detail":"Cash decreases, Equipment increases"},{"step":"Apply the rules","detail":"Asset up = Debit. Asset down = Credit"},{"step":"Record both sides","detail":"Debit Equipment, Credit Cash"},{"step":"Check balance","detail":"Total debits must equal total credits"}]}
\`\`\`

**Golden rule:** Every transaction touches **two accounts** — and debits must always equal credits.

**Which two accounts would change if a business received cash from a customer?**`
    }

    if ((inMaths || noSubject) && /circle|circumference|radius|diameter|arc|sector/i.test(lower)) {
      return `${frustrationPrefix}Here are the key circle formulas visualised:

\`\`\`graph
{"functions":["pi*x^2","2*pi*x"],"xRange":[0,5],"title":"Circle: Area (πr²) vs Circumference (2πr) as radius grows","labels":["Area = πr²","Circumference = 2πr"]}
\`\`\`

*Hover to see exact values at any radius.*

The two essential formulas:
- **Area** = πr² (square units — covers the inside)
- **Circumference** = 2πr (linear units — goes around the edge)

\`\`\`quiz
{"type":"mcq","question":"A circle has radius 5 cm. What is its area? (use π ≈ 3.14)","options":["78.5 cm²","31.4 cm²","15.7 cm²","62.8 cm²"],"answer":0,"explanation":"Area = πr² = 3.14 × 5² = 3.14 × 25 = 78.5 cm²"}
\`\`\`

**What does your question ask you to find — the area, the circumference, or the radius?**`
    }

    if ((inBiology || inGeography || noSubject) && /water.?cycle|evaporation|condensation|precipitation/i.test(lower)) {
      return `${frustrationPrefix}Here's the water cycle as a process:

\`\`\`viz
{"type":"process","title":"The Water Cycle","steps":[{"step":"Evaporation","detail":"Sun heats water → water vapour rises"},{"step":"Condensation","detail":"Vapour cools → forms clouds"},{"step":"Precipitation","detail":"Water falls as rain or snow"},{"step":"Collection","detail":"Water collects in rivers, lakes, ocean"},{"step":"Repeat","detail":"Cycle begins again"}]}
\`\`\`

**What do you think provides the energy that drives the entire cycle?**`
    }

    if ((inMaths || noSubject) && /fraction|ratio|proportion/i.test(lower)) {
      return `${frustrationPrefix}Here's a comparison of fraction operations:

\`\`\`viz
{"type":"comparison","title":"Fraction Operations","labelA":"Operation","labelB":"Method","rows":[{"aspect":"Add / Subtract","a":"Find common denominator, then add/subtract numerators","b":"3/4 + 1/6 → 9/12 + 2/12 = 11/12"},{"aspect":"Multiply","a":"Multiply numerators together, denominators together","b":"2/3 × 3/5 = 6/15 = 2/5"},{"aspect":"Divide","a":"Keep the first fraction, flip the second, then multiply","b":"2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6"},{"aspect":"Simplify","a":"Divide top and bottom by their HCF","b":"12/18 ÷ 6 = 2/3"}]}
\`\`\`

**Which operation does your question involve?**`
    }

    if ((inBiology || noSubject) && /mitosis|meiosis|cell.?division/i.test(lower)) {
      return `${frustrationPrefix}Here's a comparison of the two types of cell division:

\`\`\`viz
{"type":"comparison","title":"Mitosis vs Meiosis","labelA":"Mitosis","labelB":"Meiosis","rows":[{"aspect":"Purpose","a":"Growth and repair","b":"Sexual reproduction"},{"aspect":"Divisions","a":"1 division","b":"2 divisions"},{"aspect":"Daughter cells","a":"2 identical cells","b":"4 genetically unique cells"},{"aspect":"Chromosome number","a":"Same as parent (2n)","b":"Half of parent (n — haploid)"},{"aspect":"Where it occurs","a":"Body (somatic) cells","b":"Reproductive organs"}]}
\`\`\`

**Can you explain in your own words why meiosis produces cells with half the chromosomes?**`
    }

    if ((inEconomics || noSubject) && /supply|demand|equilibrium|market/i.test(lower)) {
      return `${frustrationPrefix}Here's a supply and demand summary:

\`\`\`viz
{"type":"comparison","title":"Supply and Demand Shifts","labelA":"Demand shifts RIGHT (increases)","labelB":"Supply shifts RIGHT (increases)","rows":[{"aspect":"Price effect","a":"Price rises","b":"Price falls"},{"aspect":"Quantity effect","a":"Quantity rises","b":"Quantity rises"},{"aspect":"Typical cause","a":"Income rises, tastes change, population grows","b":"Technology improves, costs fall, more producers enter"}]}
\`\`\`

**What caused the shift in your question — a change in supply, demand, or both?**`
    }

    // Generic diagram request — subject-specific examples
    const vizExamples = inMaths
      ? '- A **step-by-step process** (e.g. "how to solve a quadratic")?\n- A **comparison** (e.g. "fractions vs decimals")?\n- A **formula or graph** (e.g. "show me the circle area formula")?\n- A **timeline** isn\'t really a maths thing — but a process flowchart might be!'
      : inPhysics
      ? '- A **comparison** (e.g. "Newton\'s three laws side by side")?\n- A **step-by-step process** (e.g. "how to apply F = ma")?\n- A **graph** (e.g. "velocity-time graph")?'
      : inBiology
      ? '- A **comparison** (e.g. "mitosis vs meiosis")?\n- A **process** (e.g. "how photosynthesis works")?\n- A **bar chart** of biological data?'
      : inHistory
      ? '- A **timeline** of events?\n- A **comparison** (e.g. "causes vs effects of WWI")?\n- A **process** (e.g. "how apartheid was dismantled")?'
      : inEconomics
      ? '- A **comparison** (e.g. "supply vs demand shifts")?\n- A **process** (e.g. "how a market reaches equilibrium")?\n- A **bar chart** of economic data?'
      : inAccounting
      ? '- A **process** (e.g. "double-entry bookkeeping steps")?\n- A **comparison** (e.g. "debit vs credit rules")?'
      : inGeography
      ? '- A **process** (e.g. "the water cycle")?\n- A **timeline** of geographical events?\n- A **comparison** of climate zones?'
      : '- A **step-by-step process** (e.g. "how photosynthesis works")?\n- A **comparison** between two things (e.g. "mitosis vs meiosis")?\n- A **timeline** of events?\n- A **formula or graph** (e.g. "show me the circle area formula")?'
    return `${frustrationPrefix}I can build a diagram for that! To give you the right one, tell me a bit more — for example:

${vizExamples}

What specifically would you like to visualise?`
  }

  // Graph / function plot requests
  if ((inMaths || noSubject) && /graph|plot|sketch|curve|function|parabola|y\s*=|f\(x\)/i.test(lower)) {
    if (/quadratic|parabola|x²|x\^2/i.test(lower)) {
      return `${frustrationPrefix}Here's a graph comparing a basic quadratic to a linear function:

\`\`\`graph
{"functions":["x^2","x+2","-x^2+4"],"xRange":[-4,4],"title":"Quadratic curves vs a straight line","labels":["y = x² (opens up)","y = x + 2 (linear)","y = -x² + 4 (opens down)"]}
\`\`\`

Notice:
- When **a > 0** (like y = x²), the parabola opens **upward**
- When **a < 0** (like y = −x² + 4), it opens **downward**
- The **vertex** is the turning point — the lowest or highest point

**What is the value of *a* in your equation, and which way will your parabola open?**`
    }

    if (/linear|straight line|gradient|slope|y\s*=\s*mx/i.test(lower)) {
      return `${frustrationPrefix}Here are some straight lines with different gradients:

\`\`\`graph
{"functions":["2*x+1","x-2","-x+3","0.5*x"],"xRange":[-5,5],"title":"Straight lines — comparing gradients","labels":["y = 2x + 1","y = x − 2","y = −x + 3","y = 0.5x"]}
\`\`\`

Notice:
- The **steeper** the line, the larger the gradient (m)
- A **negative** gradient means the line slopes downward
- Where the line **crosses the y-axis** is the y-intercept (c)

**In your equation y = mx + c, what are the values of m and c?**`
    }

    if (/trig|sin|cos|tan|wave/i.test(lower)) {
      return `${frustrationPrefix}Here are the three trigonometric functions:

\`\`\`graph
{"functions":["sin(x)","cos(x)","tan(x)"],"xRange":[-6.3,6.3],"yRange":[-2,2],"title":"Trigonometric functions","labels":["y = sin(x)","y = cos(x)","y = tan(x)"]}
\`\`\`

Notice:
- sin and cos both **oscillate between −1 and +1**
- cos is just sin **shifted left by 90°**
- tan has **asymptotes** (undefined values) where cos = 0

**What do you notice about where sin(x) = 0 and where cos(x) = 0?**`
    }

    // Generic graph request
    return `${frustrationPrefix}I can plot that for you! Tell me the function(s) you'd like to see — for example:
- "Graph y = x² − 3x + 2"
- "Plot y = 2x + 1 and y = x²"
- "Show me sin(x)"

What function are we working with?`
  }

  // ── Level 1: One guiding question ─────────────────────────────
  if (level === 1) {
    if (/circle|equation.*circle|x.*².*y.*²/i.test(lower) || topic === 'circle') {
      return `${frustrationPrefix}Before we work through this — **what do you think the numbers inside the brackets of a circle equation might represent?**`
    }
    if (/quadratic|x²|parabola/i.test(lower) || topic === 'quadratic') {
      return `${frustrationPrefix}Good topic. Before we dive in — **what do you notice about the structure of a quadratic equation? What are its three parts?**`
    }
    if (/triangle|area|perimeter|geometry|rectangle|polygon/i.test(lower) || topic === 'geometry') {
      return `${frustrationPrefix}Good starting point. **What information do you think you need to find the area of a triangle — what measurements matter?**`
    }
    if (/pythagoras|hypotenuse|right.angle/i.test(lower) || topic === 'pythagoras') {
      return `${frustrationPrefix}Let's think this through — **in a right-angled triangle, which side is always the longest? Do you know what it's called?**`
    }
    if (/fraction|ratio|proportion/i.test(lower) || topic === 'fractions') {
      return `${frustrationPrefix}Before we calculate — **when you simplify a fraction, what are you actually doing to both the top and the bottom?**`
    }
    if (/force|newton|motion/i.test(lower) || topic === 'physics') {
      return `${frustrationPrefix}Let's start here: **when you push a stationary object and it starts moving, what do you think is causing that change?**`
    }
    if (/account|debit|credit|ledger/i.test(lower) || topic === 'accounting') {
      return `${frustrationPrefix}Good topic. **In a T-account, do you know which side debits go on — left or right?**`
    }
    if (/essay|paragraph|thesis/i.test(lower) || topic === 'english') {
      return `${frustrationPrefix}Before we plan the essay — **in one sentence, what is the ONE main point you want to argue?**`
    }
    if (turnCount === 0) {
      return `${frustrationPrefix}Let's start at the beginning. **Can you tell me, in your own words, what this topic or question is asking you to do?**`
    }
    return `${frustrationPrefix}**What do you already know about this — even if it feels incomplete?** Tell me whatever comes to mind first.`
  }

  // ── Level 2: Stepping-stone hint ──────────────────────────────
  if (level === 2) {
    if (/circle|equation.*circle/i.test(lower) || topic === 'circle') {
      return `${frustrationPrefix}Here's a key piece: in **(x − h)² + (y − k)² = r²**, the values *h* and *k* give you the **centre**, and *r²* gives the radius.\n\n**Can you pick out h and k from your equation?**`
    }
    if (/quadratic|x²/i.test(lower) || topic === 'quadratic') {
      return `${frustrationPrefix}One useful thing to know: in **y = ax² + bx + c**, the sign of *a* tells you if the parabola opens upward (positive) or downward (negative).\n\nWould you like me to **graph it** so you can see the shape? Just say "yes, graph it" — or tell me the value of *a* first.`
    }
    if (/triangle|area|perimeter|geometry/i.test(lower) || topic === 'geometry') {
      return `${frustrationPrefix}You're on the right track. The formula for the area of a triangle has **three parts**: ½, the base, and the height.\n\n**You gave me two of those — which one is still missing from your answer?**`
    }
    if (/pythagoras|hypotenuse/i.test(lower) || topic === 'pythagoras') {
      return `${frustrationPrefix}Here's the key: in Pythagoras' theorem, **a² + b² = c²**, where *c* is always the hypotenuse.\n\n**Can you label which sides in your triangle are *a*, *b*, and *c*?**`
    }
    if (/account|debit|credit/i.test(lower) || topic === 'accounting') {
      return `${frustrationPrefix}Quick reminder: **debits always go on the LEFT, credits on the RIGHT**. Assets increase on the debit side; liabilities increase on the credit side.\n\n**Which account are you working with, and does it increase or decrease?**`
    }
    if (/fraction|ratio/i.test(lower) || topic === 'fractions') {
      return `${frustrationPrefix}One useful rule: to simplify a fraction, divide both the numerator and denominator by their **HCF** (highest common factor).\n\n**What is the HCF of your two numbers?**`
    }
    if (turnCount === 0) {
      return `${frustrationPrefix}Here's a starting hint: **break the problem into what you're *given* and what you're *asked to find*.**\n\n**What does the question give you, and what does it want?**`
    }
    // Fallback: use topic context to stay relevant
    const topicHint: Record<string, string> = {
      algebra:    'In algebra, the key move is usually to **isolate the unknown** by doing the same operation to both sides.\n\n**What operation could you apply to both sides here?**',
      statistics: 'Remember: **mean** adds all values and divides by count, **median** is the middle value when sorted, **mode** is the most frequent.\n\n**Which measure does your question ask for?**',
      physics:    'In physics problems, always start by **listing what you know** (given values) and **what you need** (the unknown).\n\n**What values does the question give you?**',
      biology:    'Try breaking this down: **what is the input, and what is the output of this process?**\n\n**What does the question say happens first?**',
      history:    'Historians look at **cause**, **event**, and **consequence**.\n\n**For this event — what do you think triggered it?**',
      english:    'A strong paragraph has a **point**, **evidence**, and **explanation** (PEE).\n\n**Which part of PEE are you working on?**',
      general:    'A good strategy: **write down what you know** and **what you\'re trying to find** before calculating anything.\n\n**What does the question give you?**',
    }
    return `${frustrationPrefix}${topicHint[topic] ?? topicHint.general}`
  }

  // ── Level 3: Worked example ────────────────────────────────────
  if (level === 3) {
    if (/quadratic|x²/i.test(lower) || topic === 'quadratic') {
      return `${frustrationPrefix}Here's a graph and a worked example together:

\`\`\`graph
{"functions":["x^2-5*x+6"],"xRange":[-1,6],"title":"y = x² − 5x + 6","labels":["y = x² − 5x + 6 (our example)"]}
\`\`\`

*Hover over the graph to see exact values at any point.*

See how it crosses the x-axis at x = 2 and x = 3? Those are the **roots** — the solutions.

**Worked example:** Factorise x² − 5x + 6
- Find two numbers that **multiply to 6** and **add to −5**
- That's −2 and −3: (−2) × (−3) = 6 ✓ and (−2) + (−3) = −5 ✓
- So x² − 5x + 6 = **(x − 2)(x − 3)**

Quick check:

\`\`\`quiz
{"type":"mcq","question":"To factorise x² + 5x + 6, which pair of numbers do you need?","options":["Multiply to 6 and add to 5","Multiply to 5 and add to 6","Multiply to 6 and add to −5","Multiply to −6 and add to 5"],"answer":0,"explanation":"We need two numbers that multiply to c (which is 6) and add to b (which is 5). Those are 2 and 3: 2×3=6 and 2+3=5, so x²+5x+6 = (x+2)(x+3)."}
\`\`\`

**Now try your equation using the same method. What two numbers do you need?**`
    }
    if (/circle|equation.*circle/i.test(lower) || topic === 'circle') {
      return `${frustrationPrefix}Let me show you with a different example:\n\n**Example:** Find the centre and radius of *(x − 3)² + (y + 1)² = 25*\n\n**Step 1:** Compare to *(x − h)² + (y − k)² = r²*\n**Step 2:** h = **3**, k = **−1** (sign flips!)\n**Step 3:** r² = 25, so r = **5**\n**Answer:** Centre (3, −1), Radius 5\n\n**Now apply those steps to your equation.**`
    }
    if (/triangle|area|geometry/i.test(lower) || topic === 'geometry') {
      return `${frustrationPrefix}Let me show you with different numbers:

**Worked example:** A triangle has a base of 8 cm and a height of 5 cm. Find its area.

**Step 1:** Write the formula → Area = ½ × base × height
**Step 2:** Substitute → Area = ½ × 8 × 5
**Step 3:** Calculate → Area = ½ × 40 = **20 cm²**

The unit must be **squared** (cm²) because area is always 2D.

Now try one yourself:

\`\`\`quiz
{"type":"fill","question":"A triangle has base 10 cm and height 6 cm. Its area is _____ cm².","answer":"30","hint":"Area = ½ × base × height. Work it out step by step.","explanation":"Area = ½ × 10 × 6 = ½ × 60 = 30 cm²"}
\`\`\`

**What values do you have for the base and height in your problem?**`
    }
    if (/pythagoras|hypotenuse/i.test(lower) || topic === 'pythagoras') {
      return `${frustrationPrefix}Let me walk through a similar example:\n\n**Example:** A right triangle has legs of 3 cm and 4 cm. Find the hypotenuse.\n\n**Step 1:** a² + b² = c² → 3² + 4² = c²\n**Step 2:** 9 + 16 = c²\n**Step 3:** c² = 25, so c = √25 = **5 cm**\n\n**Now try your triangle. Which sides do you know?**`
    }
    if (/account|debit|credit/i.test(lower) || topic === 'accounting') {
      return `${frustrationPrefix}Here's a worked example:\n\n**Example:** A business receives $500 cash for services.\n\n| Account | Debit | Credit |\n|---|---|---|\n| Cash (Asset ↑) | 500 | |\n| Service Revenue | | 500 |\n\n*Cash increases → debit. Revenue earned → credit.*\n\n**Now set up the T-accounts for your transaction.**`
    }
    if (topic === 'algebra') {
      return `${frustrationPrefix}Let me show you a similar example:\n\nSolve **2x + 4 = 14**\n\n**Step 1:** Subtract 4 from both sides → 2x = 10\n**Step 2:** Divide both sides by 2 → x = **5**\n\nThe key: **whatever you do to one side, you must do to the other.**\n\n**Now apply those steps to your equation. What's your first move?**`
    }
    if (topic === 'fractions') {
      return `${frustrationPrefix}Here's a worked example:\n\nSimplify **12/18**\n\n**Step 1:** Find the HCF of 12 and 18 → HCF = 6\n**Step 2:** Divide top and bottom by 6 → 12÷6 = 2, 18÷6 = 3\n**Answer:** **2/3**\n\n**Now apply the same steps to your fraction.**`
    }
    // Generic fallback — but topic-aware
    return `${frustrationPrefix}Let me show you the method with a simple example first:\n\n**Example:** Suppose the problem gives you two pieces of information and asks you to find a third.\n\n1. **Write down what you know**\n2. **Choose the formula or rule that links them**\n3. **Substitute your values in**\n4. **Solve and check your units**\n\n**On ${topic === 'general' ? 'your problem' : `this ${topic} question`} — what two pieces of information does the question give you?**`
  }

  // ── Level 4: Full explanation ──────────────────────────────────
  if (level === 4) {
    if (/quadratic|x²/i.test(lower) || topic === 'quadratic') {
      return `${frustrationPrefix}Let me give you the full picture — with a graph.

\`\`\`graph
{"functions":["x^2-4","x^2-4*x+3","-x^2+1"],"xRange":[-4,5],"title":"Three quadratics — roots are where they cross x-axis","labels":["y = x²−4","y = x²−4x+3","y = −x²+1"]}
\`\`\`

**How to solve any quadratic ax² + bx + c = 0:**

**Method 1 — Factorising** (quickest when it works):
Find two numbers that multiply to *c* and add to *b*.

**Method 2 — Quadratic Formula** (always works):
x = (−b ± √(b² − 4ac)) ÷ 2a

**Method 3 — Completing the Square:**
Rewrite as (x + p)² = q, then take square roots.

---

**New practice problem:**
Solve x² − 5x + 6 = 0 using factorising.
Show your working and tell me the two values of x.`
    }
    if (/triangle|area|geometry/i.test(lower) || topic === 'geometry') {
      return `${frustrationPrefix}Here's the complete picture for triangle area.

**The formula:** Area = ½ × base × height

The **height must be perpendicular** (at 90°) to the base — not the slant side.

\`\`\`viz
{"type":"process","title":"Finding the area of a triangle","steps":[{"step":"Identify the base","detail":"Any side can be the base"},{"step":"Find the height","detail":"Must be perpendicular (90°) to the base"},{"step":"Apply the formula","detail":"Area = ½ × base × height"},{"step":"Write the unit","detail":"Area is always in squared units (cm², m²)"}]}
\`\`\`

\`\`\`quiz
{"type":"truefalse","question":"The height of a triangle is always the slant (diagonal) side.","answer":"false","explanation":"The height must be perpendicular (at 90°) to the base. It is not always one of the slant sides — it is a vertical measurement inside the triangle."}
\`\`\`

**Practice problem:** A triangle has a base of 10 cm and a perpendicular height of 7 cm. Calculate its area and show every step.`
    }
    if (/pythagoras|hypotenuse/i.test(lower) || topic === 'pythagoras') {
      return `${frustrationPrefix}Here is the full Pythagoras method:\n\n**Theorem:** In any right-angled triangle, **a² + b² = c²** where c is the hypotenuse.\n\n**Finding the hypotenuse:** c = √(a² + b²)\n**Finding a shorter side:** a = √(c² − b²)\n\n---\n\n**New practice problem:**\nA ladder 10 m long leans against a wall. Its base is 6 m from the wall. How high up the wall does it reach?\n\nDraw a diagram first, then show your working.`
    }
    if (/account|debit|credit/i.test(lower) || topic === 'accounting') {
      return `${frustrationPrefix}Here is the complete picture for double-entry bookkeeping.\n\nEvery transaction affects **two accounts**:\n- **Assets / Expenses** → increase on the **DEBIT (left)** side\n- **Liabilities / Equity / Revenue** → increase on the **CREDIT (right)** side\n- Total debits must always **equal** total credits\n\n---\n\n**New practice problem:**\nA business pays $200 cash to buy office supplies.\n- Which two accounts are affected?\n- Which is debited and which is credited?\n\nWrite out the T-account entries.`
    }
    // Generic level 4 — still topic-aware
    const topicExample: Record<string, string> = {
      algebra: 'Solve **3x − 7 = 14** step by step. Show every operation you perform on both sides.',
      statistics: 'A class scored: 45, 62, 78, 54, 78, 90, 62, 78. Find the mean, median, and mode.',
      fractions: 'Calculate **3/4 + 5/6**. Show how you find a common denominator.',
      physics: 'A car accelerates from rest to 20 m/s in 5 seconds. Calculate the acceleration and the distance covered.',
      biology: 'Describe the four stages of mitosis (PMAT) and what happens to the chromosomes at each stage.',
      history: 'Explain ONE cause and ONE consequence of the event you have been studying.',
      english: 'Write a PEE paragraph arguing that education is the most powerful tool for change.',
      general: 'Look at your original problem — write out what you know, what you need to find, and which formula or method links them.',
    }
    return `${frustrationPrefix}Let me give you the complete explanation.\n\nWhen tackling any problem like this:\n1. **Identify** what you're given and what you need\n2. **Choose** the right formula or method\n3. **Substitute** values carefully\n4. **Check** your answer makes sense (right size? right units?)\n\n---\n\n**New practice problem:**\n${topicExample[topic] ?? topicExample.general}`
  }

  return `${frustrationPrefix}**What part of this would you like to start with?**`
}
