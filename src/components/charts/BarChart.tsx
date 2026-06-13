import { useMemo, useState } from 'react'
import { useElementSize } from './useElementSize'

export interface Bar {
  label: string
  value: number
  /** Highlight (e.g. the current week). */
  emphasis?: boolean
}

const PAD_TOP = 14
const PAD_BOTTOM = 20

/** Responsive bar chart with rounded bars and hover values. */
export function BarChart({
  bars,
  height = 180,
  color = 'var(--c-accent)',
  formatValue = (v: number) => String(Math.round(v)),
}: {
  bars: Bar[]
  height?: number
  color?: string
  formatValue?: (v: number) => string
}) {
  const { ref, width } = useElementSize<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const layout = useMemo(() => {
    if (width === 0 || bars.length === 0) return null
    const max = Math.max(...bars.map((b) => b.value), 1)
    const innerH = height - PAD_TOP - PAD_BOTTOM
    const slot = width / bars.length
    const barW = Math.min(Math.max(slot * 0.52, 8), 44)
    return { max, innerH, slot, barW }
  }, [width, height, bars])

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {layout ? (
        <svg width={width} height={height} className="block select-none" role="img" aria-label="Bar chart">
          {bars.map((bar, i) => {
            const h = bar.value <= 0 ? 2 : Math.max((bar.value / layout.max) * layout.innerH, 3)
            const x = i * layout.slot + (layout.slot - layout.barW) / 2
            const y = PAD_TOP + layout.innerH - h
            const active = hover === i
            return (
              <g
                key={i}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              >
                {/* invisible hover target across the full column */}
                <rect x={i * layout.slot} y={0} width={layout.slot} height={height} fill="transparent" />
                <rect
                  x={x}
                  y={y}
                  width={layout.barW}
                  height={h}
                  rx={Math.min(6, layout.barW / 2)}
                  fill={bar.emphasis ? color : 'color-mix(in srgb, var(--c-soft) 28%, transparent)'}
                  opacity={active ? 0.85 : 1}
                  className="transition-opacity"
                />
                {(active || (bar.emphasis && hover == null)) && bar.value > 0 ? (
                  <text
                    x={i * layout.slot + layout.slot / 2}
                    y={y - 5}
                    textAnchor="middle"
                    className="tnum fill-ink text-[10px] font-semibold"
                  >
                    {formatValue(bar.value)}
                  </text>
                ) : null}
                <text
                  x={i * layout.slot + layout.slot / 2}
                  y={height - 5}
                  textAnchor="middle"
                  className={`text-[10px] ${bar.emphasis ? 'fill-soft font-semibold' : 'fill-faint'}`}
                >
                  {bar.label}
                </text>
              </g>
            )
          })}
        </svg>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-faint">No data yet</div>
      )}
    </div>
  )
}
