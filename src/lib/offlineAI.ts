import { CreateMLCEngine } from '@mlc-ai/web-llm'
import type { MLCEngine, InitProgressReport } from '@mlc-ai/web-llm'

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'

const SYSTEM_PROMPT =
  'You are Compass, an AI tutor for Zimbabwean ZIMSEC students. NEVER give a direct answer. Always guide with questions and hints. When the student writes in Shona, reply in BOTH Shona and English — give the Shona explanation first, then the English translation immediately after, so the student learns the concept in their native language while also building their English exam vocabulary. When the student writes in Ndebele, reply in BOTH Ndebele and English — give the Ndebele explanation first, then the English translation immediately after. This is critical because ZIMSEC examinations are written in English and students must be comfortable with English academic vocabulary. Keep total response to 4 sentences maximum. End encouragingly.'

let engine: MLCEngine | null = null

export async function initOfflineModel(onProgress: (pct: number) => void): Promise<void> {
  engine = await CreateMLCEngine(MODEL_ID, {
    initProgressCallback: (report: InitProgressReport) => {
      onProgress(Math.round(report.progress * 100))
    },
  })
}

export function isOfflineReady(): boolean {
  return engine !== null
}

export async function askOffline(message: string, _language: string): Promise<string> {
  if (!engine) throw new Error('Offline model not loaded')
  const reply = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ],
    temperature: 0.7,
    max_tokens: 256,
  })
  return reply.choices[0]?.message?.content ?? ''
}
