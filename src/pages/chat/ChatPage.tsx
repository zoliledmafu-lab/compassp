import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MermaidDiagram } from '../../components/chat/MermaidDiagram'
import { FunctionPlot, parseFunctionPlot } from '../../components/chat/FunctionPlot'
import { VizBlock, parseVizBlock } from '../../components/chat/VizBlock'
import {
  Send, Paperclip, Volume2, VolumeX, RefreshCw,
  Lightbulb, BookOpen, ChevronDown, Mic, MicOff, Clock,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useRules } from '../../contexts/RulesContext'
import { useMemory } from '../../contexts/MemoryContext'
import { supabase, SUPABASE_ENABLED } from '../../lib/supabase'
import { buildSystemPrompt, detectFrustration, getScaffoldLevel } from '../../lib/ruleEngine'
import { streamCompletion, extractSessionInsights, isSafeInput } from '../../lib/claudeApi'
import { getSubject, SUBJECTS } from '../../lib/subjects'
import { getPinnedSubjects, getCurriculumSubjects } from '../../lib/pinnedSubjects'
import { Button } from '../../components/ui/Button'
import { UploadPanel } from '../../components/chat/UploadPanel'
import type { Message } from '../../lib/claudeApi'

// ─── Storage helpers ───────────────────────────────────────────────

const SESSION_KEY_PREFIX = 'compass_chat_'

interface StoredChatData {
  messages: Message[]
  sessionBoundaries: number[]   // indices where new sessions started
  lastActive: number            // unix ms
}

function storageKey(userId: string, subject: string) {
  return `${SESSION_KEY_PREFIX}${userId}_${subject}`
}

const EMPTY_CHAT: StoredChatData = { messages: [], sessionBoundaries: [], lastActive: 0 }

async function loadChatData(userId: string, subject: string): Promise<StoredChatData> {
  // Try Supabase first
  if (SUPABASE_ENABLED && !userId.startsWith('user-')) {
    const { data } = await supabase
      .from('chat_sessions')
      .select('messages, session_boundaries, last_active')
      .eq('student_id', userId)
      .eq('subject', subject)
      .single()
    if (data) {
      return {
        messages:          (data.messages          as Message[]) ?? [],
        sessionBoundaries: (data.session_boundaries as number[]) ?? [],
        lastActive:        data.last_active ? new Date(data.last_active).getTime() : 0,
      }
    }
  }
  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(storageKey(userId, subject))
    if (!raw) return EMPTY_CHAT
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return { messages: parsed, sessionBoundaries: [], lastActive: Date.now() }
    return parsed
  } catch {
    return EMPTY_CHAT
  }
}

async function saveChatData(userId: string, subject: string, data: StoredChatData): Promise<void> {
  const trimmed = { ...data, messages: data.messages.slice(-120) }

  if (SUPABASE_ENABLED && !userId.startsWith('user-')) {
    await supabase.from('chat_sessions').upsert({
      student_id:         userId,
      subject,
      messages:           trimmed.messages,
      session_boundaries: trimmed.sessionBoundaries,
      last_active:        new Date(trimmed.lastActive || Date.now()).toISOString(),
    }, { onConflict: 'student_id,subject' })
    return
  }
  localStorage.setItem(storageKey(userId, subject), JSON.stringify(trimmed))
}

async function clearChatData(userId: string, subject: string): Promise<void> {
  if (SUPABASE_ENABLED && !userId.startsWith('user-')) {
    await supabase.from('chat_sessions')
      .delete()
      .eq('student_id', userId)
      .eq('subject', subject)
    return
  }
  localStorage.removeItem(storageKey(userId, subject))
}

// ─── Component ─────────────────────────────────────────────────────

