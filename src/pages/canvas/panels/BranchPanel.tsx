import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { X, Send, GitBranch, Loader, CheckCircle } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useRules } from '../../../contexts/RulesContext'
import { useMemory } from '../../../contexts/MemoryContext'
import { buildSystemPrompt } from '../../../lib/ruleEngine'
import { streamCompletion, buildBranchContext, summariseBranch } from '../../../lib/claudeApi'
import { loadBranchMessages, saveBranchMessages } from '../storage'
import type { CanvasRFNode, BranchMessage } from '../types'
import type { Message } from '../../../lib/claudeApi'
import { SUBJECTS } from '../../../lib/subjects'

interface Props {
  branchNodeId: string
  allNodes: CanvasRFNode[]
  subjectId: string
  onClose: (summary: string, messageCount: number) => void
  onBranchFromBranch: (branchNodeId: string) => void
}

export function BranchPanel({ branchNodeId, allNodes, subjectId, onClose, onBranchFromBranch }: Props) {
  const { user } = useAuth()
  const { rules } = useRules()
  const { getMemory } = useMemory()

  const [messages, setMessages] = useState<BranchMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [summarising, setSummarising] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const streamRef = useRef('')

  // Resolve the branch node and its parent
  const branchNode = allNodes.find(n => n.id === branchNodeId)
  const branchData = branchNode?.data as any
  const parentNode = branchData?.parentNodeId
    ? allNodes.find(n => n.id === branchData.parentNodeId)
    : null

  // Build parent context string
  const parentContext = parentNode
    ? buildBranchContext(
        parentNode.type as 'text' | 'image' | 'branch',
        (parentNode.data as any).content || (parentNode.data as any).caption || '',
        (parentNode.data as any).summary || '',
      )
    : 'CANVAS NODE CONTEXT — the student is exploring their study canvas.'

  // Build system prompt for this branch
  const subject = SUBJECTS.find(s => s.id === subjectId) || SUBJECTS[0]
  const memory = user ? getMemory(user.id, subjectId) : null
  const systemPrompt = buildSystemPrompt(rules, subject, memory, 0) + '\n\n' + parentContext

  // Load persisted messages
  useEffect(() => {
    if (!user) return
    loadBranchMessages(user.id, branchNodeId).then(stored => setMessages(stored))
  }, [user?.id, branchNodeId]) // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || streaming || !user) return
    setError('')

    const newBranchMsg: BranchMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    const updated = [...messages, newBranchMsg]
    setMessages(updated)
    setInput('')
    setStreaming(true)
    setStreamingText('')
    streamRef.current = ''

    // Convert to Message format for API
    const apiMessages: Message[] = updated.map(m => ({ role: m.role, content: m.content }))

    // If parent is an image node, prepend image to first user message
    if (parentNode?.type === 'image' && updated.length === 1) {
      const imgSrc = (parentNode.data as any).src || ''
      if (imgSrc.startsWith('data:image/')) {
        apiMessages[0] = {
          role: 'user',
          content: `${content}\n\n[The student is referencing this image from their canvas — please treat it as context for this conversation.]`,
        }
      }
    }

    await streamCompletion(
      systemPrompt,
      apiMessages,
      chunk => { streamRef.current += chunk; setStreamingText(streamRef.current) },
      () => {
        const assistantMsg: BranchMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: streamRef.current,
          createdAt: new Date().toISOString(),
        }
        const final = [...updated, assistantMsg]
        setMessages(final)
        saveBranchMessages(user.id, branchNodeId, final)
        setStreamingText('')
        setStreaming(false)
      },
      err => { setError(err); setStreaming(false); setStreamingText('') }
    )
  }, [messages, streaming, user, systemPrompt, branchNodeId, parentNode])

  const handleClose = async () => {
    if (!user || messages.length === 0) { onClose('', 0); return }
    setSummarising(true)
    const apiMsgs: Message[] = messages.map(m => ({ role: m.role, content: m.content }))
    const summary = await summariseBranch(apiMsgs)
    setSummarising(false)
    onClose(summary, messages.filter(m => m.role === 'user').length)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
        <GitBranch size={16} className="text-purple-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {branchData?.label || 'Branch conversation'}
          </p>
          {parentNode && (
            <p className="text-xs text-slate-500 truncate">
              From: {parentNode.type} node
              {parentNode.type === 'text' && (parentNode.data as any).content
                ? ` — "${String((parentNode.data as any).content).substring(0, 40)}…"`
                : ''}
            </p>
          )}
        </div>
        <button
          onClick={handleClose}
          disabled={summarising}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all disabled:opacity-50"
        >
          {summarising ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
          {summarising ? 'Saving…' : 'Save & Close'}
        </button>
        <button onClick={() => onClose('', messages.filter(m => m.role === 'user').length)} className="text-slate-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Context pill */}
      {parentNode && (
        <div className="px-4 py-2 shrink-0">
          <div className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/8">
            <span className="text-xs text-slate-500 shrink-0 mt-0.5">Context:</span>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              {parentNode.type === 'text' && String((parentNode.data as any).content || '').substring(0, 120)}
              {parentNode.type === 'image' && `Image: ${(parentNode.data as any).caption || (parentNode.data as any).alt || 'diagram'}`}
              {parentNode.type === 'branch' && `Branch: ${(parentNode.data as any).summary || (parentNode.data as any).label || ''}`}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-8">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
              <GitBranch size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Ask Compass about this</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                This conversation is anchored to the node you branched from. Ask anything about it.
              </p>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <BranchBubble key={msg.id} msg={msg} />
        ))}

        {streaming && streamingText && (
          <BranchBubble msg={{ id: '__stream', role: 'assistant', content: streamingText, createdAt: '' }} streaming />
        )}

        {error && (
          <p className="text-xs text-red-400 text-center">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Branch-from-branch button */}
      {messages.length >= 4 && (
        <div className="px-4 pb-2 shrink-0">
          <button
            onClick={() => onBranchFromBranch(branchNodeId)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-400/40 transition-all"
          >
            <GitBranch size={12} /> Branch this thread further
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-white/8 shrink-0">
        <div className="flex items-end gap-2 glass rounded-2xl px-3 py-2.5">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask Compass about this node…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 resize-none focus:outline-none min-h-[22px] max-h-[140px] leading-relaxed"
            rows={1}
            disabled={streaming}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="p-1.5 rounded-xl gradient-primary text-white disabled:opacity-40 transition-all shrink-0"
          >
            {streaming ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}

function BranchBubble({ msg, streaming }: { msg: BranchMessage; streaming?: boolean }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed max-w-[88%] ${isUser ? 'gradient-primary text-white rounded-tr-sm' : 'glass text-slate-100 rounded-tl-sm'}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-invert prose-xs max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            {streaming && <span className="inline-block w-1.5 h-3 bg-purple-400 animate-pulse rounded-sm ml-0.5 align-text-bottom" />}
          </div>
        )}
      </div>
    </div>
  )
}
