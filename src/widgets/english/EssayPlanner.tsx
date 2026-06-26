import { useState } from 'react'
import type { WidgetProps } from '../types'

export interface PeelParagraph {
  id: string
  point: string
  evidence: string
  explanation: string
  link: string
}

export interface EssayPlannerState extends Record<string, unknown> {
  topic: string
  paragraphs: PeelParagraph[]
}

export const defaultState: EssayPlannerState = {
  topic: '',
  paragraphs: [{ id: 'p1', point: '', evidence: '', explanation: '', link: '' }],
}

const PEEL_FIELDS: { key: keyof Omit<PeelParagraph, 'id'>; label: string; full: string; color: string }[] = [
  { key: 'point',       label: 'P', full: 'Point',       color: '#6366f1' },
  { key: 'evidence',    label: 'E', full: 'Evidence',    color: '#06b6d4' },
  { key: 'explanation', label: 'E', full: 'Explanation', color: '#a855f7' },
  { key: 'link',        label: 'L', full: 'Link',        color: '#f59e0b' },
]

export default function EssayPlanner({ state, onChange, onCheck }: WidgetProps<EssayPlannerState>) {
  const { topic, paragraphs } = state
  const [expanded, setExpanded] = useState<string>(paragraphs[0]?.id ?? 'p1')

  function updateParagraph(id: string, field: keyof Omit<PeelParagraph, 'id'>, value: string) {
    onChange({
      ...state,
      paragraphs: paragraphs.map(p => p.id === id ? { ...p, [field]: value } : p),
    })
  }

  function addParagraph() {
    if (paragraphs.length >= 5) return
    const id = 'p' + Date.now()
    const newPara: PeelParagraph = { id, point: '', evidence: '', explanation: '', link: '' }
    onChange({ ...state, paragraphs: [...paragraphs, newPara] })
    setExpanded(id)
  }

  function removeParagraph(id: string) {
    if (paragraphs.length <= 1) return
    const remaining = paragraphs.filter(p => p.id !== id)
    onChange({ ...state, paragraphs: remaining })
    if (expanded === id) setExpanded(remaining[0]?.id ?? '')
  }

  return (
    <div className="nodrag nopan flex flex-col gap-3 text-white text-xs" style={{ minWidth: 360 }}>
      <div className="flex items-center gap-2">
        <span className="text-slate-400 shrink-0">Topic</span>
        <input
          value={topic}
          onChange={e => onChange({ ...state, topic: e.target.value })}
          placeholder="Essay topic or question..."
          className="flex-1 bg-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none"
          maxLength={100}
        />
      </div>

      {/* PEEL legend */}
      <div className="flex gap-3 flex-wrap">
        {PEEL_FIELDS.map(f => (
          <div key={f.full} className="flex items-center gap-1">
            <span className="w-5 h-5 rounded text-center font-bold text-xs flex items-center justify-center"
              style={{ background: f.color + '30', color: f.color }}>{f.label}</span>
            <span className="text-slate-500" style={{ fontSize: 9 }}>{f.full}</span>
          </div>
        ))}
      </div>

      {/* Paragraphs */}
      <div className="space-y-2">
        {paragraphs.map((para, i) => (
          <div key={para.id} className="rounded-xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-all"
              onClick={() => setExpanded(expanded === para.id ? '' : para.id)}
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Para {i + 1}</span>
                {para.point && (
                  <span className="text-slate-500 truncate max-w-[200px]">{para.point.slice(0, 40)}{para.point.length > 40 ? '…' : ''}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">{expanded === para.id ? '▲' : '▼'}</span>
                {paragraphs.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); removeParagraph(para.id) }}
                    className="text-slate-600 hover:text-red-400 font-bold px-1">×</button>
                )}
              </div>
            </div>

            {/* Fields */}
            {expanded === para.id && (
              <div className="px-3 pb-3 space-y-2">
                {PEEL_FIELDS.map(({ key, label, full, color }) => (
                  <div key={key} className="flex gap-2 items-start">
                    <span className="w-5 h-5 rounded text-center font-bold flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: color + '30', color, fontSize: 10 }}>{label}</span>
                    <div className="flex-1">
                      <p className="text-slate-500 mb-0.5" style={{ fontSize: 9 }}>{full}</p>
                      <textarea
                        value={para[key]}
                        onChange={e => updateParagraph(para.id, key, e.target.value)}
                        placeholder={`${full}...`}
                        rows={2}
                        className="w-full bg-white/5 rounded px-2 py-1 text-white text-xs outline-none resize-none border border-white/10 focus:border-white/20 transition-colors"
                        style={{ borderColor: color + '20' }}
                        maxLength={300}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {paragraphs.length < 5 && (
        <button onClick={addParagraph}
          className="w-full py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all">
          + Add Paragraph
        </button>
      )}

      <button onClick={onCheck} className="w-full py-1.5 rounded-xl text-xs font-medium bg-indigo-600/70 hover:bg-indigo-600 text-white transition-all">
        Check with Compass
      </button>
    </div>
  )
}
