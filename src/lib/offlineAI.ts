import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false

const MODEL_ID = 'HuggingFaceTB/SmolLM2-360M-Instruct'

const SYSTEM_PROMPT =
  'You are Compass, an AI tutor for Zimbabwean ZIMSEC students. NEVER give a direct answer. Always guide with questions and hints. When the student writes in Shona, reply in BOTH Shona and English — give the Shona explanation first, then the English translation immediately after, so the student learns the concept in their native language while also building their English exam vocabulary. When the student writes in Ndebele, reply in BOTH Ndebele and English — give the Ndebele explanation first, then the English translation immediately after. This is critical because ZIMSEC examinations are written in English and students must be comfortable with English academic vocabulary. Keep total response to 4 sentences maximum. End encouragingly.'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let generator: any = null
let runningOnGPU = false

export async function initOfflineModel(onProgress: (pct: number) => void): Promise<void> {
  const progressCallback = (p: any) => {
    if (p.status === 'progress' && typeof p.progress === 'number') {
      onProgress(Math.round(p.progress))
    }
  }

  // Try WebGPU first — fast on desktop and high-end phones
  const hasGPU = 'gpu' in navigator
  if (hasGPU) {
    try {
      const adapter = await (navigator as any).gpu.requestAdapter()
      if (adapter) {
        generator = await pipeline('text-generation', MODEL_ID, {
          device: 'webgpu',
          dtype: 'q4f16',
          progress_callback: progressCallback,
        })
        runningOnGPU = true
        return
      }
    } catch { /* no WebGPU — fall through to WASM */ }
  }

  // Fall back to WASM/CPU — works on all devices including mobile
  generator = await pipeline('text-generation', MODEL_ID, {
    device: 'wasm',
    dtype: 'q4',
    progress_callback: progressCallback,
  })
  runningOnGPU = false
}

export function isOfflineReady(): boolean {
  return generator !== null
}

export function isRunningOnGPU(): boolean {
  return runningOnGPU
}

export async function askOffline(message: string, _language: string): Promise<string> {
  if (!generator) throw new Error('Offline model not loaded')

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: message },
  ]

  const result = await generator(messages, {
    max_new_tokens: 200,
    do_sample: true,
    temperature: 0.7,
    return_full_text: false,
  })

  const output = result?.[0]?.generated_text
  if (Array.isArray(output)) {
    return output.at(-1)?.content ?? ''
  }
  return String(output ?? '')
}
