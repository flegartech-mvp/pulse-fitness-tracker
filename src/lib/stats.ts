import type { BodyMetric, Exercise, ExerciseCategory, Goal, Workout } from '@/types'
import {
  epley1Rm,
  workoutCalories,
  workoutCardioMinutes,
  workoutDistanceKm,
  workoutDurationSec,
  workoutVolumeKg,
  type ExerciseResolver,
} from './calc'
import { addDays, diffDays, isoToDateKey, lastNWeekStarts, startOfWeek, todayKey } from './dates'

export function completedWorkouts(workouts: Workout[]): Workout[] {
  return workouts
    .filter((w) => w.status === 'completed' && w.completedAt)
    .sort((a, b) => (a.completedAt! < b.completedAt! ? -1 : 1))
}

/** Distinct local dates (YYYY-MM-DD) that have at least one completed workout. */
export function trainingDays(workouts: Workout[]): Set<string> {
  const days = new Set<string>()
  for (const w of workouts) {
    if (w.status === 'completed' && w.completedAt) days.add(isoToDateKey(w.completedAt))
  }
  return days
}

/**
 * Rest-day-friendly streak, carried over from the original app's 48-hour rule:
 * consecutive training days where a single rest day between sessions doesn't
 * break the chain, but two or more in a row do.
 *
 * The current streak is alive if the most recent training day is today,
 * yesterday, or two days ago ("at risk" when it's two days ago).
 */
export function currentStreak(days: Set<string>, today = todayKey()): { length: number; atRisk: boolean } {
  const sorted = [...days].sort()
  let last = sorted.length - 1
  const latest = sorted[last]
  if (!latest || diffDays(latest, today) > 2) return { length: 0, atRisk: false }

  let length = 1
  while (last > 0) {
    const gap = diffDays(sorted[last - 1]!, sorted[last]!)
    if (gap > 2) break
    length += 1
    last -= 1
  }
  return { length, atRisk: diffDays(latest, today) === 2 }
}

/** Longest streak in history under the same rest-day rule. */
export function bestStreak(days: Set<string>): number {
  const sorted = [...days].sort()
  let best = 0
  let run = 0
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || diffDays(sorted[i - 1]!, sorted[i]!) > 2) run = 1
    else run += 1
    best = Math.max(best, run)
  }
  return best
}

export interface WeekStats {
  weekStart: string
  sessions: number
  volumeKg: number
  durationSec: number
  calories: number
  cardioMinutes: number
  distanceKm: number
  setsDone: number
}

export function statsForWeek(
  workouts: Workout[],
  resolve: ExerciseResolver,
  bodyWeightKg: number,
  weekStart: string,
): WeekStats {
  const weekEnd = addDays(weekStart, 6)
  const stats: WeekStats = {
    weekStart,
    sessions: 0,
    volumeKg: 0,
    durationSec: 0,
    calories: 0,
    cardioMinutes: 0,
    distanceKm: 0,
    setsDone: 0,
  }
  for (const w of workouts) {
    if (w.status !== 'completed' || !w.completedAt) continue
    const day = isoToDateKey(w.completedAt)
    if (day < weekStart || day > weekEnd) continue
    stats.sessions += 1
    stats.volumeKg += workoutVolumeKg(w)
    stats.durationSec += workoutDurationSec(w, resolve)
    stats.calories += workoutCalories(w, resolve, bodyWeightKg)
    stats.cardioMinutes += workoutCardioMinutes(w, resolve)
    stats.distanceKm += workoutDistanceKm(w)
    for (const ex of w.exercises) stats.setsDone += ex.sets.filter((s) => s.done).length
  }
  return stats
}

/** Week-by-week stats for the last `n` weeks, oldest first. */
export function weeklyHistory(
  workouts: Workout[],
  resolve: ExerciseResolver,
  bodyWeightKg: number,
  n: number,
): WeekStats[] {
  return lastNWeekStarts(n).map((weekStart) => statsForWeek(workouts, resolve, bodyWeightKg, weekStart))
}

/** Map of dateKey → number of sets done that day (for the consistency heatmap). */
export function activityByDay(workouts: Workout[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const w of workouts) {
    if (w.status !== 'completed' || !w.completedAt) continue
    const day = isoToDateKey(w.completedAt)
    const sets = w.exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.done).length, 0)
    map.set(day, (map.get(day) ?? 0) + Math.max(1, sets))
  }
  return map
}

