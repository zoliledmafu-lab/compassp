// Compass Voice Companion — Supabase Edge Function
// Deploy: supabase functions deploy voice-companion
// Env vars needed: ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_KEY      = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const ELEVENLABS_KEY     = Deno.env.get('ELEVENLABS_API_KEY') ?? ''
const SUPABASE_URL       = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// ElevenLabs voice IDs
const VOICE_IDS = {
  female: 'EXAVITQu4vr4xnSDxMaL', // Sarah
  male:   'TX3LPaxmHKxFdv7VOQHJ', // Liam
}

// ── App detection patterns ────────────────────────────────────────────────────

const APP_PATTERNS: Record<string, { subject: string; vocabulary: string }> = {
  autocad:   { subject: 'Technical Drawing / Engineering', vocabulary: 'Use AutoCAD-specific terms: UCS, OSNAP, Modify panel, command line, viewport, blocks, layers, annotation.' },
  excel:     { subject: 'Accounting / Mathematics',        vocabulary: 'Refer to Excel elements: cells, formulas, ribbon tabs, named ranges, pivot tables, chart wizard.' },
  'vs code': { subject: 'Computer Science',                vocabulary: 'Refer to VS Code: editor, terminal, debugger, extensions, source control panel, IntelliSense.' },
  'visual studio code': { subject: 'Computer Science',     vocabulary: 'Refer to VS Code: editor, terminal, debugger, extensions, source control panel, IntelliSense.' },
  figma:     { subject: 'Design / Visual Arts',            vocabulary: 'Use Figma terms: frames, components, auto-layout, constraints, variant, prototype, layers panel.' },
  matlab:    { subject: 'Mathematics / Engineering',       vocabulary: 'Reference MATLAB: workspace, command window, script editor, toolboxes, variables, plots.' },
  solidworks:{ subject: 'Engineering / Technical Drawing', vocabulary: 'Use SolidWorks terms: feature tree, sketch, extrude, mate, assembly, drawing view.' },
  desmos:    { subject: 'Mathematics',                     vocabulary: 'Refer to Desmos: expression list, graph window, sliders, table of values, zoom controls.' },
  geogebra:  { subject: 'Mathematics / Geometry',          vocabulary: 'Use GeoGebra terms: algebra view, graphics view, construction tools, input bar, sliders.' },
}

// ── Curriculum-specific guidance ──────────────────────────────────────────────

function getCurriculumVoiceContext(subjectId: string): string {
  if (subjectId.startsWith('zol-') || subjectId.startsWith('ZIMSEC-OL')) {
    return 'ZIMSEC O-Level: Show all working for marks. Use Zimbabwe-relevant examples. Key command words: state, describe, explain, calculate, sketch.'
  }
  if (subjectId.startsWith('zal-') || subjectId.startsWith('ZIMSEC-AL')) {
    return 'ZIMSEC A-Level: Analytical depth expected. Essays need intro-body-conclusion. Command words: analyse, evaluate, assess, discuss, justify.'
  }
  if (subjectId.startsWith('igcse-') || subjectId.startsWith('CAM-IGCSE')) {
    return 'Cambridge IGCSE: Command words are precise. "state"=fact only, "describe"=characteristics, "explain"=reason with "because", "calculate"=show working+units, "suggest"=apply to new context, "evaluate"=pros+cons+conclusion.'
  }
  if (subjectId.startsWith('cal-') || subjectId.startsWith('CAM-AL')) {
    return 'Cambridge A Level: Higher-order thinking. "Evaluate" and "assess" require a final judgement. "To what extent" needs balanced argument + verdict. Quote evidence.'
  }
  return 'NSC/CAPS: South African context. Show all working. State theorems/reasons in geometry. CAPS command words apply.'
}

function detectApp(appHint: string): { subject: string; vocabulary: string } | null {
  const lower = appHint.toLowerCase()
  for (const [key, val] of Object.entries(APP_PATTERNS)) {
    if (lower.includes(key)) return val
  }
  return null
}

// ── System prompt builder (voice-optimised) ──────────────────────────────────

function buildVoiceSystemPrompt(
  rules: Record<string, unknown>,
  memory: Record<string, unknown> | null,
  subjectDetected: string,
  appVocabulary: string,
  mode: string,
  subjectId?: string,
): string {
  const curriculumContext = subjectId ? getCurriculumVoiceContext(subjectId) : ''
  const memoryBlock = memory
    ? `STUDENT PROFILE:
- Strengths: ${(memory.strengths as string[])?.join(', ') || 'unknown'}
- Struggles: ${(memory.struggles as string[])?.join(', ') || 'unknown'}
- Topics covered: ${(memory.topics_covered as string[])?.join(', ') || 'none'}
- Last session: ${memory.last_session_summary || 'none'}`
    : 'New student — no prior history.'

  const modeNote = mode === 'desktop'
    ? "You can see the student's screen right now."
    : "You can see what the student has open in their browser."

  return `You are Compass — a sharp, warm, genuinely fun study companion speaking out loud. ${modeNote}

VOICE RULES (you're talking, not typing — keep it natural and brief):
- 2–3 sentences MAX. Voice conversations need room to breathe.
- Sound like a friend on the phone, not a teacher at a whiteboard.
- ONE question per response — make it feel like real curiosity.
- Use simple, everyday words. Avoid jargon unless it's the actual term they need to learn.
- If they're frustrated, name it first: "I can hear that, let's slow down."
- If they ask you to just do it for them, empathise then redirect: "I get it — let's make this quick. Try this..."

YOUR VIBE:
- Warm and real. A little playful when the moment's right.
- Celebrate wins out loud: "That's it! You've got it."
- Treat confusion as interesting, not a problem: "Okay, interesting — what part feels wobbly?"
- You're excited about this subject and it shows, but you never lecture.

SUBJECT: ${subjectDetected || 'General study'}
${curriculumContext ? `CURRICULUM CONTEXT: ${curriculumContext}` : ''}
${appVocabulary ? `APP CONTEXT: ${appVocabulary}` : ''}

${memoryBlock}

POINTER GUIDANCE: To highlight something on screen, add this at the END of your response (it gets removed before speech):
POINTER_TARGETS:[{"label":"button or area name","hint":"where it is on screen"}]`
}

