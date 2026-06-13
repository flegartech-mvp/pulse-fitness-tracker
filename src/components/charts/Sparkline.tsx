import { useId } from 'react'

/** Tiny inline trend line for stat cards. */
export function Sparkline({
  values,
  width = 88,
  height = 28,
  color = 'var(--c-accent)',
}: {
  values: number[]
  width?: number
  height?: number
  color?: string
}) {
  const gradientId = useId()
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const px = values.map((_, i) => (i / (values.length - 1)) * (width - 4) + 2)
  const py = values.map((v) => height - 3 - ((v - min) / range) * (height - 6))
  const d = px.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${py[i]!.toFixed(1)}`).join(' ')
  return (
    <svg width={width} height={height} aria-hidden className="block">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${px.at(-1)} ${height} L ${px[0]} ${height} Z`} fill={`url(#${gradientId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
    </svg>
  )
}
