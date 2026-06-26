import type { WidgetPlugin } from './types'
import { coordinatePlanePlugin } from './coordinatePlane/index'
import { statisticsPlugin } from './statistics/index'
import { quadraticPlugin } from './quadratic/index'
import { trigPlugin } from './trig/index'
import { physicsWavePlugin, physicsProjectilePlugin, physicsForcesPlugin } from './physics/index'
import { chemistryTitrationPlugin, chemistryPeriodicPlugin } from './chemistry/index'
import { biologyPunnettPlugin, biologyFoodWebPlugin } from './biology/index'
import { economicsSupplyDemandPlugin } from './economics/index'
import { accountingTAccountPlugin } from './accounting/index'
import { businessSwotPlugin } from './business/index'
import { englishEssayPlannerPlugin } from './english/index'
import { historyTimelinePlugin } from './history/index'
import { geographyClimatePlugin } from './geography/index'
import { csBinaryConverterPlugin, csTraceTablePlugin } from './computerscience/index'
import { psychStudyPlugin } from './psychology/index'
import { lawIracPlugin } from './law/index'
import { sociologyPerspectivesPlugin } from './sociology/index'
import { vocabBuilderPlugin } from './languages/index'
import { cropPlannerPlugin } from './agriculture/index'
import { ecoDataPlugin } from './environment/index'
import { shapePropertiesPlugin } from './techgraphics/index'
import { nutrientPlannerPlugin } from './foodnutrition/index'

const PLUGINS: WidgetPlugin<any>[] = [
  coordinatePlanePlugin,
  statisticsPlugin,
  quadraticPlugin,
  trigPlugin,
  physicsWavePlugin,
  physicsProjectilePlugin,
  physicsForcesPlugin,
  chemistryTitrationPlugin,
  chemistryPeriodicPlugin,
  biologyPunnettPlugin,
  biologyFoodWebPlugin,
  economicsSupplyDemandPlugin,
  accountingTAccountPlugin,
  businessSwotPlugin,
  englishEssayPlannerPlugin,
  historyTimelinePlugin,
  geographyClimatePlugin,
  csBinaryConverterPlugin,
  csTraceTablePlugin,
  psychStudyPlugin,
  lawIracPlugin,
  sociologyPerspectivesPlugin,
  vocabBuilderPlugin,
  cropPlannerPlugin,
  ecoDataPlugin,
  shapePropertiesPlugin,
  nutrientPlannerPlugin,
]

const byId = new Map(PLUGINS.map(p => [p.id, p]))

export function getPlugin(id: string): WidgetPlugin<any> | undefined {
  return byId.get(id)
}

export function getAllPlugins(): WidgetPlugin<any>[] {
  return PLUGINS
}

export function getPluginsForSubject(subjectId: string): WidgetPlugin<any>[] {
  return PLUGINS.filter(p => p.subjects.includes(subjectId))
}