/** Sets per category over the trailing `days` window — used for balance and suggestions. */
export function categorySplit(
  workouts: Workout[],
  resolve: ExerciseResolver,
  days: number,
): Map<ExerciseCategory, number> {
  const cutoff = addDays(todayKey(), -days)
  const map = new Map<ExerciseCategory, number>()
  for (const w of workouts) {
    if (w.status !== 'completed' || !w.completedAt) continue
    if (isoToDateKey(w.completedAt) < cutoff) continue
    for (const entry of w.exercises) {
      const category = resolve(entry.exerciseId)?.category
      if (!category) continue
      const done = entry.sets.filter((s) => s.done).length
      if (done > 0) map.set(category, (map.get(category) ?? 0) + done)
    }
  }
  return map
}

/** Most recent date each category was trained. */
export function lastTrainedByCategory(
  workouts: Workout[],
  resolve: ExerciseResolver,
): Map<ExerciseCategory, string> {
  const map = new Map<ExerciseCategory, string>()
  for (const w of completedWorkouts(workouts)) {
    const day = isoToDateKey(w.completedAt!)
    for (const entry of w.exercises) {
      const category = resolve(entry.exerciseId)?.category
      if (category && entry.sets.some((s) => s.done)) map.set(category, day)
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// Personal records

export interface StrengthRecord {
  exerciseId: string
  bestWeightKg: number
  bestWeightReps: number
  est1RmKg: number
  date: string
  workoutId: string
}

export interface RepsRecord {
  exerciseId: string
  bestReps: number
  date: string
  workoutId: string
}

export interface CardioRecord {
  exerciseId: string
  longestDistanceKm: number
  longestDurationSec: number
  date: string
  workoutId: string
}

export interface RecordBook {
  strength: Map<string, StrengthRecord>
  reps: Map<string, RepsRecord>
  cardio: Map<string, CardioRecord>
}

export function buildRecordBook(workouts: Workout[], resolve: ExerciseResolver): RecordBook {
  const strength = new Map<string, StrengthRecord>()
  const reps = new Map<string, RepsRecord>()
  const cardio = new Map<string, CardioRecord>()

  for (const w of completedWorkouts(workouts)) {
    const date = isoToDateKey(w.completedAt!)
    for (const entry of w.exercises) {
      const exercise = resolve(entry.exerciseId)
      if (!exercise) continue
      for (const set of entry.sets) {
        if (!set.done) continue
        if (exercise.metric === 'weight-reps' && set.weightKg != null && set.reps != null && set.reps > 0) {
          const current = strength.get(exercise.id)
          const e1rm = epley1Rm(set.weightKg, set.reps)
          if (!current || e1rm > current.est1RmKg) {
            strength.set(exercise.id, {
              exerciseId: exercise.id,
              bestWeightKg: set.weightKg,
              bestWeightReps: set.reps,
              est1RmKg: e1rm,
              date,
              workoutId: w.id,
            })
          }
        } else if (exercise.metric === 'reps' && set.reps != null) {
          const current = reps.get(exercise.id)
          if (!current || set.reps > current.bestReps) {
            reps.set(exercise.id, { exerciseId: exercise.id, bestReps: set.reps, date, workoutId: w.id })
          }
        } else if (exercise.metric === 'distance-duration' || exercise.metric === 'duration') {
          const current = cardio.get(exercise.id) ?? {
            exerciseId: exercise.id,
            longestDistanceKm: 0,
            longestDurationSec: 0,
            date,
            workoutId: w.id,
          }
          let improved = false
          if ((set.distanceKm ?? 0) > current.longestDistanceKm) {
            current.longestDistanceKm = set.distanceKm ?? 0
            improved = true
          }
          if ((set.durationSec ?? 0) > current.longestDurationSec) {
            current.longestDurationSec = set.durationSec ?? 0
            improved = true
          }
          if (improved) {
            current.date = date
            current.workoutId = w.id
          }
          cardio.set(exercise.id, current)
        }
      }
    }
  }
  return { strength, reps, cardio }
}

/**
 * PRs set by one workout compared against all history before it.
 * Used for the "New PR" toasts and badges on the workout detail page.
 */
export function prsInWorkout(
  workout: Workout,
  allWorkouts: Workout[],
  resolve: ExerciseResolver,
): StrengthRecord[] {
  if (workout.status !== 'completed' || !workout.completedAt) return []
  const history = allWorkouts.filter(
    (w) =>
      w.id !== workout.id && w.status === 'completed' && w.completedAt && w.completedAt < workout.completedAt!,
  )
  const before = buildRecordBook(history, resolve)
  const after = buildRecordBook([...history, workout], resolve)
  const prs: StrengthRecord[] = []
  for (const [exerciseId, record] of after.strength) {
    const prev = before.strength.get(exerciseId)
    if (record.workoutId === workout.id && (!prev || record.est1RmKg > prev.est1RmKg)) {
      prs.push(record)
    }
  }
  return prs
}

// ---------------------------------------------------------------------------
// Body metrics

export function sortedMetrics(metrics: BodyMetric[]): BodyMetric[] {
  return [...metrics].sort((a, b) => (a.date < b.date ? -1 : 1))
}

export function latestMetric(metrics: BodyMetric[]): BodyMetric | undefined {
  return sortedMetrics(metrics).at(-1)
}

/** Change in body weight over the trailing `days` window (undefined without a baseline). */
export function weightDelta(metrics: BodyMetric[], days: number): number | undefined {
  const sorted = sortedMetrics(metrics)
  const latest = sorted.at(-1)
  if (!latest) return undefined
  const cutoff = addDays(todayKey(), -days)
  // Baseline: the last entry at or before the cutoff, or the oldest entry within range.
  let baseline: BodyMetric | undefined
  for (const m of sorted) {
    if (m.date <= cutoff) baseline = m
  }
  baseline ??= sorted[0]
  if (!baseline || baseline.id === latest.id) return undefined
  return latest.weightKg - baseline.weightKg
}

// ---------------------------------------------------------------------------
// Goal progress

export interface GoalProgress {
  /** 0..1 clamped. */
  fraction: number
  /** Short human description of where things stand. */
  label: string
  achieved: boolean
}

export function goalProgress(
  goal: Goal,
  ctx: {
    workouts: Workout[]
    metrics: BodyMetric[]
    resolve: ExerciseResolver
    exercises: Exercise[]
  },
): GoalProgress {
  switch (goal.type) {
    case 'body-weight': {
      const current = latestMetric(ctx.metrics)?.weightKg ?? goal.startWeightKg
      const total = goal.targetWeightKg - goal.startWeightKg
      if (total === 0) return { fraction: 1, label: 'Target matches start weight', achieved: true }
      const fraction = Math.min(1, Math.max(0, (current - goal.startWeightKg) / total))
      const remaining = Math.abs(goal.targetWeightKg - current)
      const achieved = total > 0 ? current >= goal.targetWeightKg : current <= goal.targetWeightKg
      return {
        fraction: achieved ? 1 : fraction,
        label: achieved ? 'Target reached' : `${remaining.toFixed(1)} kg to go`,
        achieved,
      }
    }
    case 'strength': {
      const record = buildRecordBook(ctx.workouts, ctx.resolve).strength.get(goal.exerciseId)
      const current = record?.bestWeightKg ?? goal.startWeightKg
      const total = goal.targetWeightKg - goal.startWeightKg
      const achieved = current >= goal.targetWeightKg
      const fraction =
        total <= 0 ? (achieved ? 1 : 0) : Math.min(1, Math.max(0, (current - goal.startWeightKg) / total))
      return {
        fraction: achieved ? 1 : fraction,
        label: achieved
          ? 'Target reached'
          : `Best ${current.toFixed(1)} kg of ${goal.targetWeightKg.toFixed(1)} kg`,
        achieved,
      }
    }
    case 'consistency': {
      const week = statsForWeek(ctx.workouts, ctx.resolve, 0, startOfWeek(todayKey()))
      const fraction = Math.min(1, week.sessions / goal.sessionsPerWeek)
      const achieved = week.sessions >= goal.sessionsPerWeek
      return {
        fraction,
        label: `${week.sessions} of ${goal.sessionsPerWeek} sessions this week`,
        achieved,
      }
    }
    case 'endurance': {
      const week = statsForWeek(ctx.workouts, ctx.resolve, 0, startOfWeek(todayKey()))
      const fraction = Math.min(1, week.cardioMinutes / goal.minutesPerWeek)
      const achieved = week.cardioMinutes >= goal.minutesPerWeek
      return {
        fraction,
        label: `${week.cardioMinutes} of ${goal.minutesPerWeek} cardio minutes this week`,
        achieved,
      }
    }
  }
}
