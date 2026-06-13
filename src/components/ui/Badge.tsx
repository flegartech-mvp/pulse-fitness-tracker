import type { ExerciseCategory } from '@/types'
import { CATEGORY_LABELS } from '@/data/exerciseLibrary'

const CATEGORY_VAR: Record<ExerciseCategory, string> = {
  chest: 'var(--c-cat-chest)',
  back: 'var(--c-cat-back)',
  legs: 'var(--c-cat-legs)',
  shoulders: 'var(--c-cat-shoulders)',
  arms: 'var(--c-cat-arms)',
  core: 'var(--c-cat-core)',
  cardio: 'var(--c-cat-cardio)',
  fullbody: 'var(--c-cat-fullbody)',
}

export function categoryColor(category: ExerciseCategory): string {
  return CATEGORY_VAR[category]
}

/** Tinted pill for an exercise category, colored consistently across the app. */
export function CategoryBadge({ category, className = '' }: { category: ExerciseCategory; className?: string }) {
  const color = CATEGORY_VAR[category]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}
      style={{ color, background: `color-mix(in srgb, ${color} 13%, transparent)` }}
    >
      {CATEGORY_LABELS[category]}
    </span>
  )
}

export function Pill({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
  className?: string
}) {
  const tones = {
    neutral: 'bg-raised text-soft border border-edge',
    accent: 'bg-accent/15 text-accent-strong dark:text-accent',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-danger/15 text-danger',
  } as const
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
