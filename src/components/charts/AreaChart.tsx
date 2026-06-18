import { useId, useMemo, useState } from 'react'
import { useElementSize } from './useElementSize'

export interface AreaPoint {
  /** Short label shown in the tooltip / axis ("Jun 12", "W24"…). */
  label: string
  value: number
}

interface Layout {
  px: number[]
  py: number[]
  min: number
  max: number
}

const PAD_X = 4
const PAD_TOP = 12
const PAD_BOTTOM = 22
const AXIS_W = 34

/** Smooth monotone-ish path through the points using Catmull-Rom → Bézier. */
function smoothPath(px: number[], py: number[]): string {
  if (px.length === 0) return ''
  if (px.length === 1) return `M ${px[0]} ${py[0]}`
  let d = `M ${px[0]} ${py[0]}`
  for (let i = 0; i < px.length - 1; i++) {
    const x0 = px[i - 1] ?? px[i]!
    const y0 = py[i - 1] ?? py[i]!
    const x1 = px[i]!
    const y1 = py[i]!
    const x2 = px[i + 1]!
    const y2 = py[i + 1]!
    const x3 = px[i + 2] ?? x2
    const y3 = py[i + 2] ?? y2
    const c1x = x1 + (x2 - x0) / 6
    const c1y = y1 + (y2 - y0) / 6
    const c2x = x2 - (x3 - x1) / 6
    const c2y = y2 - (y3 - y1) / 6
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${x2} ${y2}`
  }
  return d
}

/**
 * Responsive area/line chart with gradient fill, y gridlines, and a
 * hover/touch tooltip snapped to the nearest point.
 */
export function AreaChart({
  points,
  height = 200,
  color = 'var(--c-accent)',
  formatValue = (v: number) => String(Math.round(v)),
  showFirstLastLabels = true,
  minValue,
}: {
  points: AreaPoint[]
  height?: number
  color?: string
  formatValue?: (v: number) => string
  showFirstLastLabels?: boolean
  minValue?: number
}) {
  const { ref, width } = useElementSize<HTMLDivElement>()
  const gradientId = useId()
  const [hover, setHover] = useState<number | null>(null)

  const layout = useMemo<Layout | null>(() => {
    if (width === 0 || points.length === 0) return null
    const values = points.map((p) => p.value)
    let min = Math.min(...values)
    let max = Math.max(...values)
    if (min === max) {
      min -= 1
      max += 1
    }
    const range = max - min
    min = minValue ?? min - range * 0.12
    max += range * 0.08
    const innerW = width - AXIS_W - PAD_X * 2
    const innerH = height - PAD_TOP - PAD_BOTTOM
    const px = points.map((_, i) =>
      points.length === 1 ? AXIS_W + PAD_X + innerW / 2 : AXIS_W + PAD_X + (i / (points.length - 1)) * innerW,
    )
    const py = points.map((p) => PAD_TOP + (1 - (p.value - min) / (max - min)) * innerH)
    return { px, py, min, max }
  }, [width, height, points, minValue])

  const gridLines = useMemo(() => {
    if (!layout) return []
    const lines: { y: number; value: number }[] = []
    const steps = 3
    for (let i = 0; i <= steps; i++) {
      const value = layout.max - ((layout.max - layout.min) * i) / steps
      const y = PAD_TOP + (i / steps) * (height - PAD_TOP - PAD_BOTTOM)
      lines.push({ y, value })
    }
    return lines
  }, [layout, height])

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!layout) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < layout.px.length; i++) {
      const d = Math.abs(layout.px[i]! - x)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    setHover(best)
  }

  const hoverPoint = hover != null && layout ? points[hover] : undefined

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {layout && points.length > 0 ? (
        <svg
          width={width}
          height={height}
          className="block touch-none select-none"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label="Trend chart"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {gridLines.map((line, i) => (
            <g key={i}>
              <line x1={AXIS_W} x2={width - PAD_X} y1={line.y} y2={line.y} stroke="var(--c-edge)" strokeDasharray="3 5" />
              <text x={AXIS_W - 8} y={line.y + 3.5} textAnchor="end" className="fill-faint text-[10px]">
                {formatValue(line.value)}
              </text>
            </g>
          ))}

          <path
            d={`${smoothPath(layout.px, layout.py)} L ${layout.px.at(-1)} ${height - PAD_BOTTOM} L ${layout.px[0]} ${height - PAD_BOTTOM} Z`}
            fill={`url(#${gradientId})`}
          />
          <path d={smoothPath(layout.px, layout.py)} fill="none" stroke={color} strokeWidth={2.25} strokeLinecap="round" />

          {showFirstLastLabels && points.length > 1 ? (
            <>
              <text x={layout.px[0]} y={height - 6} textAnchor="start" className="fill-faint text-[10px]">
                {points[0]!.label}
              </text>
              <text x={layout.px.at(-1)} y={height - 6} textAnchor="end" className="fill-faint text-[10px]">
                {points.at(-1)!.label}
              </text>
            </>
          ) : null}

          {hover != null ? (
            <g>
              <line
                x1={layout.px[hover]}
                x2={layout.px[hover]}
                y1={PAD_TOP}
                y2={height - PAD_BOTTOM}
                stroke="var(--c-edge-strong)"
              />
              <circle cx={layout.px[hover]} cy={layout.py[hover]} r={4.5} fill={color} stroke="var(--c-surface)" strokeWidth={2} />
            </g>
          ) : null}
        </svg>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-faint">No data yet</div>
      )}

      {hoverPoint && layout && hover != null ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-edge bg-raised px-2.5 py-1.5 text-center shadow-pop"
          style={{
            left: Math.min(Math.max(layout.px[hover]!, 48), Math.max(width - 48, 48)),
            top: Math.max(layout.py[hover]! - 54, 0),
          }}
        >
          <p className="tnum text-sm font-bold text-ink">{formatValue(hoverPoint.value)}</p>
          <p className="text-[10px] text-soft">{hoverPoint.label}</p>
        </div>
      ) : null}
    </div>
  )
}
