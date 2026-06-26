import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow, ReactFlowProvider, useNodesState, useEdgesState,
  addEdge, Controls, Background, BackgroundVariant, useReactFlow,
  type Edge, type Connection, type NodeTypes, type Viewport,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { v4 as uuid } from 'uuid'
import {
  Plus, Image, Sparkles, Clock, List,
  ChevronRight, BarChart2, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { CanvasContext } from './CanvasContext'
import { TextNode } from './nodes/TextNode'
import { ImageNode } from './nodes/ImageNode'
import { BranchNode } from './nodes/BranchNode'
import { WidgetNode } from './nodes/WidgetNode'
import { BranchPanel } from './panels/BranchPanel'
import { QuizPanel } from './panels/QuizPanel'
import { ExamPanel } from './panels/ExamPanel'
import { ListView } from './panels/ListView'
import { loadCanvas, saveCanvas, resizeImage } from './storage'
import type { CanvasRFNode, TextNodeData, ImageNodeData, BranchNodeData, WidgetRFNodeData } from './types'
import { SUBJECTS } from '../../lib/subjects'
import { getAllPlugins, getPluginsForSubject } from '../../widgets/registry'
import { getPinnedSubjects } from '../../lib/pinnedSubjects'
import { DEFAULT_WIDGET_NODE_DATA } from '../../widgets/types'

// Register custom node types OUTSIDE component to avoid re-mount
const NODE_TYPES: NodeTypes = {
  text: TextNode as any,
  image: ImageNode as any,
  branch: BranchNode as any,
  widget: WidgetNode as any,
}

type PanelMode = 'none' | 'branch' | 'quiz' | 'exam' | 'list'

// ─── Inner canvas (needs ReactFlow hooks) ─────────────────────────

function CanvasInner({ subjectId, onSubjectChange }: { subjectId: string; onSubjectChange: (id: string) => void }) {
  const { user } = useAuth()
  const { fitView, setCenter, screenToFlowPosition, zoomIn, zoomOut } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasRFNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 })
  const [branchMessages, setBranchMessages] = useState<Record<string, any[]>>({})

  const [panelMode, setPanelMode] = useState<PanelMode>('none')
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null)
  const [widgetMenuOpen, setWidgetMenuOpen] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load from storage ────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    loadCanvas(user.id).then(stored => {
      setNodes(stored.nodes as CanvasRFNode[])
      setEdges(stored.edges)
      setViewport(stored.viewport)
      setBranchMessages(stored.branchMessages)
      if (stored.nodes.length > 0) {
        setTimeout(() => fitView({ padding: 0.12, duration: 400 }), 80)
      }
    })
  }, [user?.id]) // eslint-disable-line

  // ── Debounced auto-save ──────────────────────────────────────
  const persist = useCallback((
    n: CanvasRFNode[], e: Edge[], vp: Viewport, bm: Record<string, any[]>
  ) => {
    if (!user) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveCanvas(user.id, n, e, vp, bm), 600)
  }, [user?.id]) // eslint-disable-line

  useEffect(() => {
    persist(nodes, edges, viewport, branchMessages)
  }, [nodes, edges, viewport, branchMessages]) // eslint-disable-line

  // ── Node creation helpers ────────────────────────────────────

  const centrePosition = useCallback(() => {
    const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    return { x: pos.x - 110 + Math.random() * 60 - 30, y: pos.y - 60 + Math.random() * 60 - 30 }
  }, [screenToFlowPosition])

  const addTextNode = useCallback(() => {
    const id = uuid()
    const pos = centrePosition()
    const newNode: CanvasRFNode = {
      id,
      type: 'text',
      position: pos,
      data: { content: '' } as TextNodeData,
    }
    setNodes(ns => [...ns, newNode])
  }, [centrePosition, setNodes])

  const addImageNode = useCallback(async (src?: string) => {
    const id = uuid()
    const pos = centrePosition()
    const newNode: CanvasRFNode = {
      id,
      type: 'image',
      position: pos,
      data: { src: src || '', alt: 'Canvas image', caption: '' } as ImageNodeData,
    }
    setNodes(ns => [...ns, newNode])
    return id
  }, [centrePosition, setNodes])

  // ── Canvas callbacks ─────────────────────────────────────────

  const onBranch = useCallback((sourceNodeId: string) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId)
    if (!sourceNode) return

    const branchId = uuid()
    const offset = { x: sourceNode.position.x + 260, y: sourceNode.position.y + 40 }
    const label = sourceNode.type === 'text'
      ? String((sourceNode.data as TextNodeData).content).substring(0, 40) + '…'
      : sourceNode.type === 'image'
      ? `Image: ${(sourceNode.data as ImageNodeData).caption || 'diagram'}`
      : `Sub-branch of ${(sourceNode.data as BranchNodeData).label}`

    const branchNode: CanvasRFNode = {
      id: branchId,
      type: 'branch',
      position: offset,
      data: {
        label,
        parentNodeId: sourceNodeId,
        summary: '',
        messageCount: 0,
      } as BranchNodeData,
    }

    const edge: Edge = {
      id: `e-${sourceNodeId}-${branchId}`,
      source: sourceNodeId,
      target: branchId,
      animated: true,
      style: { stroke: '#7c3aed', strokeWidth: 2, strokeDasharray: '6 3' },
    }

    setNodes(ns => [...ns, branchNode])
    setEdges(es => [...es, edge])
    setActiveBranchId(branchId)
    setPanelMode('branch')
  }, [nodes, setNodes, setEdges])

  const onDelete = useCallback((nodeId: string) => {
    setNodes(ns => ns.filter(n => n.id !== nodeId))
    setEdges(es => es.filter(e => e.source !== nodeId && e.target !== nodeId))
    if (activeBranchId === nodeId) { setPanelMode('none'); setActiveBranchId(null) }
  }, [setNodes, setEdges, activeBranchId])

  const onUpdateText = useCallback((nodeId: string, content: string) => {
    setNodes(ns => ns.map(n => {
      if (n.id !== nodeId) return n
      if (n.type === 'image') return { ...n, data: { ...n.data, src: content } } as CanvasRFNode
      return { ...n, data: { ...n.data, content } } as CanvasRFNode
    }))
  }, [setNodes])

  const onUpdateCaption = useCallback((nodeId: string, caption: string) => {
    setNodes(ns => ns.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, caption } } as CanvasRFNode : n
    ))
  }, [setNodes])

  const onOpenBranch = useCallback((branchNodeId: string) => {
    setActiveBranchId(branchNodeId)
    setPanelMode('branch')
  }, [])

  const onUpdateWidgetState = useCallback((nodeId: string, patch: Record<string, unknown>) => {
    setNodes(ns => ns.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } as CanvasRFNode : n
    ))
  }, [setNodes])

  const addWidgetNode = useCallback((widgetId: string) => {
    const plugin = getAllPlugins().find(p => p.id === widgetId)
    if (!plugin) return
    const id = uuid()
    const pos = centrePosition()
    const newNode: CanvasRFNode = {
      id,
      type: 'widget',
      position: pos,
      data: {
        widgetId,
        widgetState: plugin.defaultState,
        ...DEFAULT_WIDGET_NODE_DATA,
      } as WidgetRFNodeData,
    }
    setNodes(ns => [...ns, newNode])
  }, [centrePosition, setNodes])

  const onBranchClose = useCallback((summary: string, messageCount: number) => {
    if (activeBranchId) {
      setNodes(ns => ns.map(n =>
        n.id === activeBranchId
          ? { ...n, data: { ...n.data, summary, messageCount } } as CanvasRFNode
          : n
      ))
    }
    setPanelMode('none')
    setActiveBranchId(null)
  }, [activeBranchId, setNodes])

  // ── Edge connection ──────────────────────────────────────────

  const onConnect = useCallback((params: Connection) => {
    setEdges(es => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '6 3' },
    }, es))
  }, [setEdges])

  // ── Focus node (from list view) ──────────────────────────────

  const focusNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    setCenter(node.position.x + 100, node.position.y + 60, { zoom: 1.2, duration: 600 })
  }, [nodes, setCenter])

  // ── Drag from desktop / clipboard paste ─────────────────────

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'))
    if (!file) return
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const id = uuid()
    const placeholder: CanvasRFNode = {
      id, type: 'image', position: { x: pos.x - 100, y: pos.y - 70 },
      data: { src: '__uploading__', alt: file.name, caption: '' } as ImageNodeData,
    }
    setNodes(ns => [...ns, placeholder])
    const src = await resizeImage(file)
    setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, src } } as CanvasRFNode : n))
  }, [screenToFlowPosition, setNodes])

  // ── Clipboard paste ──────────────────────────────────────────

  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || [])
      const imageItem = items.find(i => i.type.startsWith('image/'))
      if (!imageItem) return
      const file = imageItem.getAsFile()
      if (!file) return
      e.preventDefault()
      const pos = centrePosition()
      const id = uuid()
      const placeholder: CanvasRFNode = {
        id, type: 'image', position: pos,
        data: { src: '__uploading__', alt: 'Pasted image', caption: '' } as ImageNodeData,
      }
      setNodes(ns => [...ns, placeholder])
      const src = await resizeImage(file)
      setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, src } } as CanvasRFNode : n))
    }
    window.addEventListener('paste', handler)
    return () => window.removeEventListener('paste', handler)
  }, [centrePosition, setNodes])

  // ── Panel toggle helpers ─────────────────────────────────────

  const openPanel = (mode: PanelMode) => {
    if (panelMode === mode) { setPanelMode('none'); return }
    if (mode !== 'branch') setActiveBranchId(null)
    setPanelMode(mode)
  }

  const panelOpen = panelMode !== 'none'

  return (
    <CanvasContext.Provider value={{ subjectId, onBranch, onDelete, onUpdateText, onUpdateCaption, onOpenBranch, onUpdateWidgetState }}>
      <div className="flex h-screen overflow-hidden">

        {/* ── Canvas area ───────────────────────────────── */}
        <div className="flex-1 relative">
          {/* Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 glass-dark rounded-2xl px-3 py-2 shadow-xl">
            <ToolBtn icon={<Plus size={16} />} label="Text" onClick={addTextNode} color="indigo" />
            <ToolBtn icon={<Image size={16} />} label="Image" onClick={() => addImageNode()} color="cyan" />
            {/* Widget picker */}
            <div className="relative">
              <ToolBtn
                icon={<BarChart2 size={16} />}
                label="Widget"
                onClick={() => setWidgetMenuOpen(o => !o)}
                active={widgetMenuOpen}
                color="purple"
              />
              {widgetMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 glass-dark rounded-2xl shadow-2xl border border-white/10 z-50 py-2">
                  {(() => {
                    const subjectPlugins = getPluginsForSubject(subjectId)
                    if (subjectPlugins.length === 0) return (
                      <p className="px-3 py-2 text-xs text-slate-500">No widgets for this subject yet.</p>
                    )
                    return subjectPlugins.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { addWidgetNode(p.id); setWidgetMenuOpen(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left"
                      >
                        <span className="text-base">{p.icon}</span>
                        <div>
                          <div className="font-medium text-xs">{p.name}</div>
                          <div className="text-slate-500 text-xs leading-tight">{p.description.substring(0, 52)}…</div>
                        </div>
                      </button>
                    ))
                  })()}
                </div>
              )}
            </div>
            <div className="w-px h-6 bg-white/10" />
            <SubjectSelector subjectId={subjectId} onChange={onSubjectChange} />
            <div className="w-px h-6 bg-white/10" />
            <ToolBtn icon={<Sparkles size={16} />} label="Quiz Me" onClick={() => openPanel('quiz')} active={panelMode === 'quiz'} color="amber" />
            <ToolBtn icon={<Clock size={16} />} label="Exam" onClick={() => openPanel('exam')} active={panelMode === 'exam'} color="cyan" />
            <div className="w-px h-6 bg-white/10" />
            <ToolBtn icon={<List size={16} />} label="List" onClick={() => openPanel('list')} active={panelMode === 'list'} color="slate" />
            <div className="w-px h-6 bg-white/10" />
            <button onClick={() => zoomOut({ duration: 200 })} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all" title="Zoom out"><ZoomOut size={15} /></button>
            <button onClick={() => zoomIn({ duration: 200 })} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all" title="Zoom in"><ZoomIn size={15} /></button>
            <button onClick={() => fitView({ padding: 0.12, duration: 400 })} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all" title="Fit view"><Maximize2 size={15} /></button>
          </div>

          {/* Node count badge */}
          <div className="absolute top-4 right-4 z-10 text-xs text-slate-500 glass rounded-xl px-2.5 py-1.5">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''}
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onMoveEnd={(_, vp) => setViewport(vp)}
            defaultViewport={viewport}
            minZoom={0.2}
            maxZoom={3}
            fitViewOptions={{ padding: 0.12 }}
            proOptions={{ hideAttribution: true }}
            className="!bg-transparent"
            deleteKeyCode="Delete"
            selectionKeyCode="Shift"
            multiSelectionKeyCode="Shift"
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="#ffffff08"
              gap={24}
              size={1.5}
            />
            <Controls
              showInteractive={false}
              className="!bg-[#1a1a2e] !border-white/10 !shadow-xl"
            />
          </ReactFlow>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none gap-6">
              <div className="text-center">
                <p className="text-6xl mb-4">🗺️</p>
                <h3 className="text-xl font-semibold text-white mb-2">Your canvas is empty</h3>
                <p className="text-slate-400 text-sm max-w-xs">
                  Add text notes or images, then branch off conversations with Compass to explore your study material spatially.
                </p>
              </div>
              <div className="flex gap-3 pointer-events-auto">
                <button
                  onClick={addTextNode}
                  className="flex items-center gap-2 px-4 py-2.5 gradient-primary rounded-xl text-sm font-medium text-white glow-sm"
                >
                  <Plus size={16} /> Add Text Note
                </button>
                <button
                  onClick={() => addImageNode()}
                  className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm text-slate-300 hover:text-white transition-all"
                >
                  <Image size={16} /> Add Image
                </button>
              </div>
              <p className="text-xs text-slate-600 pointer-events-none">
                You can also paste an image from clipboard or drag one from your desktop
              </p>
            </div>
          )}
        </div>

        {/* ── Right panel ──────────────────────────────── */}
        {panelOpen && (
          <div
            className="w-[380px] glass-dark border-l border-white/8 flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-right duration-200"
            style={{ animation: 'slideInRight 0.2s ease-out' }}
          >
            {panelMode === 'branch' && activeBranchId && (
              <BranchPanel
                branchNodeId={activeBranchId}
                allNodes={nodes}
                subjectId={subjectId}
                onClose={onBranchClose}
                onBranchFromBranch={onBranch}
              />
            )}
            {panelMode === 'quiz' && (
              <QuizPanel nodes={nodes} subjectId={subjectId} onClose={() => setPanelMode('none')} />
            )}
            {panelMode === 'exam' && (
              <ExamPanel nodes={nodes} subjectId={subjectId} onClose={() => setPanelMode('none')} />
            )}
            {panelMode === 'list' && (
              <ListView
                nodes={nodes}
                onClose={() => setPanelMode('none')}
                onFocus={id => { focusNode(id); setPanelMode('none') }}
                onOpenBranch={id => { setActiveBranchId(id); setPanelMode('branch') }}
              />
            )}
          </div>
        )}
      </div>
    </CanvasContext.Provider>
  )
}

