import { Link } from 'react-router-dom'
import { ChevronRight, Clock, Flame, Layers } from 'lucide-react'
import type { ExerciseCategory, Workout } from '@/types'
import { useAppData, useProfile } from '@/state/AppDataContext'
import { countSets, workoutCalories, workoutDurationSec, workoutVolumeKg } from '@/lib/calc'
import { formatDuration, formatVolume } from '@/lib/format'
import { formatRelativeDay } from '@/lib/dates'
import { isoToDateKey } from '@/lib/dates'
import { CategoryBadge, Pill } from '@/components/ui/Badge'
import { InteractiveCard } from '@/components/ui/Card'

/** One workout in a list — shared by the dashboard and the workouts page. */
export function WorkoutCard({ workout }: { workout: Workout }) {
  const { resolveExercise, bodyWeightKg } = useAppData()
  const profile = useProfile()

  const volume = workoutVolumeKg(workout)
  const duration = workoutDurationSec(workout, resolveExercise)
  const calories = workoutCalories(workout, resolveExercise, bodyWeightKg)
  const sets = countSets(workout, workout.status === 'completed')

  const categories: ExerciseCategory[] = []
  for (const entry of workout.exercises) {
    const cat = resolveExercise(entry.exerciseId)?.category
    if (cat && !categories.includes(cat)) categories.push(cat)
  }

  const dateLabel =
    workout.status === 'completed' && workout.completedAt
      ? formatRelativeDay(isoToDateKey(workout.completedAt))
      : workout.scheduledFor
        ? formatRelativeDay(workout.scheduledFor)
        : 'Unscheduled'

  return (
    <Link to={`/workouts/${workout.id}`} className="block">
      <InteractiveCard className="flex items-center gap-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-ink">{workout.name}</h3>
            {workout.status === 'planned' ? <Pill tone="accent">{dateLabel}</Pill> : null}
            {workout.status === 'active' ? <Pill tone="warning">In progress</Pill> : null}
            {workout.status === 'completed' ? <span className="text-xs text-faint">{dateLabel}</span> : null}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-soft">
            <span className="inline-flex items-center gap-1">
              <Layers className="size-3.5" aria-hidden />
              {workout.exercises.length} exercises · {sets} sets
            </span>
            {volume > 0 ? <span className="tnum">{formatVolume(volume, profile.weightUnit)}</span> : null}
            <span className="tnum inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {formatDuration(duration)}
            </span>
            {calories > 0 ? (
              <span className="tnum inline-flex items-center gap-1">
                <Flame className="size-3.5" aria-hidden />~{calories} kcal
              </span>
            ) : null}
          </div>
          {categories.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {categories.slice(0, 3).map((c) => (
                <CategoryBadge key={c} category={c} />
              ))}
            </div>
          ) : null}
        </div>
        <ChevronRight className="size-4 shrink-0 text-faint" aria-hidden />
      </InteractiveCard>
    </Link>
  )
}
