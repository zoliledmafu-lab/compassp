export type CharacterState = 'idle' | 'thinking' | 'speaking' | 'celebrating' | 'moving'

export interface DrawAnnotation {
  id: string
  type: 'circle' | 'arrow' | 'highlight' | 'ghost_sketch' | 'label' | 'erase'
  target: { x: number; y: number; x2?: number; y2?: number; r?: number }
  style: { color: string; opacity: number; dashArray?: string; strokeWidth?: number }
  text?: string
}

// ─── Widget States ────────────────────────────────────────────────────────────

export interface CircleWidgetState {
  center: { x: number; y: number }
  radius: number
}

export interface LinearWidgetState {
  slope: number
  intercept: number
}

export interface QuadraticWidgetState {
  a: number
  h: number
  k: number
}

export interface AngleWidgetState {
  angleDeg: number
}

export interface PythagorasWidgetState {
  a: number
  b: number
}

export interface NumberLineWidgetState {
  value: number
}

export interface BarChartWidgetState {
  bars: number[]
}

export interface ProcessDiagramWidgetState {
  selectedStage: string
  visitedStages: string[]
}

export type WidgetType =
  | 'circle-graph'
  | 'linear-graph'
  | 'quadratic-graph'
  | 'angle'
  | 'pythagoras'
  | 'number-line'
  | 'bar-chart'
  | 'process-diagram'

export type WidgetState =
  | CircleWidgetState
  | LinearWidgetState
  | QuadraticWidgetState
  | AngleWidgetState
  | PythagorasWidgetState
  | NumberLineWidgetState
  | BarChartWidgetState
  | ProcessDiagramWidgetState

// ─── Topic Step ───────────────────────────────────────────────────────────────

export interface TopicStep {
  id: string
  stepNumber: number
  title: string
  instruction: string
  equation?: string
  widgetType: WidgetType
  widgetConfig: {
    gridRange: number
    // number-line extras
    min?: number
    max?: number
    unit?: string
    zones?: { min: number; max: number; color: string; label: string }[]
    // bar-chart extras
    labels?: string[]
    yMax?: number
    yLabel?: string
    barColor?: string
    // tolerance bars (per bar index: expected ± tol)
    barTolerance?: number
    [key: string]: unknown
  }
  correctState: WidgetState
  tolerance?: Record<string, number>
  milestone: string
  hints: string[]
}

export interface LearningTopic {
  id: string
  title: string
  subjectId: string
  description: string
  steps: TopicStep[]
}

// ─── Subject definitions ──────────────────────────────────────────────────────

export interface SubjectDef {
  id: string
  label: string
  icon: string
  color: string
  gradient: string
  curricula: string[]
}

export const SUBJECTS: SubjectDef[] = [
  {
    id: 'zol-mathematics',
    label: 'Mathematics',
    icon: '📐',
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
    curricula: ['ZIMSEC-OL', 'ZIMSEC-AL', 'CAM-IGCSE', 'CAM-AL'],
  },
  {
    id: 'zol-physics',
    label: 'Physics',
    icon: '⚡',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)',
    curricula: ['ZIMSEC-OL', 'ZIMSEC-AL', 'CAM-IGCSE', 'CAM-AL'],
  },
  {
    id: 'zol-chemistry',
    label: 'Chemistry',
    icon: '🧪',
    color: '#a78bfa',
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)',
    curricula: ['ZIMSEC-OL', 'ZIMSEC-AL', 'CAM-IGCSE', 'CAM-AL'],
  },
  {
    id: 'zol-biology',
    label: 'Biology',
    icon: '🧬',
    color: '#4ade80',
    gradient: 'linear-gradient(135deg, #15803d 0%, #4ade80 100%)',
    curricula: ['ZIMSEC-OL', 'ZIMSEC-AL', 'CAM-IGCSE', 'CAM-AL'],
  },
  {
    id: 'zol-geography',
    label: 'Geography',
    icon: '🌍',
    color: '#fb923c',
    gradient: 'linear-gradient(135deg, #c2410c 0%, #fb923c 100%)',
    curricula: ['ZIMSEC-OL', 'ZIMSEC-AL'],
  },
  {
    id: 'zol-history',
    label: 'History',
    icon: '📜',
    color: '#f87171',
    gradient: 'linear-gradient(135deg, #991b1b 0%, #f87171 100%)',
    curricula: ['ZIMSEC-OL', 'ZIMSEC-AL'],
  },
]

export function getSubject(id: string): SubjectDef | undefined {
  return SUBJECTS.find(s => s.id === id)
}
