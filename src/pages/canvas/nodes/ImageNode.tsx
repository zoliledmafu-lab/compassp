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
    // Mark uploading
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
        className="relative rounded-2xl shadow-xl overflow-hidden"
        style={{
          background: 'rgba(8, 145, 178, 0.1)',
          border: `1.5px solid ${selected ? '#06b6d4' : '#0891b244'}`,
          minWidth: 200,
          minHeight: 140,
        }}
      >
        {/* Image content */}
        {isUploading ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[120px] gap-2 text-cyan-400">
            <Loader size={24} className="animate-spin" />
            <span className="text-xs">Uploading…</span>
          </div>
        ) : isEmpty ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center w-full h-full min-h-[120px] gap-3 text-slate-400 hover:text-cyan-400 transition-colors group"
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
          <div className="relative">
            <img
              src={data.src}
              alt={data.alt || 'Canvas image'}
              className="w-full h-auto block rounded-t-2xl object-contain max-h-[400px]"
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

        {/* Replace image button */}
        {!isEmpty && !isUploading && (
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white/60 hover:text-white hover:bg-black/70 transition-all"
            title="Replace image"
          >
            <Upload size={12} />
          </button>
        )}

        {/* Action bar */}
        {selected && !isUploading && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1a1a2e] border border-white/10 rounded-xl px-2 py-1.5 shadow-xl z-10">
            <button
              onMouseDown={e => { e.stopPropagation(); onBranch(id) }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-cyan-300 hover:text-white hover:bg-cyan-500/30 transition-all"
            >
              <GitBranch size={12} /> Branch
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button
              onMouseDown={e => { e.stopPropagation(); onDelete(id) }}
              className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
            >
              <Trash2 size={12} />
            </button>
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