// ── Claude call ───────────────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  screenshotBase64: string,
  transcript: string,
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 },
          },
          { type: 'text', text: transcript || 'What do you see on my screen? Guide me.' },
        ],
      }],
    }),
  })
  if (!res.ok) throw new Error(`Claude error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

// ── ElevenLabs TTS ────────────────────────────────────────────────────────────

async function textToSpeech(text: string, voice: 'male' | 'female'): Promise<string | null> {
  if (!ELEVENLABS_KEY) return null
  const voiceId = VOICE_IDS[voice]
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })
  if (!res.ok) return null
  const buffer = await res.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

// ── Parse pointer targets out of Claude response ──────────────────────────────

function extractPointerTargets(raw: string): { spokenText: string; pointerTargets: unknown[] } {
  const match = raw.match(/POINTER_TARGETS:(\[[\s\S]*?\])/)
  if (!match) return { spokenText: raw.trim(), pointerTargets: [] }
  try {
    const targets = JSON.parse(match[1])
    return { spokenText: raw.replace(match[0], '').trim(), pointerTargets: targets }
  } catch {
    return { spokenText: raw.trim(), pointerTargets: [] }
  }
}

// ── Detect subject from screenshot using Claude ───────────────────────────────

async function detectSubjectFromScreen(screenshotBase64: string, appHint: string): Promise<string> {
  if (appHint) {
    const known = detectApp(appHint)
    if (known) return known.subject
  }
  // Ask Claude to identify the subject quickly
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 30,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 } },
            { type: 'text', text: 'What subject or application is on screen? Reply with ONE short phrase only, e.g. "Mathematics", "AutoCAD", "Python programming". No explanation.' },
          ],
        }],
      }),
    })
    if (!res.ok) return 'General study'
    const data = await res.json()
    return data.content?.[0]?.text?.trim() ?? 'General study'
  } catch {
    return 'General study'
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-student-id',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  try {
    const { screenshot_base64, transcript, student_id, mode, app_detected, voice_gender, subject_id } =
      await req.json() as {
        screenshot_base64: string
        transcript: string
        student_id?: string
        mode?: string
        app_detected?: string
        voice_gender?: 'male' | 'female'
        subject_id?: string
      }

    const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // 1. Fetch rules
    const { data: rulesRow } = await db.from('rules').select('*').limit(1).single()
    const rules = rulesRow ?? { no_direct_answers: true, always_encouraging: true, voice_enabled: true, desktop_mode_enabled: true }

    // Check if voice / desktop is enabled
    if (!rules.voice_enabled) {
      return new Response(JSON.stringify({ error: 'Voice companion is disabled by your institution.' }), { headers: corsHeaders, status: 403 })
    }
    if (mode === 'desktop' && !rules.desktop_mode_enabled) {
      return new Response(JSON.stringify({ error: 'Desktop mode is disabled by your institution.' }), { headers: corsHeaders, status: 403 })
    }

    // 2. Fetch student memory
    let memory = null
    if (student_id) {
      const { data: subjectDetectRow } = await db
        .from('student_memory').select('*').eq('student_id', student_id).limit(1).single()
      memory = subjectDetectRow
    }

    // 3. Detect subject + app
    const subjectDetected = await detectSubjectFromScreen(screenshot_base64, app_detected ?? '')
    const appInfo = detectApp(app_detected ?? subjectDetected)

    // 4. Build system prompt
    const systemPrompt = buildVoiceSystemPrompt(
      rules,
      memory,
      subjectDetected,
      appInfo?.vocabulary ?? '',
      mode ?? 'browser',
      subject_id,
    )

    // 5. Call Claude
    const rawResponse = await callClaude(systemPrompt, screenshot_base64, transcript)

    // 6. Extract pointer targets from response
    const { spokenText, pointerTargets } = extractPointerTargets(rawResponse)

    // 7. TTS (ElevenLabs if key available, else null → browser will use Web Speech)
    const audioBase64 = await textToSpeech(spokenText, voice_gender ?? 'female')

    // 8. Log session
    if (student_id) {
      await db.from('voice_sessions').insert({
        student_id,
        mode: mode ?? 'browser',
        source_context: app_detected ?? subjectDetected,
        transcript_summary: transcript?.substring(0, 200),
        response_summary: spokenText.substring(0, 200),
        rules_snapshot: rules,
        hints_given: 1,
        subject_detected: subjectDetected,
        pointer_targets_used: pointerTargets.length > 0,
      })
    }

    return new Response(JSON.stringify({
      response_text: spokenText,
      audio_base64:  audioBase64,
      pointer_targets: pointerTargets,
      subject_detected: subjectDetected,
    }), { headers: corsHeaders })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { headers: corsHeaders, status: 500 })
  }
})
