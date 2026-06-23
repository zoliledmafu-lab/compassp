import type React from 'react'

// ─── Core plugin interface ────────────────────────────────────────
// Every widget type implements this contract. The orchestration layer
// (WidgetNode, guidance hook, struggle detection) only talks to this interface.

export interface WidgetPlugin<TState extends Record<string, unknown> = Record<string, unknown>> {
  /** Stable id used in canvas_nodes.data.widgetId */
  id: string
  name: string
  description: string
  subjects: string[]          // which NSC subjects this widget applies to
  icon: string
  defaultState: TState

  /** The interactive React component */
  Component: React.ComponentType<WidgetProps<TState>>

  /**
   * Convert current state to a plain-English description for Compass.
   * This is what Compass reads — never raw JSON.
   */
  describeState(state: TState): string

  /**
   * Returns true when the student's recent state history suggests
   * they are stuck without progress. Called after debounce.
   */
  detectStruggle(history: StateSnapshot<TState>[]): StruggleResult
}

export interface WidgetProps<TState extends Record<string, unknown>> {
  state: TState
  onChange: (newState: TState) => void
  onCheck: () => void         // student explicitly requests feedback
  readonly?: boolean
}

export interface StateSnapshot<TState = Record<string, unknown>> {
  state: TState
  timestamp: number
  trigger: 'init' | 'drag' | 'input' | 'check'
}

export interface StruggleResult {
  struggling: boolean
  reason?: 'oscillating' | 'many-changes-no-check' | 'stuck-same-state'
}

// ─── Canvas node data for widgets ─────────────────────────────────

export interface WidgetNodeData extends Record<string, unknown> {
  widgetId: string
  widgetState: Record<string, unknown>
  stateHistory: StateSnapshot[]
  lastCheckTime: number        // unix ms — 0 if never checked
  checkFeedback: string        // last Compass response (shown in node)
  hintCount: number            // hints used this session for this widget
  lastStruggleNudgeTime: number
}

export const DEFAULT_WIDGET_NODE_DATA: Omit<WidgetNodeData, 'widgetId' | 'widgetState'> = {
  stateHistory: [],
  lastCheckTime: 0,
  checkFeedback: '',
  hintCount: 0,
  lastStruggleNudgeTime: 0,
}
