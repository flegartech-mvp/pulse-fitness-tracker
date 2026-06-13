export function ProgressBar({
  fraction,
  className = '',
  color = 'var(--c-accent)',
}: {
  fraction: number
  className?: string
  color?: string
}) {
  const pct = Math.min(100, Math.max(0, fraction * 100))
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-edge ${className}`}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

export function ProgressRing({
  fraction,
  size = 56,
  strokeWidth = 5,
  color = 'var(--c-accent)',
  children,
}: {
  fraction: number
  size?: number
  strokeWidth?: number
  color?: string
  children?: React.ReactNode
}) {
  const clamped = Math.min(1, Math.max(0, fraction))
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-edge)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      {children ? <div className="absolute inset-0 flex items-center justify-center">{children}</div> : null}
    </div>
  )
}
