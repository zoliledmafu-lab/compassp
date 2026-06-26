import type { WidgetPlugin, StateSnapshot } from '../types'
import NutrientPlanner, { type NutritionState, defaultState } from './NutrientPlanner'

function describeState(s: NutritionState): string {
  const totals = s.foods.reduce(
    (acc, f) => ({ carbs: acc.carbs + f.carbs, protein: acc.protein + f.protein, fat: acc.fat + f.fat, fibre: acc.fibre + f.fibre }),
    { carbs: 0, protein: 0, fat: 0, fibre: 0 }
  )
  const kcal = totals.carbs * 4 + totals.protein * 4 + totals.fat * 9
  return `Meal: ${s.mealName}. Foods: ${s.foods.map(f => f.name).join(', ')}. Total: ${kcal.toFixed(0)} kcal, C:${totals.carbs.toFixed(1)}g P:${totals.protein.toFixed(1)}g F:${totals.fat.toFixed(1)}g.`
}

function detectStruggle(history: StateSnapshot<NutritionState>[]) {
  if (history.length < 4) return { struggling: false as const }
  const recent = history.slice(-6)
  const hasChecked = recent.some(s => s.trigger === 'check')
  const noNotes = recent.every(s => !s.state.notes)
  if (noNotes && !hasChecked) return { struggling: true as const, reason: 'no-analysis' as const }
  return { struggling: false as const }
}

export const nutrientPlannerPlugin: WidgetPlugin<NutritionState> = {
  id: 'foodnutrition-planner',
  name: 'Nutrient Planner',
  description: 'Build a meal, track macronutrients (carbs, protein, fat, fibre) and analyse nutritional value.',
  subjects: ['zol-food-nutrition'],
  icon: '🍽️',
  defaultState,
  Component: NutrientPlanner,
  describeState,
  detectStruggle,
}
