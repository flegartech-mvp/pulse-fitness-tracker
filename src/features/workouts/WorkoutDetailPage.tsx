import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, Clock, Copy, Dumbbell, Flame, Layers, MapPin, Pencil, Play, Trash2, Trophy } from 'lucide-react'
import { useAppData, useProfile } from '@/state/AppDataContext'
import { useWorkoutActions } from './useWorkoutActions'
import {
  countSets,
  workoutCalories,
  workoutDistanceKm,
  workoutDurationSec,
  workoutVolumeKg,
} from '@/lib/calc'
import { prsInWorkout } from '@/lib/stats'
import { formatDuration, formatVolume, formatClock } from '@/lib/format'
import { formatRelativeDay, formatTime, isoToDateKey } from '@/lib/dates'
import { formatDistance, formatWeight } from '@/lib/units'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CategoryBadge, Pill } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import type { WorkoutSet, Exercise } from '@/types'

function setSummary(set: WorkoutSet, exercise: Exercise, weightUnit: 'kg' | 'lb', lengthUnit: 'cm' | 'in'): string {
  switch (exercise.metric) {
    case 'weight-reps':
      return `${set.weightKg != null ? formatWeight(set.weightKg, weightUnit) : '—'} × ${set.reps ?? '—'}`
    case 'reps':
      return `${set.reps ?? '—'} reps`
    case 'duration':
      return set.durationSec != null ? formatClock(set.durationSec) : '—'
    case 'distance-duration': {
      const parts: string[] = []
      if (set.distanceKm != null) parts.push(formatDistance(set.distanceKm, lengthUnit))
      if (set.durationSec != null) parts.push(formatClock(set.durationSec))
      return parts.join(' in ') || '—'
    }
  }
}

export default function WorkoutDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, resolveExercise, bodyWeightKg } = useAppData()
  const profile = useProfile()
  const { startWorkout, repeatWorkout, removeWorkout } = useWorkoutActions()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const workout = data.workouts.find((w) => w.id === id)

  const prExercises = useMemo(() => {
    if (!workout || workout.status !== 'completed') return new Set<string>()
    return new Set(prsInWorkout(workout, data.workouts, resolveExercise).map((pr) => pr.exerciseId))
  }, [workout, data.workouts, resolveExercise])

  if (!workout) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Workout not found"
        body="It may have been deleted."
        action={
          <Link to="/workouts">
            <Button>Back to workouts</Button>
          </Link>
        }
      />
    )
  }

  const completed = workout.status === 'completed'
  const volume = workoutVolumeKg(workout)
  const duration = workoutDurationSec(workout, resolveExercise)
  const calories = workoutCalories(workout, resolveExercise, bodyWeightKg)
  const distance = workoutDistanceKm(workout)
  const sets = countSets(workout, completed)

  const dateLine = completed && workout.completedAt
    ? `${formatRelativeDay(isoToDateKey(workout.completedAt))} · finished ${formatTime(workout.completedAt)}`
    : workout.scheduledFor
      ? `Planned for ${formatRelativeDay(workout.scheduledFor).toLowerCase()}`
      : 'Not scheduled'

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{workout.name}</h1>
            {workout.status === 'planned' ? <Pill tone="accent">Planned</Pill> : null}
            {workout.status === 'active' ? <Pill tone="warning">In progress</Pill> : null}
            {completed ? <Pill tone="success">Completed</Pill> : null}
          </div>
          <p className="mt-1 text-sm text-soft">{dateLine}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {workout.status === 'planned' ? (
            <>
              <Button variant="primary" onClick={() => startWorkout(workout.id)}>
                <Play className="size-4 fill-current" aria-hidden />
                Start
              </Button>
              <Link to={`/workouts/${workout.id}/edit`}>
                <Button>
                  <Pencil className="size-4" aria-hidden />
                  Edit
                </Button>
              </Link>
            </>
          ) : null}
          {workout.status === 'active' ? (
            <Button variant="primary" onClick={() => startWorkout(workout.id)}>
              <Play className="size-4 fill-current" aria-hidden />
              Resume
            </Button>
          ) : null}
          {completed ? (
            <>
              <Button variant="primary" onClick={() => repeatWorkout(workout)}>
                <Copy className="size-4" aria-hidden />
                Repeat
              </Button>
              <Link to={`/workouts/${workout.id}/edit`}>
                <Button>
                  <Pencil className="size-4" aria-hidden />
                  Edit
                </Button>
              </Link>
            </>
          ) : null}
          <Button variant="danger-soft" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" aria-hidden />
            Delete
          </Button>
        </div>
      </div>

      <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs text-soft">
            <Clock className="size-3.5" aria-hidden /> Duration
          </p>
          <p className="tnum mt-1 text-lg font-bold text-ink">{formatDuration(duration)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs text-soft">
            <Layers className="size-3.5" aria-hidden /> Sets
          </p>
          <p className="tnum mt-1 text-lg font-bold text-ink">{sets}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs text-soft">
            <Dumbbell className="size-3.5" aria-hidden /> Volume
          </p>
          <p className="tnum mt-1 text-lg font-bold text-ink">
            {volume > 0 ? formatVolume(volume, profile.weightUnit) : '—'}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs text-soft">
            <Flame className="size-3.5" aria-hidden /> Calories
          </p>
          <p className="tnum mt-1 text-lg font-bold text-ink">~{calories}</p>
        </div>
        {distance > 0 ? (
          <div className="col-span-2 border-t border-edge pt-3 sm:col-span-4">
            <p className="flex items-center gap-1.5 text-xs text-soft">
              <MapPin className="size-3.5" aria-hidden /> Distance
            </p>
            <p className="tnum mt-1 text-lg font-bold text-ink">{formatDistance(distance, profile.lengthUnit)}</p>
          </div>
        ) : null}
      </Card>

      {workout.notes ? (
        <Card className="mt-4 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-faint">Notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-soft">{workout.notes}</p>
        </Card>
      ) : null}

      <div className="mt-4 space-y-4">
        {workout.exercises.map((entry) => {
          const exercise = resolveExercise(entry.exerciseId)
          if (!exercise) return null
          const isPr = prExercises.has(exercise.id)
          return (
            <Card key={entry.id} className="p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-ink">{exercise.name}</h3>
                  {isPr ? (
                    <Pill tone="accent">
                      <Trophy className="size-3" aria-hidden /> PR
                    </Pill>
                  ) : null}
                </div>
                <CategoryBadge category={exercise.category} />
              </div>
              <ul className="mt-3 space-y-1">
                {entry.sets.map((set, i) => (
                  <li
                    key={set.id}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm odd:bg-raised/60"
                  >
                    <span className="tnum flex items-center gap-3">
                      <span className="w-5 text-xs font-semibold text-faint">{i + 1}</span>
                      <span className={completed && !set.done ? 'text-faint line-through' : 'text-ink'}>
                        {setSummary(set, exercise, profile.weightUnit, profile.lengthUnit)}
                      </span>
                    </span>
                    {set.done ? (
                      <Check className="size-4 text-success" aria-label="Completed" />
                    ) : completed ? (
                      <span className="text-[10px] font-medium uppercase text-faint">skipped</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this workout?"
        body={
          completed
            ? 'This removes the session and its sets from your history and stats. This cannot be undone.'
            : 'This removes the planned workout. This cannot be undone.'
        }
        confirmLabel="Delete workout"
        danger
        onConfirm={() => {
          setConfirmDelete(false)
          removeWorkout(workout.id)
          navigate('/workouts')
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
