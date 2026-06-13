import { useMemo } from 'react'
import { addDays, formatDateMedium, lastNWeekStarts, todayKey } from '@/lib/dates'

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']

/**
 * GitHub-style consistency heatmap: one column per week, one row per weekday.
 * Intensity reflects sets completed that day.
 */
export function Heatmap({ activity, weeks = 16 }: { activity: Map<string, number>; weeks?: number }) {
  const today = todayKey()
  const weekStarts = useMemo(() => lastNWeekStarts(weeks), [weeks])

  const max = useMemo(() => {
    let m = 0
    for (const v of activity.values()) m = Math.max(m, v)
    return m
  }, [activity])

  function cellColor(count: number | undefined): string {
    if (!count) return 'var(--c-edge)'
    const t = Math.min(1, count / Math.max(max, 1))
    const pct = 25 + Math.round(t * 75)
    return `color-mix(in srgb, var(--c-accent) ${pct}%, var(--c-edge))`
  }

  return (
    <div className="flex gap-2">
      <div className="grid shrink-0 grid-rows-7 gap-1 pt-0.5">
        {DAY_LABELS.map((label, i) => (
          <span key={i} className="flex h-3.5 items-center text-[9px] leading-none text-faint">
            {label}
          </span>
        ))}
      </div>
      <div className="scroll-slim flex flex-1 justify-end gap-1 overflow-x-auto pb-1">
        {weekStarts.map((weekStart) => (
          <div key={weekStart} className="grid shrink-0 grid-rows-7 gap-1">
            {Array.from({ length: 7 }, (_, dow) => {
              const day = addDays(weekStart, dow)
              const future = day > today
              const count = activity.get(day)
              return (
                <div
                  key={dow}
                  title={future ? undefined : `${formatDateMedium(day)}: ${count ?? 0} sets`}
                  className="size-3.5 rounded-[4px]"
                  style={{ background: future ? 'transparent' : cellColor(count) }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
