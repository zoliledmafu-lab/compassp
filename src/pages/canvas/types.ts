import type { Node, Edge } from '@xyflow/react'

// ─── Node data shapes ────────────────────────────────────────────

export interface TextNodeData extends Record<string, unknown> {
  content: string
}

export interface ImageNodeData extends Record<string, unknown> {
  src: string        // base64 data URL (prototype) or Supabase storage path (prod)
  alt: string
  caption?: string
  uploading?: boolean
}

export interface BranchNodeData extends Record<string, unknown> {
  label: string
  parentNodeId: string
  summary: string          // distilled when branch is closed
  messageCount: number
}

export interface WidgetRFNodeData extends Record<string, unknown> {
  widgetId: string
  widgetState: Record<string, unknown>
  stateHistory: Array<{ state: Record<string, unknown>; timestamp: number; trigger: string }>
  lastCheckTime: number
  checkFeedback: string
  hintCount: number
  lastStruggleNudgeTime: number
}

// React Flow typed nodes
export type TextRFNode   = Node<TextNodeData,    'text'>
export type ImageRFNode  = Node<ImageNodeData,   'image'>
export type BranchRFNode = Node<BranchNodeData,  'branch'>
export type WidgetRFNode = Node<WidgetRFNodeData, 'widget'>
export type CanvasRFNode = TextRFNode | ImageRFNode | BranchRFNode | WidgetRFNode

// ─── Branch messages ─────────────────────────────────────────────

export interface BranchMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

// ─── Stored canvas ───────────────────────────────────────────────

export interface StoredCanvas {
  nodes: CanvasRFNode[]
  edges: Edge[]
  viewport: { x: number; y: number; zoom: number }
  // branch messages stored separately, keyed by branch node id
  branchMessages: Record<string, BranchMessage[]>
}
