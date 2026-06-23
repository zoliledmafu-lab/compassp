import type { WidgetPlugin } from './types'
import { coordinatePlanePlugin } from './coordinatePlane/index'

// All registered widget plugins. Add new widgets here — no other file needs changing.
const PLUGINS: WidgetPlugin<any>[] = [
  coordinatePlanePlugin,
  // geometryPlugin,     // phase 2
  // codeBlocksPlugin,   // phase 3
  // simulationPlugin,   // phase 4
]

const byId = new Map(PLUGINS.map(p => [p.id, p]))

export function getPlugin(id: string): WidgetPlugin<any> | undefined {
  return byId.get(id)
}

export function getAllPlugins(): WidgetPlugin<any>[] {
  return PLUGINS
}
