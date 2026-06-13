import type { Exercise, Workout, WorkoutExercise, WorkoutSet } from '@/types'

/** Average seconds of actual work per strength set, used for estimates. */
const WORK_SEC_PER_SET = 40
/** Fallback body weight when the user has no metrics yet. */
export const DEFAULT_BODY_WEIGHT_KG = 75
/** MET used when an exercise can't be resolved. */
const FALLBACK_MET = 5

export type ExerciseResolver = (exerciseId: string) => Exercise | undefined

/** Volume of a single set in kg (weight × reps; 0 for non-weighted work). */
export function setVolumeKg(set: WorkoutSet): number {
  if (set.weightKg == null || set.reps == null) return 0
  return set.weightKg * set.reps
}

/**
 * Training volume of a workout in kg.
 * Completed workouts count only sets marked done; planned ones count everything.
 */
export function workoutVolumeKg(workout: Workout): number {
  const doneOnly = workout.status === 'completed'
  let total = 0
  for (const ex of workout.exercises) {
    for (const set of ex.sets) {
      if (doneOnly && !set.done) continue
      total += setVolumeKg(set)
    }
  }
  return total
}

export function countSets(workout: Workout, doneOnly = false): number {
  let total = 0
  for (const ex of workout.exercises) {
    for (const set of ex.sets) {
      if (doneOnly && !set.done) continue
      total += 1
    }
  }
  return total
}

/**
 * Epley estimated one-rep max. Only meaningful for low-to-moderate rep sets,
 * so reps are capped at 12 to avoid silly extrapolations.
 */
export function epley1Rm(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg
  const capped = Math.min(reps, 12)
  return weightKg * (1 + capped / 30)
}

/** Seconds of work attributed to one exercise entry (logged time or an estimate). */
function exerciseActiveSec(entry: WorkoutExercise, exercise: Exercise | undefined, doneOnly: boolean): number {
  const sets = doneOnly ? entry.sets.filter((s) => s.done) : entry.sets
  if (sets.length === 0) return 0

  const metric = exercise?.metric ?? 'weight-reps'
  if (metric === 'duration' || metric === 'distance-duration') {
    return sets.reduce((sum, s) => sum + (s.durationSec ?? 0), 0)
  }
  // Strength work: actual lifting time plus rest between sets.
  return sets.length * (WORK_SEC_PER_SET + entry.restSec)
}

/** Estimated total length of a planned workout in seconds. */
export function estimateWorkoutDurationSec(workout: Workout, resolve: ExerciseResolver): number {
  return workout.exercises.reduce(
    (sum, entry) => sum + exerciseActiveSec(entry, resolve(entry.exerciseId), false),
    0,
  )
}

/** Real duration when recorded, otherwise an estimate from its contents. */
export function workoutDurationSec(workout: Workout, resolve: ExerciseResolver): number {
  if (workout.durationSec != null && workout.durationSec > 0) return workout.durationSec
  return estimateWorkoutDurationSec(workout, resolve)
}

/**
 * Estimated calories for a workout using per-exercise MET values:
 * kcal/min = MET × 3.5 × bodyWeightKg / 200.
 * Always an estimate — surfaced as such in the UI.
 */
export function workoutCalories(workout: Workout, resolve: ExerciseResolver, bodyWeightKg: number): number {
  const doneOnly = workout.status === 'completed'
  const weight = bodyWeightKg > 0 ? bodyWeightKg : DEFAULT_BODY_WEIGHT_KG
  let kcal = 0
  for (const entry of workout.exercises) {
    const exercise = resolve(entry.exerciseId)
    const minutes = exerciseActiveSec(entry, exercise, doneOnly) / 60
    const met = exercise?.met ?? FALLBACK_MET
    kcal += (met * 3.5 * weight * minutes) / 200
  }
  return Math.round(kcal)
}

export function workoutDistanceKm(workout: Workout): number {
  const doneOnly = workout.status === 'completed'
  let km = 0
  for (const ex of workout.exercises) {
    for (const set of ex.sets) {
      if (doneOnly && !set.done) continue
      km += set.distanceKm ?? 0
    }
  }
  return km
}

/** Minutes of cardio work in a workout (duration-based exercises only). */
export function workoutCardioMinutes(workout: Workout, resolve: ExerciseResolver): number {
  const doneOnly = workout.status === 'completed'
  let sec = 0
  for (const entry of workout.exercises) {
    const metric = resolve(entry.exerciseId)?.metric
    if (metric !== 'duration' && metric !== 'distance-duration') continue
    for (const set of entry.sets) {
      if (doneOnly && !set.done) continue
      sec += set.durationSec ?? 0
    }
  }
  return Math.round(sec / 60)
}