// ─── Toolbar button ──────────────────────────────────────────────

interface ToolBtnProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  color?: string
}

function ToolBtn({ icon, label, onClick, active, color = 'indigo' }: ToolBtnProps) {
  const activeClasses: Record<string, string> = {
    indigo: 'bg-indigo-500/30 text-indigo-300 border-indigo-500/40',
    cyan: 'bg-cyan-500/30 text-cyan-300 border-cyan-500/40',
    amber: 'bg-amber-500/30 text-amber-300 border-amber-500/40',
    purple: 'bg-purple-500/30 text-purple-300 border-purple-500/40',
    slate: 'bg-white/10 text-white border-white/20',
  }
  const colorClasses: Record<string, string> = {
    indigo: 'hover:text-indigo-300 hover:bg-indigo-500/15',
    cyan: 'hover:text-cyan-300 hover:bg-cyan-500/15',
    amber: 'hover:text-amber-300 hover:bg-amber-500/15',
    purple: 'hover:text-purple-300 hover:bg-purple-500/15',
    slate: 'hover:text-white hover:bg-white/10',
  }
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
        active ? activeClasses[color] : `border-transparent text-slate-400 ${colorClasses[color]}`
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// ─── Subject selector (pinned subjects only) ─────────────────────

function SubjectSelector({ subjectId, onChange }: { subjectId: string; onChange: (id: string) => void }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const pinned = user ? getPinnedSubjects(user.id) : []
  const list = pinned.length > 0 ? pinned : SUBJECTS
  const subject = SUBJECTS.find(s => s.id === subjectId) || list[0] || SUBJECTS[0]
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl text-sm text-white hover:bg-white/10 transition-all"
      >
        <span>{subject.icon}</span>
        <span className="hidden sm:inline">{subject.name}</span>
        <ChevronRight size={12} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-52 glass-dark rounded-2xl shadow-2xl border border-white/10 z-50 py-2 max-h-72 overflow-y-auto">
          {pinned.length === 0 && (
            <p className="px-3 py-1 text-xs text-slate-500">Pin subjects on the Dashboard to filter this list.</p>
          )}
          {list.map(s => (
            <button
              key={s.id}
              onClick={() => { onChange(s.id); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-all ${s.id === subjectId ? 'text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span>{s.icon}</span> {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page wrapper ────────────────────────────────────────────────

export function CanvasPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const subjectId = searchParams.get('subject') || SUBJECTS[0].id

  return (
    <ReactFlowProvider>
      <CanvasInner
        subjectId={subjectId}
        onSubjectChange={(id) => setSearchParams({ subject: id })}
      />
    </ReactFlowProvider>
  )
}
