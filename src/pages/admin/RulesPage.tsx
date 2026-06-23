import { Settings, ToggleLeft, ToggleRight, Sliders } from 'lucide-react'
import { useRules } from '../../contexts/RulesContext'
import { Card } from '../../components/ui/Card'

export function RulesPage() {
  const { rules, updateRules } = useRules()

  const toggles = [
    { key: 'no_direct_answers' as const, label: 'Never give direct answers', desc: 'Compass guides students to answers rather than stating them outright.' },
    { key: 'ask_clarifying_question' as const, label: 'Ask clarifying questions', desc: 'When a request is ambiguous, ask one clarifying question first.' },
    { key: 'always_encouraging' as const, label: 'Always encouraging tone', desc: 'Maintain warm, patient, positive tone regardless of student frustration.' },
    { key: 'flag_repeated_answer_attempts' as const, label: 'Flag repeated answer attempts', desc: 'Log when students repeatedly try to get direct answers.' },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <Settings size={24} className="text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Rule Engine</h1>
          <p className="text-slate-400 text-sm">Control Compass's behavior across all students. Changes apply immediately.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {toggles.map(({ key, label, desc }) => (
          <Card key={key} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-white">{label}</p>
              <p className="text-sm text-slate-400 mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => updateRules({ [key]: !rules[key] })}
              className={`shrink-0 transition-colors ${rules[key] ? 'text-indigo-400' : 'text-slate-600'}`}
            >
              {rules[key] ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
            </button>
          </Card>
        ))}

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Sliders size={18} className="text-amber-400" />
            <p className="font-medium text-white">Max hints before break suggestion</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range" min={1} max={10} value={rules.max_hints_before_break}
              onChange={e => updateRules({ max_hints_before_break: Number(e.target.value) })}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-2xl font-bold text-indigo-400 w-8 text-center">{rules.max_hints_before_break}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">After this many hints, Compass suggests the student attempt the next step alone.</p>
        </Card>
      </div>
    </div>
  )
}
