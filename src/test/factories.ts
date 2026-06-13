import type { Workout, WorkoutSet } from '@/types'
import { parseDateKey } from '@/lib/dates'

let counter = 0

export function set(partial: Partial<WorkoutSet> = {}): WorkoutSet {
  return { id: `set-${counter++}`, done: true, ...partial }
}

/** A completed strength workout on a given local date. */
export function completedWorkout(
  dateKey: string,
  exercises: Array<{ exerciseId: string; sets: WorkoutSet[]; restSec?: number }>,
  overrides: Partial<Workout> = {},
): Workout {
  const start = parseDateKey(dateKey)
  start.setHours(18, 0, 0, 0)
  const durationSec = 3600
  return {
    id: `workout-${counter++}`,
    name: 'Test Workout',
    status: 'completed',
    createdAt: start.toISOString(),
    startedAt: start.toISOString(),
    completedAt: new Date(start.getTime() + durationSec * 1000).toISOString(),
    durationSec,
    exercises: exercises.map((e, i) => ({
      id: `entry-${counter}-${i}`,
      exerciseId: e.exerciseId,
      restSec: e.restSec ?? 90,
      sets: e.sets,
    })),
    ...overrides,
  }
}
