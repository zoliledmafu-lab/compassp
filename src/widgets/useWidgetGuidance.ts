import { useCallback, useEffect, useRef } from 'react'
import { useRules } from '../contexts/RulesContext'
import { streamWidgetGuidance } from '../lib/claudeApi'
import { buildSystemPrompt } from '../lib/ruleEngine'
import type { WidgetPlugin, StateSnapshot, WidgetNodeData } from './types'
import type { StudentMemory } from '../lib/supabase'
import type { Subject } from '../lib/subjects'

interface Options {
  nodeId: string
  plugin: WidgetPlugin<any>
  nodeData: WidgetNodeData
  subject: Subject
  memory: StudentMemory | null
  onPatchNodeData: (patch: Partial<WidgetNodeData>) => void
}

interface CheckResult {
  streaming: boolean
}

const STRUGGLE_WINDOW_MS = 45_000
const STRUGGLE_COOLDOWN_MS = 90_000    // don't nudge more than once per 90s
const CHECK_DEBOUNCE_MS = 400

export function useWidgetGuidance({
  nodeId: _nodeId,
  plugin,
  nodeData,
  subject,
  memory,
  onPatchNodeData,
}: Options) {
  const { rules } = useRules()
  const streamingRef = useRef(false)
  const checkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Build system prompt once per call (cheap)
  const getSystemPrompt = useCallback(() => {
    return buildSystemPrompt(rules, subject, memory, nodeData.hintCount)
  }, [rules, subject, memory, nodeData.hintCount])

  // Shared streaming helper
  const runGuidance = useCallback((isNudge: boolean) => {
    if (streamingRef.current) return
    streamingRef.current = true

    const stateDesc = plugin.describeState(nodeData.widgetState as any)
    const systemPrompt = getSystemPrompt()
    let accumulated = ''

    // Reset feedback display so the user sees it streaming in
    onPatchNodeData({
      checkFeedback: '',
      lastCheckTime: Date.now(),
      hintCount: nodeData.hintCount + 1,
      ...(isNudge ? { lastStruggleNudgeTime: Date.now() } : {}),
    })

    streamWidgetGuidance(
      systemPrompt,
      stateDesc,
      isNudge,
      nodeData.hintCount,
      rules.max_hints_before_break ?? 5,
      (chunk) => {
        accumulated += chunk
        onPatchNodeData({ checkFeedback: accumulated })
      },
      () => {
        streamingRef.current = false
        // Append the Check to history
        const snap: StateSnapshot = {
          state: nodeData.widgetState,
          timestamp: Date.now(),
          trigger: 'check',
        }
        onPatchNodeData({
          checkFeedback: accumulated,
          stateHistory: [...nodeData.stateHistory, snap],
        })
      },
      () => {
        streamingRef.current = false
      },
    )
  }, [plugin, nodeData, getSystemPrompt, rules, onPatchNodeData])

  /** Called when student clicks "Check with Compass" */
  const check = useCallback((): CheckResult => {
    // Debounce rapid double-clicks
    if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current)
    checkDebounceRef.current = setTimeout(() => {
      runGuidance(false)
    }, CHECK_DEBOUNCE_MS)
    return { streaming: streamingRef.current }
  }, [runGuidance])

  /** Call whenever the widget state changes (drag/input) to push a snapshot */
  const recordStateChange = useCallback((
    newState: Record<string, unknown>,
    trigger: 'drag' | 'input' = 'drag',
  ) => {
    const snap: StateSnapshot = { state: newState, timestamp: Date.now(), trigger }
    onPatchNodeData({
      widgetState: newState,
      stateHistory: [...nodeData.stateHistory.slice(-20), snap],
    })
  }, [nodeData.stateHistory, onPatchNodeData])

  // ── Struggle detection loop ────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (streamingRef.current) return
      const history = nodeData.stateHistory
      if (history.length < 4) return

      const now = Date.now()
      const lastNudge = nodeData.lastStruggleNudgeTime

      // Respect cooldown
      if (now - lastNudge < STRUGGLE_COOLDOWN_MS) return

      // Only consider recent snapshots
      const recent = history.filter(s => now - s.timestamp < STRUGGLE_WINDOW_MS)
      const { struggling } = plugin.detectStruggle(recent as any)
      if (struggling) {
        runGuidance(true)
      }
    }, 10_000) // Check every 10s — cheap since it's local
    return () => clearInterval(id)
  }, [nodeData, plugin, runGuidance])

  return { check, recordStateChange, streaming: streamingRef }
}
