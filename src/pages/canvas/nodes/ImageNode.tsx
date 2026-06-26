import { useRef } from 'react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { GitBranch, Trash2, Upload, Loader, ImageIcon } from 'lucide-react'
import { useCanvasCallbacks } from '../CanvasContext'
import { resizeImage } from '../storage'
import type { ImageNodeData } from '../types'

interface Props {
  id: string
  data: ImageNodeData
  selected: boolean
}

export function ImageNode({ id, data, selected }: Props) {
  const { onBranch, onDelete, onUpdateText, onUpdateCaption } = useCanvasCallbacks()
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    onUpdateText(id, '__uploading__')
    try {
      const src = await resizeImage(file, 1200)
      onUpdateText(id, src)
    } catch {
      onUpdateText(id, '')
    }
  }

  const isEmpty = !data.src || data.src === ''
  const isUploading = data.src === '__uploading__' || data.uploading

  return (
    <>
      <NodeResizer
        minWidth={200}
        minHeight={140}
        isVisible={selected}
        lineClassName="border-cyan-500"
        handleClassName="w-3 h-3 bg-cyan-500 rounded-sm border border-cyan-300"
      />

      <Handle type="target" position={Position.Top} className="!bg-cyan-500 !border-cyan-300 !w-3 !h-3" />

      <div
        className="relative rounded-2xl shadow-xl flex flex-col"
        style={{
          background: 'rgba(8, 145, 178, 0.1)',
          border: `1.5px solid ${selected ? '#06b6d4' : '#0891b244'}`,
          minWidth: 200,
          minHeight: 140,
        }}
      >
        {/* Header bar — always shown, actions visible when selected */}
        <div
          className="flex items-center justify-between px-2.5 py-1.5 shrink-0"
          style={{ borderBottom: '1px solid rgba(6,182,212,0.15)' }}
        >
          <div className="flex items-center gap-1 text-cyan-500/60">
            <ImageIcon size={11} />
            <span className="text-[10px] text-slate-500">Image</span>
          </div>
          {selected && !isUploading && (
            <div className="nodrag flex items-center gap-0.5">
              {!isEmpty && (
                <button
                  onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all"
                  title="Replace image"
                >
                  <Upload size={10} /> Replace
                </button>
              )}
              <button
                onClick={e => { e.stopPropagation(); onBranch(id) }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] text-cyan-300 hover:text-white hover:bg-cyan-500/30 transition-all"
                title="Branch"
              >
                <GitBranch size={10} /> Branch
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(id) }}
                className="p-0.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Delete node"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Image content */}
        {isUploading ? (
          <div className="flex flex-col items-center justify-center flex-1 min-h-[100px] gap-2 text-cyan-400">
            <Loader size={24} className="animate-spin" />
            <span className="text-xs">Uploading…</span>
          </div>
        ) : isEmpty ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center flex-1 min-h-[100px] gap-3 text-slate-400 hover:text-cyan-400 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
              <ImageIcon size={20} className="text-cyan-500" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-medium">Add image</p>
              <p className="text-xs text-slate-500 mt-0.5">Click or paste an image</p>
            </div>
            <Upload size={14} className="text-slate-500" />
          </button>
        ) : (
          <div className="flex flex-col">
            {/* Image — no onClick so it never opens file picker */}
            <img
              src={data.src}
              alt={data.alt || 'Canvas image'}
              className="w-full h-auto block object-contain max-h-[400px] rounded-b-2xl"
              draggable={false}
            />
            {/* Caption */}
            <div
              className="px-3 py-2"
              style={{ borderTop: '1px solid rgba(6,182,212,0.15)' }}
            >
              <input
                value={data.caption || ''}
                onChange={e => onUpdateCaption(id, e.target.value)}
                placeholder="Add a caption…"
                className="w-full bg-transparent text-xs text-slate-400 placeholder:text-slate-600 focus:outline-none"
                onMouseDown={e => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 !border-cyan-300 !w-3 !h-3" />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
    </>
  )
}
