export type CharacterState = 'idle' | 'thinking' | 'speaking' | 'celebrating' | 'moving'

export interface DrawAnnotation {
  id: string
  type: 'circle' | 'arrow' | 'highlight' | 'ghost_sketch' | 'label' | 'erase'
  target: {
    x: number
    y: number
    x2?: number
    y2?: number
    r?: number
  }
  style: {
    color: string
    opacity: number
    dashArray?: string
    strokeWidth?: number
  }
  text?: string
}

export interface CircleWidgetState {
  center: { x: number; y: number }
  radius: number
}

export type WidgetState = CircleWidgetState

export interface TopicStep {
  id: string
  stepNumber: number
  title: string
  instruction: string
  equation?: string
  widgetType: 'circle-graph'
  widgetConfig: { gridRange: number }
  correctState: CircleWidgetState
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
