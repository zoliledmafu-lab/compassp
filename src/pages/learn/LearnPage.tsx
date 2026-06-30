import { useNavigate, useParams } from 'react-router-dom'
import { getTopic, LEARNING_TOPICS } from '../../lib/learningTopics'
import { LearningEnvironment } from '../../components/learn/LearningEnvironment'

export function LearnPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate    = useNavigate()
  const topic       = topicId ? getTopic(topicId) : undefined

  if (!topic) {
    // Topic picker
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#f8f4ef' }}>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Interactive Learning</h1>
        <p className="text-slate-500 mb-8 text-sm">Pick a topic to practise with Compass</p>
        <div className="w-full max-w-sm space-y-3">
          {LEARNING_TOPICS.map(t => (
            <button
              key={t.id}
              onClick={() => navigate(`/learn/${t.id}`)}
              className="w-full text-left p-4 rounded-2xl border transition-all hover:shadow-md"
              style={{ background: '#fdfaf4', border: '1.5px solid #e5e0d8' }}
            >
              <p className="font-semibold text-slate-700">{t.title}</p>
              <p className="text-sm text-slate-400 mt-0.5">{t.description}</p>
              <p className="text-xs text-teal-600 mt-1 font-medium">{t.steps.length} steps</p>
            </button>
          ))}
        </div>
        <button onClick={() => navigate(-1)} className="mt-8 text-sm text-slate-400 hover:text-slate-600">← Back</button>
      </div>
    )
  }

  return <LearningEnvironment topic={topic} onExit={() => navigate('/subjects')} />
}
