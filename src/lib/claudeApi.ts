export interface Message {
  role: 'user' | 'assistant'
  content: string
}

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

export async function streamCompletion(
  systemPrompt: string,
  messages: Message[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<void> {
  if (!API_KEY || API_KEY === 'placeholder_api_key') {
    // Demo mode: simulate a contextual Socratic response
    const demoResponse = getDemoResponse(messages)
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
      const err = await response.text()
      onError(`API error: ${response.status} ${err}`)
      return
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) { onError('No response body'); return }

    let buffer = ''
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
              onChunk(parsed.delta.text)
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    }
    onDone()
  } catch (e) {
    onError(String(e))
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

function getDemoResponse(messages: Message[]): string {
  const userMsg = messages[messages.length - 1]?.content || ''
  const lower = userMsg.toLowerCase()

  const prevAssistant = [...messages].reverse().find(m => m.role === 'assistant')?.content || ''
  const alreadyAskedUnderstanding = /what do you (already )?know|walk me through|what.*you think/i.test(prevAssistant)
  const alreadyAskedSpecific = /what part|where.*stuck|which step/i.test(prevAssistant)
  const turnCount = messages.filter(m => m.role === 'assistant').length

  // ── Greetings ──────────────────────────────────────────────────
  if (turnCount === 0 && /^(hello|hi|hey|good (morning|afternoon|evening))/i.test(lower)) {
    return "Hey! 👋 I'm Compass — basically that friend who's weirdly enthusiastic about whatever subject you're studying and actually wants to help you get it.\n\nI'm not going to just hand you answers (sorry, not sorry — that's not how brains actually learn 😄), but I *will* walk through it with you until it clicks.\n\n**What are you working on? Hit me.**"
  }

  // ── Direct answer requests ─────────────────────────────────────
  if (/just (give|tell|show) me the answer|what('s| is) the answer|solve (this|it) for me|give me the solution/i.test(lower)) {
    return "Okay, I *hear* you — trust me, I get it. But if I just hand it over, you'll be back here with the exact same question before the exam, and that's worse for both of us 😅\n\nHere's the deal: **tell me what you've tried so far, even if it feels totally wrong.** Starting from your attempt is always way faster than starting from zero. What've you got?"
  }

  // ── After asking "what do you know" ───────────────────────────
  if (alreadyAskedUnderstanding && turnCount >= 1) {
    if (/difficult|hard|confus|don't know|nothing|no idea|not sure|lost/i.test(lower)) {
      return `That's honestly a great place to start — "confused" just means there's one specific thing blocking everything else, and once we find it, it usually unlocks fast.\n\nLet me ask you this: **when you first read the question or saw this topic, was there ANY part that made sense at all?** Even something tiny. We'll build from there.`
    }
    if (/square root|sqrt/i.test(lower)) {
      return `Okay nice — you've named it! Square roots are sneaky because they're actually just the reverse of squaring, which you already know.\n\nQuick one: **what's 9²?** Don't overthink it. Just that.`
    }
    return `Love that you shared that — really helps me understand where you're starting from.\n\nAlright, let's do this one piece at a time. **Can you describe the problem or concept in your own words?** Not the textbook definition — just how you'd explain it to a friend. What do you see?`
  }

  // ── After asking "what part specifically" ─────────────────────
  if (alreadyAskedSpecific && turnCount >= 1) {
    return `Got it, that's super helpful. Let's zoom right into that bit.\n\nHere's what I want you to try: **write out every step you DO know, even if you can't finish it.** Messy is fine. I just want to see where your thinking is at — that tells me exactly which one hint will unlock the rest for you.`
  }

  // ── Stuck / confused ──────────────────────────────────────────
  if (/difficult|hard|confus|stuck|don't understand|i don't get|lost/i.test(lower)) {
    if (turnCount === 0) {
      return `Ugh, that feeling is the WORST — but honestly? Being stuck usually means you're right at the edge of figuring it out. Which is kind of exciting when you think about it 🤔\n\n**What exactly are you working on?** Give me the topic, the question, even just the word that's tripping you up. The more specific, the faster we crack it.`
    }
    return `Okay, let's slow way down for a second.\n\nForget the whole problem — just tell me: **what is the question actually asking you to find?** Put it in your own words, as rough as you want. Sometimes just saying it out loud is the thing that shifts it.`
  }

  // ── Subject-specific ──────────────────────────────────────────
  if (/square root|√|radical/i.test(lower)) {
    return `Oh, square roots are one of those things that look scarier than they are — I promise.\n\nHere's the trick: a square root is just undoing a square. So **what's 9²?** Tell me that first, and I'll show you exactly how it connects back.`
  }
  if (/quadratic|x²|parabola/i.test(lower)) {
    return `Quadratics! Okay so there are three ways to tackle these — factoring, completing the square, or the formula — and picking the right one is half the battle.\n\n**Which method do you think the question wants you to use?** Or if you're not sure, what does the equation look like? Show me what you're working with.`
  }
  if (/fraction|denominator|numerator/i.test(lower)) {
    return `Fractions have completely different rules depending on what you're doing with them, so let's make sure we're on the same one.\n\n**Is this adding, subtracting, multiplying, or dividing?** Once I know that, the rule becomes really straightforward.`
  }
  if (/force|newton|acceleration|velocity|motion/i.test(lower)) {
    return `Newton's laws — I love these because once they click, they explain SO much.\n\n**Which of his three laws do you think is in play here?** Don't worry about quoting it perfectly — just give me your gut feeling. What does the situation remind you of?`
  }
  if (/cell|dna|gene|protein|evolution|photosynthesis/i.test(lower)) {
    return `Life Sciences is one of those subjects where everything connects to everything else, which is cool but also can feel overwhelming.\n\n**Walk me through what you already know about this** — like you're explaining it to a friend who missed class. Even an incomplete version. Go!`
  }
  if (/acid|base|pH|reaction|equation|mole|mol/i.test(lower)) {
    return `Chemistry is 80% about setting up the problem right before you calculate anything.\n\nSo let's do that first: **what does the question give you, and what is it asking you to find?** Just list them out — don't solve yet. What do you see?`
  }
  if (/essay|paragraph|thesis|argument|writing/i.test(lower)) {
    return `Here's the thing about essays: a strong one has ONE clear point it's trying to prove, and everything else backs it up.\n\n**In one sentence — what do you want your reader to believe by the end?** That's your thesis. Don't worry if it sounds rough, we'll sharpen it. What do you have?`
  }

  // ── Ongoing conversation ──────────────────────────────────────
  if (turnCount >= 3) {
    const followUps = [
      `Okay you're actually getting somewhere here — I can see it. Let's keep the momentum going.\n\n**What do you think happens next in this process?** Take a shot at it, even if you're 50/50. I'll jump in if you need it.`,
      `Good, good — now here's the real question: **can you tell me WHY that step works?** Not just what it is — why it's valid. That's the thing that actually makes it stick in an exam.`,
      `Let's do a quick "teaching test" — if your friend texted you right now asking about this exact concept, **how would you explain what we just worked through?** Your own words, zero pressure.`,
      `You're closer than you think. Just one thing to check: **does your answer make sense in the real world?** Does the number feel right? Does the direction of the effect make sense? What's your gut say?`,
    ]
    return followUps[turnCount % followUps.length]
  }

  // ── Generic opener ────────────────────────────────────────────
  const openers = [
    `Okay, let's get into it!\n\nBefore I say anything else — **what's your first instinct about how to start this?** Doesn't have to be right, just tell me what comes to mind first.`,
    `Let's figure this out together.\n\nFirst move: **what information does the question actually give you?** Just list out everything you know from the problem. That alone usually reveals more than you'd expect.`,
    `Alright, I'm with you on this.\n\n**Have you seen something similar before?** Even loosely? If so, what did you do then? Starting from what's already familiar is always the fastest way in.`,
  ]
  return openers[messages.filter(m => m.role === 'user').length % openers.length]
}
