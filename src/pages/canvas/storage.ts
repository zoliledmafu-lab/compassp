import type { Edge } from '@xyflow/react'
import { supabase, SUPABASE_ENABLED } from '../../lib/supabase'
import type { StoredCanvas, CanvasRFNode, BranchMessage } from './types'

const LS_KEY = (userId: string) => `compass_canvas_v2_${userId}`

const EMPTY: StoredCanvas = {
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  branchMessages: {},
}

// ─── Load ─────────────────────────────────────────────────────────

export async function loadCanvas(userId: string): Promise<StoredCanvas> {
  if (SUPABASE_ENABLED && !userId.startsWith('user-')) {
    const { data } = await supabase
      .from('canvas_states')
      .select('nodes, edges, viewport, branch_messages')
      .eq('student_id', userId)
      .single()

    if (data) {
      return {
        nodes:          (data.nodes          as CanvasRFNode[]) ?? [],
        edges:          (data.edges          as Edge[])         ?? [],
        viewport:       (data.viewport       as StoredCanvas['viewport']) ?? { x: 0, y: 0, zoom: 1 },
        branchMessages: (data.branch_messages as StoredCanvas['branchMessages']) ?? {},
      }
    }
    // Fall through to localStorage if no row yet
  }

  try {
    const raw = localStorage.getItem(LS_KEY(userId))
    if (!raw) return EMPTY
    return { ...EMPTY, ...JSON.parse(raw) }
  } catch {
    return EMPTY
  }
}

// ─── Save ─────────────────────────────────────────────────────────

export async function saveCanvas(
  userId: string,
  nodes: CanvasRFNode[],
  edges: Edge[],
  viewport: { x: number; y: number; zoom: number },
  branchMessages: Record<string, BranchMessage[]>,
): Promise<void> {
  const stored: StoredCanvas = { nodes, edges, viewport, branchMessages }

  if (SUPABASE_ENABLED && !userId.startsWith('user-')) {
    const { error } = await supabase.from('canvas_states').upsert({
      student_id:      userId,
      nodes,
      edges,
      viewport,
      branch_messages: branchMessages,
    }, { onConflict: 'student_id' })

    if (!error) return
    // On error fall back to localStorage
  }

  try {
    localStorage.setItem(LS_KEY(userId), JSON.stringify(stored))
  } catch {
    // Quota exceeded — trim branch messages and retry
    const trimmed: StoredCanvas = {
      ...stored,
      branchMessages: Object.fromEntries(
        Object.entries(branchMessages).map(([k, msgs]) => [k, msgs.slice(-20)])
      ),
    }
    localStorage.setItem(LS_KEY(userId), JSON.stringify(trimmed))
  }
}

// ─── Branch message helpers ────────────────────────────────────────

export async function saveBranchMessages(
  userId: string,
  branchNodeId: string,
  messages: BranchMessage[],
): Promise<void> {
  const canvas = await loadCanvas(userId)
  canvas.branchMessages[branchNodeId] = messages
  await saveCanvas(userId, canvas.nodes, canvas.edges, canvas.viewport, canvas.branchMessages)
}

export async function loadBranchMessages(
  userId: string,
  branchNodeId: string,
): Promise<BranchMessage[]> {
  const canvas = await loadCanvas(userId)
  return canvas.branchMessages[branchNodeId] || []
}

// ─── Image resize utility ─────────────────────────────────────────

export async function resizeImage(file: File, maxWidth = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width  = img.width  * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject
    img.src = url
  })
}
