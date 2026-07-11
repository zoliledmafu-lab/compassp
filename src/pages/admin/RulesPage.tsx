import { Settings, ToggleLeft, ToggleRight, Sliders, Layers, Heart, Star } from 'lucide-react'
import { useRules } from '../../contexts/RulesContext'
import { Card } from '../../components/ui/Card'

export function RulesPage() {
  const { rules, updateRules } = useRules()

  const toggles = [
    { key: 'no_direct_answers' as const, label: 'Never give direct answers', desc: 'Compass guides students to answers rather than stating them outright.' },
    { key: 'ask_clarifying_question' as const, label: 'Ask clarifying questions', desc: 'When a request is ambiguous, ask one clarifying question first.' },
    { key: 'always_encouraging' as const, label: 'Always encouraging tone', desc: 'Maintain warm, patient, positive tone regardless of student frustration.' },
    { key: 'flag_repeated_answer_attempts' as const, label: 'Flag repeated answer attempts', desc: 'Log when students repeatedly try to get direct answers.' },
    { key: 'emotional_detection_enabled' as const, label: 'Emotional / frustration detection', desc: 'When a student sends very short messages, asks for direct answers, or repeats the same question, Compass acknowledges their frustration warmly before continuing.' },
  ]

  const maxScaffold = rules.max_scaffold_level ?? 3

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <Settings size={24} className="text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Rule Engine</h1>
          <p className="text-slate-400 text-sm">Control Compass's behaviour across all students. Changes apply immediately.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">

        {/* ── Section: Behaviour toggles ── */}
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium px-1">Behaviour</p>

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

        {/* ── Section: Scaffolding ── */}
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium px-1 mt-2">Progressive Scaffolding</p>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Layers size={18} className="text-indigo-400" />
            <div>
              <p className="font-medium text-white">Level 4 trigger — hints before full explanation</p>
              <p className="text-sm text-slate-400 mt-0.5">
                How many exchanges before Compass moves to Level 4 (full explanation + new practice problem).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range" min={2} max={6} value={maxScaffold}
              onChange={e => updateRules({ max_scaffold_level: Number(e.target.value) })}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-2xl font-bold text-indigo-400 w-8 text-center">{maxScaffold}</span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-center text-slate-500">
            <div className="rounded-lg px-2 py-1.5 bg-white/5">Level 1<br /><span className="text-slate-400">0 hints</span></div>
            <div className="rounded-lg px-2 py-1.5 bg-white/5">Level 2<br /><span className="text-slate-400">1 hint</span></div>
            <div className="rounded-lg px-2 py-1.5 bg-white/5">Level 3<br /><span className="text-slate-400">2–{maxScaffold - 1} hints</span></div>
            <div className="rounded-lg px-2 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">Level 4<br /><span>{maxScaffold}+ hints</span></div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Sliders size={18} className="text-amber-400" />
            <p className="font-medium text-white">Max hints before break suggestion</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range" min={1} max={10} value={rules.max_hints_before_break}
              onChange={e => updateRules({ max_hints_before_break: Number(e.target.value) })}
              className="flex-1 accent-amber-500"
            />
            <span className="text-2xl font-bold text-amber-400 w-8 text-center">{rules.max_hints_before_break}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">After this many consecutive hints, Compass gently suggests the student attempt the next step independently.</p>
        </Card>

        {/* ── Section: Celebration ── */}
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium px-1 mt-2">Celebration Style</p>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Star size={18} className="text-yellow-400" />
            <div>
              <p className="font-medium text-white">Correct-answer celebration tone</p>
              <p className="text-sm text-slate-400 mt-0.5">How Compass praises a student when they get something right.</p>
            </div>
          </div>
          <div className="flex gap-3">
            {(['informal', 'formal'] as const).map(tone => (
              <button
                key={tone}
                onClick={() => updateRules({ celebration_tone: tone })}
                className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  (rules.celebration_tone ?? 'informal') === tone
                    ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300'
                    : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {tone === 'informal'
                  ? <>Warm & enthusiastic<br /><span className="text-xs font-normal opacity-70 mt-0.5 block">Local language welcome</span></>
                  : <>Formal & precise<br /><span className="text-xs font-normal opacity-70 mt-0.5 block">Professional language</span></>
                }
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-white/4 px-4 py-3 text-xs text-slate-400 leading-relaxed">
            {(rules.celebration_tone ?? 'informal') === 'informal'
              ? <><Heart size={11} className="inline mr-1 text-pink-400" /><strong>Example:</strong> "Ndiyo chaizvo — wakaona kuti nhamba iri mukati mebracket ndiyo centre. Izvi ndiyo chinhu chakakosha muequation ye circle!"</>
              : <><strong>Example:</strong> "That is correct. You identified that the value inside the bracket represents the x-coordinate of the centre — this is the key insight for all circle equations."</>
            }
          </div>
        </Card>

      </div>
    </div>
  )
}
