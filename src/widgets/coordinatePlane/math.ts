export interface GraphPoint {
  id: string
  x: number
  y: number
  label: string
  color: string
}

export interface LinearResult {
  type: 'linear' | 'vertical' | 'horizontal' | 'point'
  slope?: number
  yIntercept?: number
  equation: string
  slopeLabel: string    // "m = 2" or "undefined"
  interceptLabel: string // "b = -1"
}

/** Round to nearest 0.5 for clean snapping. */
export function snapToHalf(v: number): number {
  return Math.round(v * 2) / 2
}

/** Clamp to the graph's data range. */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** Format a number for display: removes unnecessary trailing zeros. */
export function fmt(n: number, decimals = 2): string {
  const s = n.toFixed(decimals)
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s
}

/** Format a slope coefficient (handles 1, -1, 0). */
function fmtCoeff(m: number): string {
  if (m === 1) return ''
  if (m === -1) return '-'
  return fmt(m)
}

/** Compute the linear equation through two points. */
export function computeLinear(a: GraphPoint, b: GraphPoint): LinearResult {
  if (a.x === b.x) {
    // Vertical line
    return {
      type: 'vertical',
      equation: `x = ${fmt(a.x)}`,
      slopeLabel: 'm = undefined',
      interceptLabel: `x = ${fmt(a.x)}`,
    }
  }

  const slope = (b.y - a.y) / (b.x - a.x)
  const yIntercept = a.y - slope * a.x

  // Special cases for horizontal
  if (Math.abs(slope) < 1e-10) {
    return {
      type: 'horizontal',
      slope: 0,
      yIntercept,
      equation: `y = ${fmt(yIntercept)}`,
      slopeLabel: 'm = 0',
      interceptLabel: `b = ${fmt(yIntercept)}`,
    }
  }

  // General linear
  const mStr = fmtCoeff(slope) + 'x'
  const bAbs = Math.abs(yIntercept)
  let equation: string
  if (Math.abs(yIntercept) < 1e-10) {
    equation = `y = ${fmtCoeff(slope)}x`
    if (slope === 1) equation = 'y = x'
    if (slope === -1) equation = 'y = -x'
  } else {
    const sign = yIntercept > 0 ? ' + ' : ' - '
    equation = `y = ${mStr}${sign}${fmt(bAbs)}`
  }

  return {
    type: 'linear',
    slope,
    yIntercept,
    equation,
    slopeLabel: `m = ${fmt(slope)}`,
    interceptLabel: `b = ${fmt(yIntercept)}`,
  }
}

// ─── SVG coordinate transforms ────────────────────────────────────
// The plot area sits inside the SVG with padding for axis labels.

export const SVG_W = 380
export const SVG_H = 300
export const PAD_LEFT = 38
export const PAD_RIGHT = 12
export const PAD_TOP = 14
export const PAD_BOTTOM = 30

export const PLOT_W = SVG_W - PAD_LEFT - PAD_RIGHT  // 330
export const PLOT_H = SVG_H - PAD_TOP - PAD_BOTTOM  // 256

export interface GraphRange {
  xMin: number; xMax: number
  yMin: number; yMax: number
}

export const DEFAULT_RANGE: GraphRange = { xMin: -8, xMax: 8, yMin: -6, yMax: 6 }

export function worldToSvg(wx: number, wy: number, r: GraphRange = DEFAULT_RANGE) {
  const sx = PAD_LEFT + ((wx - r.xMin) / (r.xMax - r.xMin)) * PLOT_W
  const sy = PAD_TOP  + ((r.yMax - wy)  / (r.yMax - r.yMin)) * PLOT_H
  return { sx, sy }
}

export function svgToWorld(sx: number, sy: number, r: GraphRange = DEFAULT_RANGE) {
  const wx = r.xMin + ((sx - PAD_LEFT) / PLOT_W) * (r.xMax - r.xMin)
  const wy = r.yMax - ((sy - PAD_TOP)  / PLOT_H) * (r.yMax - r.yMin)
  return { wx, wy }
}

/** Compute the SVG endpoints of a line extended to graph edges. */
export function lineEndpoints(result: LinearResult, r: GraphRange = DEFAULT_RANGE) {
  if (result.type === 'vertical' && result.equation.startsWith('x =')) {
    const x = parseFloat(result.equation.slice(3))
    const { sx: x1, sy: y1 } = worldToSvg(x, r.yMax, r)
    const { sx: x2, sy: y2 } = worldToSvg(x, r.yMin, r)
    return { x1, y1, x2, y2 }
  }
  const m = result.slope ?? 0
  const b = result.yIntercept ?? 0
  const yAtXMin = m * r.xMin + b
  const yAtXMax = m * r.xMax + b
  const { sx: x1, sy: y1 } = worldToSvg(r.xMin, yAtXMin, r)
  const { sx: x2, sy: y2 } = worldToSvg(r.xMax, yAtXMax, r)
  return { x1, y1, x2, y2 }
}
