import { useState, useRef, useEffect } from 'react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { GitBranch, Trash2, GripVertical } from 'lucide-react'
import { useCanvasCallbacks } from '../CanvasContext'
import type { TextNodeData } from '../types'

interface Props {
  id: string
  data: TextNodeData
  selected: boolean
}

const COLORS = ['#4f46e5', '#7c3aed', '#0891b2', '#059669', '#b45309', '#dc2626']

export function TextNode({ id, data, selected }: Props) {
  const { onBranch, onDelete, onUpdateText } = useCanvasCallbacks()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.content)
  const [color, setColor] = useState(COLORS[0])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) textareaRef.current?.focus()
  }, [editing])

  const commitEdit = () => {
    setEditing(false)
    if (draft !== data.content) onUpdateText(id, draft)
  }

  return (
    <>
      <NodeResizer
        minWidth={180}
        minHeight={80}
        isVisible={selected}
        lineClassName="border-indigo-500"
        handleClassName="w-3 h-3 bg-indigo-500 rounded-sm border border-indigo-300"
      />

      {/* Target handle — connections come in here */}
      <Handle type="target" position={Position.Top} className="!bg-indigo-500 !border-indigo-300 !w-3 !h-3" />

      <div
        className="relative rounded-2xl shadow-xl transition-shadow"
        style={{
          background: `${color}1a`,
          border: `1.5px solid ${color}55`,
          minWidth: 180,
          minHeight: 80,
          boxShadow: selected ? `0 0 0 2px ${color}88` : undefined,
        }}
        onDoubleClick={() => setEditing(true)}
      >
        {/* Drag handle bar */}
        <div
          className="flex items-center justify-between px-3 py-1.5 cursor-grab active:cursor-grabbing"
          style={{ borderBottom: `1px solid ${color}33` }}
        >
          <GripVertical size={12} className="text-white/20" />
          {/* Color pips */}
          <div className="flex items-center gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                onMouseDown={e => { e.stopPropagation(); setColor(c) }}
                className="w-2.5 h-2.5 rounded-full border border-white/20 hover:scale-125 transition-transform"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-3 py-2.5 min-h-[60px]">
          {editing ? (
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Escape') commitEdit() }}
              className="w-full bg-transparent text-sm text-white/90 placeholder:text-white/25 resize-none focus:outline-none leading-relaxed"
              placeholder="Type your note…"
              rows={3}
              style={{ minHeight: 60 }}
            />
          ) : (
            <p
              className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap break-words cursor-text"
              style={{ minHeight: 40 }}
            >
              {data.content || <span className="text-white/25 italic">Double-click to add text…</span>}
            </p>
          )}
        </div>

        {/* Action bar */}
        {selected && !editing && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1a1a2e] border border-white/10 rounded-xl px-2 py-1.5 shadow-xl">
            <button
              onMouseDown={e => { e.stopPropagation(); onBranch(id) }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-indigo-300 hover:text-white hover:bg-indigo-500/30 transition-all"
              title="Branch conversation"
            >
              <GitBranch size={12} /> Branch
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button
              onMouseDown={e => { e.stopPropagation(); onDelete(id) }}
              className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Delete node"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Source handle — branch edges leave from here */}
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !border-indigo-300 !w-3 !h-3" />
    </>
  )
}
