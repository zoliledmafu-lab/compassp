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
    const demoResponse = getDemoResponse(messages, demoLevel, demoFrustrated)
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

function getDemoResponse(messages: Message[], level: 1 | 2 | 3 | 4 = 1, frustrated = false): string {
  const userMsg = messages[messages.length - 1]?.content || ''
  const lower = userMsg.toLowerCase()
  const turnCount = messages.filter(m => m.role === 'assistant').length

  // ── Frustration acknowledgement (prepended when detected) ─────
  const frustrationPrefix = frustrated
    ? "Ndinzwisisa kuti zvinoda nguva — ita simba. Vanhu vakawanda vakapfuura pane zviri kukuvadza. Ngatiite zvishoma zvishoma.\n\n"
    : ''

  // ── Greeting ──────────────────────────────────────────────────
  if (turnCount === 0 && /^(hello|hi|hey|good (morning|afternoon|evening)|sawubona|mhoro)/i.test(lower)) {
    return "Hey! 👋 I'm Compass — your study companion. I won't just hand you answers, but I *will* walk through everything with you until it actually clicks.\n\n**What are you working on? Tell me.**"
  }

  // ── Level 1: One guiding question ─────────────────────────────
  if (level === 1) {
    if (/circle|equation.*circle|x.*².*y.*²/i.test(lower)) {
      return `${frustrationPrefix}Before we work through this — **what do you think the numbers inside the brackets of a circle equation might represent?**`
    }
    if (/quadratic|x²|parabola/i.test(lower)) {
      return `${frustrationPrefix}Interesting — **what do you notice about the structure of a quadratic equation? What are the three parts it always has?**`
    }
    if (/force|newton|motion/i.test(lower)) {
      return `${frustrationPrefix}Let's start here: **when you push a stationary object and it starts moving, what do you think is causing that change?**`
    }
    if (/account|debit|credit|ledger/i.test(lower)) {
      return `${frustrationPrefix}Good topic. **In a T-account, do you know which side debits go on — left or right?**`
    }
    if (/essay|paragraph|thesis/i.test(lower)) {
      return `${frustrationPrefix}Before we plan the essay — **in one sentence, what is the ONE main point you want this essay to argue?**`
    }
    if (turnCount === 0) {
      return `${frustrationPrefix}Let's start at the beginning. **Can you tell me, in your own words, what this topic or question is asking you to do?**`
    }
    return `${frustrationPrefix}**What do you already know about this — even if it feels incomplete?** Tell me whatever comes to mind first.`
  }

  // ── Level 2: Stepping-stone hint ──────────────────────────────
  if (level === 2) {
    if (/circle|equation.*circle/i.test(lower)) {
      return `${frustrationPrefix}Here's a key piece: in a circle equation like **(x − h)² + (y − k)² = r²**, the values *h* and *k* inside the brackets give you the **centre** of the circle, and *r²* gives you the radius.\n\n**Now look at your equation — can you pick out what h and k are?**`
    }
    if (/quadratic|x²/i.test(lower)) {
      return `${frustrationPrefix}One useful thing to know: in **y = ax² + bx + c**, the sign of *a* tells you if the parabola opens upward (positive) or downward (negative).\n\n**What is the value of *a* in your equation, and what does that tell you about the shape?**`
    }
    if (/account|debit|credit/i.test(lower)) {
      return `${frustrationPrefix}Quick reminder: **debits always go on the LEFT side of a T-account, credits on the RIGHT**. Assets increase on the debit side; liabilities increase on the credit side.\n\n**Now, which account are you working with, and does it increase or decrease with your transaction?**`
    }
    if (turnCount === 0) {
      return `${frustrationPrefix}Here's a starting hint: **break the problem into what you're *given* and what you're *asked to find*.** List those two things out — don't solve yet.\n\n**What does the question give you, and what does it want?**`
    }
    return `${frustrationPrefix}Let me give you one stepping stone: **the key technique here is to look at the relationship between the two values before doing any calculation.**\n\n**Can you describe what you see when you compare them?**`
  }

  // ── Level 3: Worked example with different numbers ─────────────
  if (level === 3) {
    if (/circle|equation.*circle/i.test(lower)) {
      return `${frustrationPrefix}Let me show you how this works with a different example:\n\n**Example:** Find the centre and radius of *(x − 3)² + (y + 1)² = 25*\n\n**Step 1:** The equation form is *(x − h)² + (y − k)² = r²*\n**Step 2:** Compare: h = **3**, k = **−1** (note the sign flip — the bracket says +1, so k = −1)\n**Step 3:** r² = 25, so r = **5**\n**Answer:** Centre = (3, −1), Radius = 5\n\nNotice how the sign inside the bracket flips when you read off the centre.\n\n**Now apply those exact steps to your equation. What do you get?**`
    }
    if (/quadratic|x²/i.test(lower)) {
      return `${frustrationPrefix}Let me work through a similar one:\n\n**Example:** Factorise x² + 7x + 12\n\n**Step 1:** Find two numbers that *multiply* to 12 and *add* to 7\n**Step 2:** 3 × 4 = 12 ✓ and 3 + 4 = 7 ✓\n**Step 3:** So x² + 7x + 12 = **(x + 3)(x + 4)**\n\nThe trick is always: multiply to the constant, add to the middle coefficient.\n\n**Now try that method on your quadratic. What two numbers do you need?**`
    }
    if (/account|debit|credit/i.test(lower)) {
      return `${frustrationPrefix}Here's a worked example using a different transaction:\n\n**Example:** A business receives $500 cash for services rendered.\n\n| Account | Debit | Credit |\n|---|---|---|\n| Cash (Asset ↑) | 500 | |\n| Service Revenue | | 500 |\n\n*Cash increases → debit. Revenue earned → credit.*\n\n**Now set up the T-accounts for your transaction the same way. What increases and what does it affect?**`
    }
    return `${frustrationPrefix}Let me show you a worked example of a similar problem:\n\n**Example problem (different numbers):**\nIf x + 3 = 7, find x.\n**Step 1:** Isolate x — subtract 3 from both sides\n**Step 2:** x = 7 − 3 = **4**\n\nThe method: whatever operation is applied to x, do the *inverse* on both sides.\n\n**Now apply that same method to your problem. What's the first step?**`
  }

  // ── Level 4: Full explanation + new practice problem ───────────
  if (level === 4) {
    if (/circle|equation.*circle/i.test(lower)) {
      return `${frustrationPrefix}Let me explain this completely.\n\nA **circle equation** in standard form is: **(x − h)² + (y − k)² = r²**\n\n- **(h, k)** is the **centre** of the circle\n- **r** is the **radius** (square root of the number on the right)\n- The signs *flip*: if the equation says *(x − 5)*, the x-coordinate of the centre is **+5**; if it says *(x + 2)*, the centre is at **−2**\n\nThis works because the equation measures the distance from any point on the circle to the centre.\n\n---\n\n**Now your turn — new practice problem:**\nFind the centre and radius of: **(x + 4)² + (y − 6)² = 49**\n\nWork through it and tell me your answer.`
    }
    if (/account|debit|credit/i.test(lower)) {
      return `${frustrationPrefix}Here is the complete picture for double-entry bookkeeping.\n\nEvery transaction affects **two accounts**. The rule is:\n- **Assets and Expenses** → increase on the **DEBIT (left)** side\n- **Liabilities, Equity, and Revenue** → increase on the **CREDIT (right)** side\n- Total debits must always **equal** total credits\n\nTo record any transaction: identify the two accounts affected, decide which increases and which decreases, then apply the rule above.\n\n---\n\n**New practice problem:**\nA business pays $200 cash to buy office supplies.\n- Which two accounts are affected?\n- Which is debited and which is credited?\n\nWrite out the T-account entries and tell me your answer.`
    }
    return `${frustrationPrefix}Let me give you the full explanation.\n\nWhen solving this type of problem, the method is always:\n1. **Identify** what you're given and what you need to find\n2. **Choose** the right formula or rule that links them\n3. **Substitute** your values carefully\n4. **Check** your answer makes sense in context\n\nThe key insight you need here is to look at the relationship between the quantities — one is always expressed in terms of the other.\n\n---\n\n**New practice problem to try:**\nIf a car travels at 60 km/h for 2.5 hours, how far does it travel?\n\nWork through the four steps above and show me your working.`
  }

  return `${frustrationPrefix}**What part of this problem would you like to start with?**`
}
