import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface VocabState extends Record<string, unknown> {
  language: string
  words: Array<{ id: string; word: string; translation: string; example: string; mastered: boolean }>
  quizMode: boolean
  quizIndex: number
  quizRevealed: boolean
}

export const defaultState: VocabState = {
  language: 'French',
  words: [
    { id: 'w1', word: 'bonjour', translation: 'hello / good morning', example: 'Bonjour, comment ça va?', mastered: false },
    { id: 'w2', word: 'merci', translation: 'thank you', example: 'Merci beaucoup!', mastered: false },
    { id: 'w3', word: 'maison', translation: 'house / home', example: 'Je rentre à la maison.', mastered: false },
  ],
  quizMode: false,
  quizIndex: 0,
  quizRevealed: false,
}

let nextId = 10

export default function VocabBuilder({ state, onChange, onCheck }: WidgetProps<VocabState>) {
  const [newWord, setNewWord] = useState('')
  const [newTrans, setNewTrans] = useState('')
  const [newEx, setNewEx] = useState('')

  const addWord = () => {
    if (!newWord.trim()) return
    const word = { id: `w${nextId++}`, word: newWord.trim(), translation: newTrans.trim(), example: newEx.trim(), mastered: false }
    onChange({ ...state, words: [...state.words, word] })
    setNewWord(''); setNewTrans(''); setNewEx('')
  }

  const toggleMastered = (id: string) => {
    onChange({ ...state, words: state.words.map(w => w.id === id ? { ...w, mastered: !w.mastered } : w) })
  }
  const removeWord = (id: string) => onChange({ ...state, words: state.words.filter(w => w.id !== id) })

  const startQuiz = () => {
    const unmastered = state.words.filter(w => !w.mastered)
    if (unmastered.length === 0) return
    onChange({ ...state, quizMode: true, quizIndex: 0, quizRevealed: false })
  }
  const quizWords = state.words.filter(w => !w.mastered)
  const currentQuiz = quizWords[state.quizIndex % Math.max(quizWords.length, 1)]

  const mastered = state.words.filter(w => w.mastered).length

  if (state.quizMode && currentQuiz) {
    return (
      <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Flashcard Quiz · {state.quizIndex + 1}/{quizWords.length}</span>
          <button onClick={() => onChange({ ...state, quizMode: false })} className="text-xs text-slate-500 hover:text-white">✕ Exit</button>
        </div>
        <div className="glass rounded-2xl p-6 text-center border border-indigo-500/20 min-h-[100px] flex flex-col items-center justify-center gap-3">
          <p className="text-2xl font-bold text-white">{currentQuiz.word}</p>
          {state.quizRevealed && (
            <>
              <p className="text-sm text-indigo-300">{currentQuiz.translation}</p>
              {currentQuiz.example && <p className="text-xs text-slate-400 italic">{currentQuiz.example}</p>}
            </>
          )}
        </div>
        {!state.quizRevealed ? (
          <button onClick={() => onChange({ ...state, quizRevealed: true })} className="w-full py-2 gradient-primary rounded-xl text-sm font-medium text-white">
            Reveal
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => onChange({ ...state, quizIndex: (state.quizIndex + 1) % Math.max(quizWords.length, 1), quizRevealed: false })}
              className="flex-1 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-400 hover:bg-red-500/30 transition-all">
              Need more practice
            </button>
            <button onClick={() => { toggleMastered(currentQuiz.id); onChange({ ...state, quizIndex: (state.quizIndex) % Math.max(quizWords.length - 1, 1), quizRevealed: false }) }}
              className="flex-1 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-xs text-green-400 hover:bg-green-500/30 transition-all">
              Got it ✓
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <input value={state.language} onChange={e => onChange({ ...state, language: e.target.value })}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-semibold text-white focus:outline-none" placeholder="Language" />
        <div className="text-xs text-slate-500">{mastered}/{state.words.length} mastered</div>
        {state.words.length > 0 && (
          <button onClick={startQuiz} className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-[10px] text-indigo-300 hover:bg-indigo-500/30 transition-all">
            Quiz
          </button>
        )}
      </div>

      {/* Word list */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {state.words.map(w => (
          <div key={w.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${w.mastered ? 'border-green-500/20 bg-green-500/5' : 'border-white/8 bg-white/3'}`}>
            <button onClick={() => toggleMastered(w.id)} className={`w-4 h-4 rounded-md border shrink-0 text-[8px] flex items-center justify-center transition-all ${w.mastered ? 'border-green-500 bg-green-500/30 text-green-400' : 'border-white/20 text-transparent'}`}>✓</button>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-white">{w.word}</span>
              <span className="text-slate-400 ml-1.5">{w.translation}</span>
              {w.example && <p className="text-slate-500 text-[10px] truncate italic">{w.example}</p>}
            </div>
            <button onClick={() => removeWord(w.id)} className="text-slate-600 hover:text-red-400 shrink-0">×</button>
          </div>
        ))}
      </div>

      {/* Add word */}
      <div className="space-y-1.5 border-t border-white/8 pt-3">
        <div className="flex gap-1.5">
          <input value={newWord} onChange={e => setNewWord(e.target.value)} placeholder="Word / phrase" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
          <input value={newTrans} onChange={e => setNewTrans(e.target.value)} placeholder="Translation" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
        </div>
        <div className="flex gap-1.5">
          <input value={newEx} onChange={e => setNewEx(e.target.value)} placeholder="Example sentence (optional)" onKeyDown={e => { if (e.key === 'Enter') addWord() }} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
          <button onClick={addWord} className="px-3 py-1 bg-indigo-500/30 rounded-lg text-indigo-300 hover:bg-indigo-500/50 transition-all text-xs">Add</button>
        </div>
      </div>

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
