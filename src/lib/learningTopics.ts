import type { LearningTopic } from './learningTypes'

export const LEARNING_TOPICS: LearningTopic[] = [
  {
    id: 'circles-standard-form',
    title: 'Circle Equations — Standard Form',
    subjectId: 'zol-mathematics',
    description: 'Graph circles from their standard equation (x − h)² + (y − k)² = r²',
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Origin circle',
        instruction: 'Graph the curve.',
        equation: 'x² + y² = 9',
        widgetType: 'circle-graph',
        widgetConfig: { gridRange: 6 },
        correctState: { center: { x: 0, y: 0 }, radius: 3 },
        milestone: 'Finding the centre',
        hints: [
          "Look at the equation — no (x − h) or (y − k), so where must the centre be?",
          "The centre is at (0, 0). Now r² = 9, so drag the handle until your circle passes through (3, 0).",
        ],
      },
      {
        id: 'step-2',
        stepNumber: 2,
        title: 'Shifted x',
        instruction: 'Graph the curve.',
        equation: '(x − 1)² + y² = 25',
        widgetType: 'circle-graph',
        widgetConfig: { gridRange: 8 },
        correctState: { center: { x: 1, y: 0 }, radius: 5 },
        milestone: 'Shifted centre',
        hints: [
          "The form is (x − h)² + (y − k)² = r². What are h and k here?",
          "h = 1, k = 0 → centre is (1, 0). And r² = 25 → r = 5.",
        ],
      },
      {
        id: 'step-3',
        stepNumber: 3,
        title: 'Shifted both',
        instruction: 'Graph the curve.',
        equation: '(x + 2)² + (y − 3)² = 16',
        widgetType: 'circle-graph',
        widgetConfig: { gridRange: 10 },
        correctState: { center: { x: -2, y: 3 }, radius: 4 },
        milestone: 'Two-axis shift',
        hints: [
          "Careful — (x + 2)² is the same as (x − (−2))², so h = −2.",
          "Centre is (−2, 3) and r = √16 = 4. You've got this!",
        ],
      },
      {
        id: 'step-4',
        stepNumber: 4,
        title: 'All together',
        instruction: 'Graph the curve.',
        equation: '(x − 3)² + (y + 1)² = 36',
        widgetType: 'circle-graph',
        widgetConfig: { gridRange: 12 },
        correctState: { center: { x: 3, y: -1 }, radius: 6 },
        milestone: 'Full curve — nailed it',
        hints: [
          "h = 3, k = −1. So the centre is at (3, −1).",
          "r² = 36 → r = 6. Place centre at (3, −1) and extend the radius to 6.",
        ],
      },
    ],
  },
]

export function getTopic(id: string): LearningTopic | undefined {
  return LEARNING_TOPICS.find(t => t.id === id)
}