export function ChatPage() {
  const { user } = useAuth()
  const { rules } = useRules()
  const { getMemory, updateMemory } = useMemory()
  const [searchParams, setSearchParams] = useSearchParams()

  // Determine subjects visible to this user
  const curriculumSubjects = getCurriculumSubjects(user ?? null)
  const pinned = user ? getPinnedSubjects(user.id) : []
  // Picker shows pinned first (if any), then remaining curriculum subjects
  const pinnedIds = pinned.map(s => s.id)
  const pickerSubjects = pinned.length > 0
    ? [...pinned, ...curriculumSubjects.filter(s => !pinnedIds.includes(s.id))]
    : curriculumSubjects

  const fallbackId = pinned[0]?.id ?? curriculumSubjects[0]?.id ?? SUBJECTS[0].id
  const subjectId = searchParams.get('subject') || fallbackId
  const subject = getSubject(subjectId) || curriculumSubjects[0] || SUBJECTS[0]

  const [messages, setMessages] = useState<Message[]>([])
  const [sessionBoundaries, setSessionBoundaries] = useState<number[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [hintCount, setHintCount] = useState(0)
  const [frustrationDetected, setFrustrationDetected] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female')
  const [showSubjectPicker, setShowSubjectPicker] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [resumedFrom, setResumedFrom] = useState<Date | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const currentStreamRef = useRef('')
  const messagesRef = useRef<Message[]>([])
  // Tracks last 3 user messages for repeated-question frustration detection
  const recentUserMsgsRef = useRef<string[]>([])

  // ── Load / resume session ──────────────────────────────────────

  useEffect(() => {
    if (!user) return
    loadChatData(user.id, subjectId).then(data => {
      const isResume = data.messages.length > 0
      if (isResume) {
        const newBoundary = data.messages.length
        setMessages(data.messages)
        setSessionBoundaries([...data.sessionBoundaries, newBoundary])
        messagesRef.current = data.messages
        setResumedFrom(data.lastActive ? new Date(data.lastActive) : new Date())
        const memory = getMemory(user.id, subjectId)
        updateMemory(user.id, subjectId, {
          session_count: (memory?.session_count || 0) + 1,
          last_session_date: new Date().toISOString(),
        })
      } else {
        setMessages([])
        setSessionBoundaries([])
        messagesRef.current = []
        setResumedFrom(null)
      }
      setHintCount(0)
      setFrustrationDetected(false)
      recentUserMsgsRef.current = []
      setError('')
    })
  }, [user?.id, subjectId]) // eslint-disable-line

  // ── Save session summary on unmount / subject change ──────────

  const saveSessionSummaryRef = useRef<() => void>(() => {})

  useEffect(() => {
    saveSessionSummaryRef.current = async () => {
      if (!user || messagesRef.current.length < 2) return
      try {
        const insights = await extractSessionInsights(subject.name, messagesRef.current)
        if (!insights.summary) return
        const memory = getMemory(user.id, subjectId)
        const newTopics = Array.from(new Set([...(memory?.topics_covered || []), ...insights.topics]))
        const newStrengths = Array.from(new Set([...(memory?.strengths || []), ...insights.strengths]))
        const newStruggles = Array.from(new Set([...(memory?.struggles || []), ...insights.struggles]))
        updateMemory(user.id, subjectId, {
          last_session_summary: insights.summary,
          topics_covered: newTopics.slice(0, 30),
          strengths: newStrengths.slice(0, 10),
          struggles: newStruggles.slice(0, 10),
        })
      } catch { /* best-effort */ }
    }
  })

  useEffect(() => {
    return () => {
      saveSessionSummaryRef.current()
    }
  }, [subjectId]) // trigger when subject changes too

  // ── Scroll to bottom ──────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // ── TTS ───────────────────────────────────────────────────────

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return
    const clean = text.replace(/[*_`#>\[\]]/g, '').substring(0, 400)
    const utt = new SpeechSynthesisUtterance(clean)
    const voices = speechSynthesis.getVoices()
    const preferred = voices.find(v =>
      voiceGender === 'female'
        ? v.name.toLowerCase().includes('female') || v.name.includes('Samantha') || v.name.includes('Victoria')
        : v.name.toLowerCase().includes('male') || v.name.includes('Daniel') || v.name.includes('Alex')
    )
    if (preferred) utt.voice = preferred
    utt.rate = 0.95
    utt.pitch = voiceGender === 'female' ? 1.1 : 0.9
    speechSynthesis.cancel()
    speechSynthesis.speak(utt)
  }, [voiceEnabled, voiceGender])

  // ── Send message ──────────────────────────────────────────────

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || streaming || !user) return
    setError('')
    if (!isSafeInput(content)) {
      setError("I can only help with your school subjects. Let's focus on your studies!")
      return
    }

    // Detect frustration before updating state so we can pass it to the prompt synchronously
    const isFrustrated = detectFrustration(content, recentUserMsgsRef.current)
    setFrustrationDetected(isFrustrated)

    // Track last 3 user messages for repeated-question detection
    recentUserMsgsRef.current = [...recentUserMsgsRef.current.slice(-2), content]

    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    messagesRef.current = newMessages
    setInput('')
    setStreaming(true)
    setStreamingText('')
    currentStreamRef.current = ''

    const memory = getMemory(user.id, subjectId)
    const systemPrompt = buildSystemPrompt(rules, subject, memory, hintCount, isFrustrated)

    await streamCompletion(
      systemPrompt,
      newMessages,
      (chunk) => {
        currentStreamRef.current += chunk
        setStreamingText(currentStreamRef.current)
      },
      async () => {
        const assistantMsg: Message = { role: 'assistant', content: currentStreamRef.current }
        const final = [...newMessages, assistantMsg]
        setMessages(final)
        messagesRef.current = final

        saveChatData(user.id, subjectId, {
          messages: final,
          sessionBoundaries: sessionBoundaries,
          lastActive: Date.now(),
        })

        setStreamingText('')
        setStreaming(false)
        speak(currentStreamRef.current)

        // Always increment — every exchange advances the scaffold level
        setHintCount(c => c + 1)

        // After every 4 assistant messages, refresh memory insights in the background
        const assistantCount = final.filter(m => m.role === 'assistant').length
        if (assistantCount > 0 && assistantCount % 4 === 0) {
          extractSessionInsights(subject.name, final).then(insights => {
            if (!insights.summary || !user) return
            const mem = getMemory(user.id, subjectId)
            const newTopics = Array.from(new Set([...(mem?.topics_covered || []), ...insights.topics]))
            updateMemory(user.id, subjectId, {
              topics_covered: newTopics.slice(0, 30),
              strengths: Array.from(new Set([...(mem?.strengths || []), ...insights.strengths])).slice(0, 10),
              struggles: Array.from(new Set([...(mem?.struggles || []), ...insights.struggles])).slice(0, 10),
              last_session_summary: insights.summary,
            })
          }).catch(() => {})
        }
      },
      (err) => {
        setError(err)
        setStreaming(false)
        setStreamingText('')
      }
    )
  }, [messages, sessionBoundaries, streaming, user, rules, subject, hintCount, getMemory, updateMemory, subjectId, speak])

  // ── Input handlers ────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setInput(prev => prev + (prev ? ' ' : '') + transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const clearChat = () => {
    if (!user) return
    if (!window.confirm('Clear this conversation? Your memory profile will be kept.')) return
    setMessages([])
    setSessionBoundaries([])
    setResumedFrom(null)
    messagesRef.current = []
    recentUserMsgsRef.current = []
    clearChatData(user.id, subjectId)
    setHintCount(0)
    setFrustrationDetected(false)
  }

  const handleUploadContext = (context: string) => {
    setInput(prev => prev + (prev ? '\n\n' : '') + context)
    setShowUpload(false)
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="glass-dark border-b border-white/8 px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={() => setShowSubjectPicker(s => !s)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass hover:bg-white/10 transition-all text-sm font-medium"
          >
            <span className="text-lg">{subject.icon}</span>
            <span className="text-white">{subject.name}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          <ScaffoldIndicator hintCount={hintCount} maxScaffoldLevel={rules.max_scaffold_level ?? 3} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            className={`p-2 rounded-xl transition-all ${voiceEnabled ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
          >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {voiceEnabled && (
            <button
              onClick={() => setVoiceGender(g => g === 'female' ? 'male' : 'female')}
              className="px-2 py-1 rounded-lg text-xs glass text-slate-300 hover:text-white transition-all"
            >
              {voiceGender === 'female' ? '♀ Female' : '♂ Male'}
            </button>
          )}
          <button onClick={clearChat} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all" title="Clear chat">
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* Subject picker — only pinned subjects */}
      {showSubjectPicker && (
        <div className="glass-dark border-b border-white/8 px-4 py-3">
          {pinned.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2">
              No subjects pinned yet. Go to Dashboard to add subjects.
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-600 font-medium uppercase tracking-wider mb-2">Your Subjects</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {pinned.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSearchParams({ subject: s.id }); setShowSubjectPicker(false) }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                      s.id === subjectId ? 'gradient-primary text-white' : 'glass text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Empty state */}
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-16">
            <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center glow text-4xl">
              {subject.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{subject.name}</h2>
              <p className="text-slate-400 max-w-md">
                Ask a question about {subject.name} and Compass will guide you through it step by step.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {[
                `What are the key topics I need to know in ${subject.name} for ${subject.curriculum}?`,
                `I'm stuck on a ${subject.name} problem — can you guide me through it?`,
                `What do ZIMSEC examiners look for in ${subject.name} answers?`,
                `How should I structure my answers in a ${subject.curriculum} ${subject.name} exam?`,
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="glass hover:bg-white/10 rounded-xl p-3 text-sm text-slate-300 hover:text-white text-left transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list with session boundaries */}
        {messages.map((msg, i) => (
          <React.Fragment key={i}>
            {sessionBoundaries.includes(i) && (
              <SessionDivider date={i === sessionBoundaries[sessionBoundaries.length - 1] ? resumedFrom : null} />
            )}
            <MessageBubble message={msg} />
          </React.Fragment>
        ))}

        {streaming && streamingText && (
          <MessageBubble message={{ role: 'assistant', content: streamingText }} streaming />
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 max-w-md">
              {error}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="px-4 pb-2">
          <UploadPanel onContext={handleUploadContext} onClose={() => setShowUpload(false)} />
        </div>
      )}

      {/* Input bar */}
      <div className="glass-dark border-t border-white/8 px-4 py-3 shrink-0">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <button
            onClick={() => setShowUpload(s => !s)}
            className={`p-2.5 rounded-xl transition-all mb-0.5 ${showUpload ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            title="Upload file"
          >
            <Paperclip size={18} />
          </button>
          <div className="flex-1 glass rounded-2xl flex items-end gap-2 px-4 py-2.5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${subject.name}… (Shift+Enter for new line)`}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 resize-none focus:outline-none min-h-[24px] max-h-[200px] leading-relaxed"
              rows={1}
              disabled={streaming}
            />
            <button
              onClick={listening ? stopListening : startListening}
              className={`p-1.5 rounded-lg transition-all shrink-0 ${listening ? 'text-red-400 animate-pulse' : 'text-slate-500 hover:text-white'}`}
              title="Voice input"
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            loading={streaming}
            className="p-2.5 mb-0.5"
          >
            <Send size={18} />
          </Button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-2">
          Compass guides you to the answer rather than providing it. That is how lasting understanding is built.
        </p>
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

function ScaffoldIndicator({ hintCount, maxScaffoldLevel }: { hintCount: number; maxScaffoldLevel: number }) {
  const level = getScaffoldLevel(hintCount, maxScaffoldLevel)
  if (level === 1) return null
  if (level === 2) return (
    <span className="text-xs text-amber-400/80 flex items-center gap-1">
      <Lightbulb size={12} />
      Getting a hint
    </span>
  )
  if (level === 3) return (
    <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
      <Lightbulb size={12} />
      Seeing an example
    </span>
  )
  return (
    <span className="text-xs text-purple-400 flex items-center gap-1 font-medium">
      <BookOpen size={12} />
      Full explanation mode
    </span>
  )
}

function SessionDivider({ date }: { date: Date | null }) {
  const label = date
    ? `Resuming — last session ${formatRelativeDate(date)}`
    : 'New session'

  return (
    <div className="flex items-center gap-3 max-w-4xl mx-auto w-full py-2">
      <div className="flex-1 h-px bg-indigo-500/20" />
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass border-indigo-500/20 text-xs text-indigo-400/70">
        <Clock size={11} />
        {label}
      </div>
      <div className="flex-1 h-px bg-indigo-500/20" />
    </div>
  )
}

function formatRelativeDate(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins} min ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'yesterday'
  return date.toLocaleDateString()
}

function MessageBubble({ message, streaming }: { message: Message; streaming?: boolean }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex max-w-4xl mx-auto w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[82%] ${
        isUser
          ? 'gradient-primary text-white rounded-tr-sm'
          : 'glass text-slate-100 rounded-tl-sm'
      }`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children }) {
                  const lang = (className ?? '').replace('language-', '').trim()
                  const raw = String(children).replace(/\n$/, '')

                  if (lang === 'mermaid') {
                    return <MermaidDiagram code={raw} isStreaming={streaming} />
                  }
                  if (lang === 'graph') {
                    const cfg = parseFunctionPlot(raw)
                    if (cfg) return <FunctionPlot config={cfg} />
                  }
                  if (lang === 'viz') {
                    const cfg = parseVizBlock(raw)
                    if (cfg) return <VizBlock config={cfg} />
                  }
                  if (lang === 'svg') {
                    return (
                      <div
                        className="my-3 overflow-x-auto bg-white/5 border border-white/8 rounded-xl p-4"
                        dangerouslySetInnerHTML={{ __html: raw }}
                      />
                    )
                  }
                  // Default: styled inline/block code
                  return lang ? (
                    <pre className="bg-white/8 rounded-lg p-3 overflow-x-auto text-xs leading-relaxed">
                      <code>{raw}</code>
                    </pre>
                  ) : (
                    <code className="bg-white/10 rounded px-1 py-0.5 text-indigo-300 text-xs">{raw}</code>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            {streaming && (
              <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse rounded-sm ml-1 align-text-bottom" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
