import { createContext, useContext } from 'react'

export interface CanvasCallbacks {
  subjectId: string
  onBranch: (sourceNodeId: string) => void
  onDelete: (nodeId: string) => void
  onUpdateText: (nodeId: string, content: string) => void
  onUpdateCaption: (nodeId: string, caption: string) => void
  onOpenBranch: (branchNodeId: string) => void
  onUpdateWidgetState: (nodeId: string, patch: Record<string, unknown>) => void
}

export const CanvasContext = createContext<CanvasCallbacks | null>(null)

export function useCanvasCallbacks(): CanvasCallbacks {
  const ctx = useContext(CanvasContext)
  if (!ctx) throw new Error('useCanvasCallbacks must be inside CanvasContext.Provider')
  return ctx
}
