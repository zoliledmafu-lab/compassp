import React, { useCallback, useMemo } from 'react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { Trash2, GitBranch } from 'lucide-react'
import { useCanvasCallbacks } from '../CanvasContext'
import { useAuth } from '../../../contexts/AuthContext'
import { useMemory } from '../../../contexts/MemoryContext'
import { getPlugin } from '../../../widgets/registry'
import { useWidgetGuidance } from '../../../widgets/useWidgetGuidance'
import { SUBJECTS } from '../../../lib/subjects'
import type { WidgetRFNodeData } from '../types'
import type { WidgetNodeData, StateSnapshot } from '../../../widgets/types'

interface Props {
  id: string
  data: WidgetRFNodeData
  selected: boolean
}

export function WidgetNode({ id, data, selected }: Props) {
  const { subjectId, onBranch, onDelete, onUpdateWidgetState } = useCanvasCallbacks()
  const { user } = useAuth()
  const { getMemory } = useMemory()

  const plugin = getPlugin(data.widgetId)
  const subject = useMemo(
    () => SUBJECTS.find(s => s.id === subjectId) || SUBJECTS[0],
    [subjectId],
  )
  const memory = useMemo(
    () => (user ? getMemory(user.id, subjectId) : null),
    [user, getMemory, subjectId],
  )

  const nodeData: WidgetNodeData = {
    widgetId: data.widgetId,
    widgetState: data.widgetState,
    stateHistory: (data.stateHistory ?? []) as StateSnapshot[],
    lastCheckTime: data.lastCheckTime ?? 0,
    checkFeedback: data.checkFeedback ?? '',
    hintCount: data.hintCount ?? 0,
    lastStruggleNudgeTime: data.lastStruggleNudgeTime ?? 0,
  }

  const onPatchNodeData = useCallback((patch: Partial<WidgetNodeData>) => {
    onUpdateWidgetState(id, patch as Record<string, unknown>)
  }, [id, onUpdateWidgetState])

  const { check, recordStateChange } = useWidgetGuidance({
    nodeId: id,
    plugin: plugin!,
    nodeData,
    subject,
    memory,
    onPatchNodeData,
  })

  const handleChange = useCallback((newState: Record<string, unknown>) => {
    recordStateChange(newState, 'drag')
  }, [recordStateChange])

  if (!plugin) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-900/20 px-4 py-3 text-xs text-red-400">
        Unknown widget: {data.widgetId}
      </div>
    )
  }

  const PluginComponent = plugin.Component as React.ComponentType<any>

  return (
    <>
      <NodeResizer
        minWidth={400}
        minHeight={320}
        isVisible={selected}
        lineClassName="border-purple-500"
        handleClassName="w-3 h-3 bg-purple-500 rounded-sm border border-purple-300"
      />

      <Handle type="target" position={Position.Top}
        className="!bg-purple-500 !border-purple-300 !w-3 !h-3" />

      <div
        className="rounded-2xl shadow-xl overflow-hidden nodrag nopan"
        style={{
          background: '#1a1040',
          border: selected ? '1.5px solid #a855f780' : '1.5px solid #7c3aed40',
          minWidth: 400,
          boxShadow: selected ? '0 0 0 2px #a855f740' : undefined,
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing"
          style={{ borderBottom: '1px solid #7c3aed30', background: '#12082a' }}
          // Allow drag from header only — the body has nodrag
          onMouseDown={e => e.currentTarget.closest('.react-flow__node')
            ?.dispatchEvent(new MouseEvent('mousedown', e.nativeEvent))}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{plugin.icon}</span>
            <span className="text-xs font-semibold text-purple-200">{plugin.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onMouseDown={e => { e.stopPropagation(); onBranch(id) }}
              className="p-1 rounded-lg text-slate-500 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
              title="Branch from widget"
            >
              <GitBranch size={12} />
            </button>
            <button
              onMouseDown={e => { e.stopPropagation(); onDelete(id) }}
              className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Delete widget"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Widget content — nodrag/nopan so pointer events work inside */}
        <div className="p-3 nodrag nopan">
          <PluginComponent
            state={data.widgetState}
            onChange={handleChange}
            onCheck={check}
          />
        </div>

        {/* Feedback area */}
        {data.checkFeedback && (
          <div className="mx-3 mb-3 rounded-xl border border-purple-500/20 bg-purple-900/20 px-3 py-2 text-xs text-purple-200 leading-relaxed">
            <span className="text-purple-400 font-medium text-xs mr-1">Compass:</span>
            {data.checkFeedback}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom}
        className="!bg-purple-500 !border-purple-300 !w-3 !h-3" />
    </>
  )
}
