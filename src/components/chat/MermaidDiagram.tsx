import { useEffect, useState } from 'react'

interface Props {
  code: string
  isStreaming?: boolean
}

let mermaidReady = false

export function MermaidDiagram({ code, isStreaming }: Props) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Don't render incomplete mermaid code while the message is still streaming
    if (isStreaming) return

    let cancelled = false
    setSvg('')
    setError('')

    // Small debounce so rapid re-renders don't stack up
    const timer = setTimeout(() => {
      import('mermaid').then(async ({ default: mermaid }) => {
        if (cancelled) return
        if (!mermaidReady) {
          mermaid.initialize({ startOnLoad: false, theme: 'dark' })
          mermaidReady = true
        }
        // Fresh ID every attempt so stale DOM elements don't conflict
        const id = 'mmd-' + Math.random().toString(36).slice(2, 10)
        try {
          const { svg: rendered } = await mermaid.render(id, code.trim())
          if (!cancelled) setSvg(rendered)
        } catch (e: unknown) {
          if (!cancelled) setError(String(e))
        }
      })
    }, 80)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [code, isStreaming])

  if (isStreaming) return (
    <div className="text-xs text-slate-500 py-2 italic">Diagram will render when response finishes…</div>
  )

  if (error) return (
    <div className="my-3 border border-amber-500/20 bg-amber-500/5 rounded-xl p-3">
      <p className="text-xs text-amber-400 mb-2">Diagram could not render:</p>
      <pre className="text-xs text-slate-400 whitespace-pre-wrap overflow-x-auto">{code}</pre>
    </div>
  )

  if (!svg) return (
    <div className="text-xs text-slate-500 py-2 animate-pulse">Rendering diagram…</div>
  )

  return (
    <div
      className="my-3 overflow-x-auto bg-white/5 border border-white/8 rounded-xl p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
