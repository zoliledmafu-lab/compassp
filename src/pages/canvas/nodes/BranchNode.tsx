import { Handle, Position, NodeResizer } from '@xyflow/react'
import { MessageSquare, GitBranch, Trash2, ChevronRight } from 'lucide-react'
import { useCanvasCallbacks } from '../CanvasContext'
import type { BranchNodeData } from '../types'

interface Props {
  id: string
  data: BranchNodeData
  selected: boolean
}

export function BranchNode({ id, data, selected }: Props) {
  const { onBranch, onDelete, onOpenBranch } = useCanvasCallbacks()

  const hasSummary = !!data.summary
  const msgCount = data.messageCount || 0

  return (
    <>
      <NodeResizer
        minWidth={220}
        minHeight={90}
        isVisible={selected}
        lineClassName="border-purple-500"
        handleClassName="w-3 h-3 bg-purple-500 rounded-sm border border-purple-300"
      />

      <Handle type="target" position={Position.Top} className="!bg-purple-500 !border-purple-300 !w-3 !h-3" />

      <div
        className="relative rounded-2xl shadow-xl"
        style={{
          background: 'rgba(124, 58, 237, 0.12)',
          border: `1.5px solid ${selected ? '#7c3aed' : '#7c3aed44'}`,
          minWidth: 220,
          minHeight: 90,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ borderBottom: '1px solid rgba(124,58,237,0.2)' }}
        >
          <div className="flex items-center gap-1.5">
            <MessageSquare size={12} className="text-purple-400" />
            <span className="text-xs font-semibold text-purple-300 truncate max-w-[140px]">
              {data.label || 'Branch conversation'}
            </span>
          </div>
          {msgCount > 0 && (
            <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full">
              {msgCount} msg{msgCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Summary or placeholder */}
        <div className="px-3 py-2.5 min-h-[52px] flex flex-col justify-between gap-2">
          {hasSummary ? (
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{data.summary}</p>
          ) : (
            <p className="text-xs text-slate-500 italic">
              {msgCount === 0 ? 'No messages yet — open to start' : 'Conversation in progress…'}
            </p>
          )}

          <button
            onMouseDown={e => { e.stopPropagation(); onOpenBranch(id) }}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-200 transition-colors self-start"
          >
            <ChevronRight size={12} />
            {msgCount === 0 ? 'Start conversation' : 'Continue'}
          </button>
        </div>

        {/* Action bar */}
        {selected && (
          <div className="nodrag absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1a1a2e] border border-white/10 rounded-xl px-2 py-1.5 shadow-xl z-10">
            <button
              onClick={e => { e.stopPropagation(); onOpenBranch(id) }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-purple-300 hover:text-white hover:bg-purple-500/30 transition-all"
            >
              <MessageSquare size={12} /> Open
            </button>
            <button
              onClick={e => { e.stopPropagation(); onBranch(id) }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-indigo-300 hover:text-white hover:bg-indigo-500/30 transition-all"
            >
              <GitBranch size={12} /> Branch
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={e => { e.stopPropagation(); onDelete(id) }}
              className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !border-purple-300 !w-3 !h-3" />
    </>
  )
}
