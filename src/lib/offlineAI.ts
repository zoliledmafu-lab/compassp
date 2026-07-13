// Dynamically imported so the ONNX runtime is not bundled into the initial page load.
let _pipeline: any = null
let _env: any = null

async function loadTransformers() {
  if (!_pipeline) {
    const mod = await import('@huggingface/transformers')
    _pipeline = mod.pipeline
    _env = mod.env
  }
}

const MODEL_ID = 'HuggingFaceTB/SmolLM2-360M-Instruct'

const GENERATION_CONFIG = {
  max_new_tokens: 150,
  temperature: 0.1,
  do_sample: false,
  repetition_penalty: 1.3,
}

const SYSTEM_PROMPT = `You are Compass, a tutor for Zimbabwean ZIMSEC students.
RULES:
1. NEVER give the full answer. Give ONE guiding hint only.
2. Keep response under 3 sentences.
3. If student writes in Shona: reply in Shona first, then English translation.
4. If student writes in Ndebele: reply in Ndebele first, then English translation.
5. If student writes in English: reply in English only.
6. End with one encouraging sentence.
7. Always relate your hint to the specific subject and topic the student is studying.

EXAMPLES:
Student: What is photosynthesis?
Tutor: Think about what plants need to survive. What role does sunlight play in helping them make food? You are thinking well — keep going!

Student: Ndinoda kubatsirwa pa equation ye circle. (x-1)² + y² = 25
Tutor: Tarisa nhamba iri mukati mebrackets — inoratidza centre yecircle. (Look at the number inside the brackets — it shows the centre of the circle.) You are on the right track!

Student: I-probability ibalwa njani?
Tutor: Cabanga ngamathuba okwenzeka kwento. (Think about the chances of something happening.) Ungabala amathuba alungileyo phakathi kwawo wonke? Good thinking — try it!

Student: How do I find the gradient of a line?
Tutor: Think about rise over run — how much does y change compared to x? Can you identify two points on your line? Keep going, you are close!

Student: What causes soil erosion in Zimbabwe?
Tutor: Think about what happens to bare soil when heavy rain falls. What is missing that would normally hold the soil in place? Excellent question — you are thinking like a geographer!`

let generator: any = null
let modelReady = false

export async function initOfflineModel(onProgress: (percentage: number) => void): Promise<void> {
  if (modelReady) {
    onProgress(100)
    return
  }

  if (!navigator.onLine) {
    throw new Error(
      'The offline model needs a one-time download (230 MB). You are currently offline — connect to WiFi or data, download the model once, and after that Compass works with no internet at all.'
    )
  }

  await loadTransformers()
  _env.allowLocalModels = false
  _env.useBrowserCache = true

  try {
    generator = await _pipeline('text-generation', MODEL_ID, {
      progress_callback: (progress: any) => {
        if (progress?.status === 'downloading' && progress?.progress != null) {
          onProgress(Math.min(Math.round(progress.progress * 100), 99))
        }
        if (progress?.status === 'done') {
          onProgress(100)
        }
      },
    })
    modelReady = true
    onProgress(100)
  } catch (error) {
    console.error('[offlineAI] Model load failed:', error)
    throw new Error('Download failed. Please check your connection and try again.')
  }
}

export function isOfflineReady(): boolean {
  return modelReady
}

export async function askOffline(
  message: string,
  language: 'shona' | 'ndebele' | 'english' = 'english',
  subjectName?: string,
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  if (!modelReady || !generator) {
    throw new Error('Offline model is not ready. Call initOfflineModel first.')
  }

  const languageHint =
    language === 'shona'
      ? '\n[Student is writing in Shona. Reply in Shona first, then English.]'
      : language === 'ndebele'
      ? '\n[Student is writing in Ndebele. Reply in Ndebele first, then English.]'
      : ''

  const subjectLine = subjectName ? `[Subject: ${subjectName}]\n` : ''

  // Include last 3 exchanges so the model has conversational context
  const historyText = history && history.length > 0
    ? history.slice(-6).map(m =>
        `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`
      ).join('\n') + '\n'
    : ''

  const prompt = `${SYSTEM_PROMPT}${languageHint}

${subjectLine}${historyText}Student: ${message}
Tutor:`

  try {
    const result = await generator(prompt, {
      ...GENERATION_CONFIG,
      return_full_text: false,
    })

    const raw: string = result?.[0]?.generated_text ?? ''
    const cleaned = raw.split('Student:')[0].split('\nStudent')[0].trim()
    return cleaned || 'Let me think about that with you. Can you tell me what you already know about this topic?'
  } catch (error) {
    console.error('[offlineAI] Inference error:', error)
    return 'I had trouble processing that. Could you rephrase your question? I am here to help!'
  }
}

export function detectLanguage(message: string): 'shona' | 'ndebele' | 'english' {
  const lower = message.toLowerCase()

  const shonaWords = [
    'ndinoda', 'ndiri', 'inorevei', 'kubatsirwa', 'mhoro', 'zvakanaka',
    'unofunga', 'inoita', 'muenzaniso', 'ndeipi', 'sei',
    'kana', 'zvino', 'pane', 'chikafu', 'mvura', 'mwenje',
  ]
  const ndebeleWords = [
    'sawubona', 'ngisiza', 'ibalwa', 'njani', 'yini', 'ungangitshela',
    'cabanga', 'bheka', 'wenzile', 'ngiyabonga', 'ulama', 'sicela',
    'umbuzo', 'impendulo', 'isifundo', 'amanzi',
  ]

  const shonaScore = shonaWords.filter(w => lower.includes(w)).length
  const ndebeleScore = ndebeleWords.filter(w => lower.includes(w)).length

  if (shonaScore === 0 && ndebeleScore === 0) return 'english'
  return shonaScore >= ndebeleScore ? 'shona' : 'ndebele'
}
