import { useState } from 'react'
import { X, FileText, Image, GitBranch, BarChart2, ChevronRight, ChevronDown, Eye } from 'lucide-react'
import type { CanvasRFNode } from '../types'

interface Props {
  nodes: CanvasRFNode[]
  onClose: () => void
  onFocus: (nodeId: string) => void
  onOpenBranch: (nodeId: string) => void
}

interface TreeNode {
  node: CanvasRFNode
  children: TreeNode[]
  depth: number
}

function buildTree(nodes: CanvasRFNode[]): TreeNode[] {
  const roots: TreeNode[] = []
  const cache = new Map<string, TreeNode>()

  // Build tree nodes
  for (const n of nodes) {
    cache.set(n.id, { node: n, children: [], depth: 0 })
  }

  for (const n of nodes) {
    const treeNode = cache.get(n.id)!
    const parentId = (n.data as any).parentNodeId
    if (parentId && cache.has(parentId)) {
      const parent = cache.get(parentId)!
      treeNode.depth = parent.depth + 1
      parent.children.push(treeNode)
    } else if (n.type !== 'branch') {
      roots.push(treeNode)
    } else {
      // orphan branch — put at root
      roots.push(treeNode)
    }
  }

  return roots
}

function flattenTree(roots: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = []
  const walk = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      result.push(n)
      walk(n.children)
    }
  }
  walk(roots)
  return result
}

const TYPE_ICONS = {
  text:   <FileText  size={14} className="text-indigo-400 shrink-0" />,
  image:  <Image     size={14} className="text-cyan-400 shrink-0" />,
  branch: <GitBranch size={14} className="text-purple-400 shrink-0" />,
  widget: <BarChart2 size={14} className="text-purple-400 shrink-0" />,
}

const TYPE_LABELS: Record<string, string> = {
  text: 'Text note', image: 'Image', branch: 'Branch', widget: 'Widget',
}

export function ListView({ nodes, onClose, onFocus, onOpenBranch }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'text' | 'image' | 'branch'>('all')

  const tree = buildTree(nodes)
  const flat = flattenTree(tree)
  const visible = flat.filter(item => filter === 'all' || item.node.type === filter)

  const toggle = (id: string) =>
    setCollapsed(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const getPreview = (node: CanvasRFNode): string => {
    if (node.type === 'text') return String((node.data as any).content || '').substring(0, 80) || '(empty)'
    if (node.type === 'image') return (node.data as any).caption || (node.data as any).alt || 'Image node'
    const d = node.data as any
    return d.summary || d.label || 'Branch conversation'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Canvas Overview</p>
          <p className="text-xs text-slate-500">{nodes.length} node{nodes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-white/8 shrink-0">
        {(['all', 'text', 'image', 'branch'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === f ? 'gradient-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto py-2"
        role="tree"
        aria-label="Canvas nodes"
      >
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-500">
            <p className="text-sm">No {filter === 'all' ? '' : filter + ' '}nodes yet</p>
          </div>
        ) : (
          visible.map(({ node, depth, children }) => {
            const hasChildren = children.length > 0
            const isCollapsed = collapsed.has(node.id)
            const preview = getPreview(node)

            return (
              <div
                key={node.id}
                role="treeitem"
                aria-expanded={hasChildren ? !isCollapsed : undefined}
                aria-level={depth + 1}
                style={{ paddingLeft: depth * 20 + 16 }}
                className="group flex items-start gap-2 py-2 pr-4 hover:bg-white/3 transition-colors focus-within:bg-white/5 cursor-default"
              >
                {/* Expand toggle */}
                <button
                  onClick={() => toggle(node.id)}
                  className={`shrink-0 mt-0.5 text-slate-600 hover:text-slate-300 transition-colors w-4 ${!hasChildren ? 'invisible' : ''}`}
                  aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>

                {/* Node icon */}
                <span className="mt-0.5">{TYPE_ICONS[node.type]}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
                      {TYPE_LABELS[node.type]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 truncate leading-snug mt-0.5">{preview}</p>
                  {node.type === 'branch' && (node.data as any).messageCount > 0 && (
                    <p className="text-xs text-purple-400 mt-0.5">{(node.data as any).messageCount} message{(node.data as any).messageCount !== 1 ? 's' : ''}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                  <button
                    onClick={() => onFocus(node.id)}
                    className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                    title="Jump to on canvas"
                    aria-label="Jump to node on canvas"
                  >
                    <Eye size={12} />
                  </button>
                  {node.type === 'branch' && (
                    <button
                      onClick={() => onOpenBranch(node.id)}
                      className="p-1 rounded text-purple-500 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
                      title="Open branch conversation"
                      aria-label="Open branch conversation"
                    >
                      <GitBranch size={12} />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Summary */}
      <div className="px-4 py-3 border-t border-white/8 shrink-0">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { type: 'text', count: nodes.filter(n => n.type === 'text').length, color: 'text-indigo-400' },
            { type: 'image', count: nodes.filter(n => n.type === 'image').length, color: 'text-cyan-400' },
            { type: 'branch', count: nodes.filter(n => n.type === 'branch').length, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.type} className="glass rounded-xl py-2">
              <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
              <p className="text-[10px] text-slate-500 capitalize">{s.type}{s.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
