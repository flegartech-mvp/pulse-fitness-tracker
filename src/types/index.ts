export type WeightUnit = 'kg' | 'lb'
export type LengthUnit = 'cm' | 'in'
export type ThemeMode = 'dark' | 'light'

export const EXERCISE_CATEGORIES = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'cardio',
  'fullbody',
] as const
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number]

/**
 * How an exercise is logged:
 * - weight-reps:        sets of weight × reps (barbell bench press)
 * - reps:               sets of reps only (push-ups, pull-ups)
 * - duration:           timed sets (plank, jump rope)
 * - distance-duration:  distance + time (running, cycling)
 */
export type ExerciseMetric = 'weight-reps' | 'reps' | 'duration' | 'distance-duration'

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  metric: ExerciseMetric
  equipment: string
  muscles: string[]
  description: string
  /** Metabolic equivalent used for calorie estimates. */
  met: number
  isCustom?: boolean
}

export interface WorkoutSet {
  id: string
  reps?: number
  weightKg?: number
  durationSec?: number
  distanceKm?: number
  done: boolean
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  restSec: number
  sets: WorkoutSet[]
}

export type WorkoutStatus = 'planned' | 'active' | 'completed'

export interface Workout {
  id: string
  name: string
  status: WorkoutStatus
  exercises: WorkoutExercise[]
  notes?: string
  /** ISO datetime the record was created. */
  createdAt: string
  /** YYYY-MM-DD date a planned workout is scheduled for. */
  scheduledFor?: string
  /** ISO datetime the session was started. */
  startedAt?: string
  /** ISO datetime the session was completed. */
  completedAt?: string
  /** Actual session length in seconds (set on completion). */
  durationSec?: number
}

export interface BodyMetric {
  id: string
  /** YYYY-MM-DD */
  date: string
  weightKg: number
  bodyFatPct?: number
  note?: string
}

export type GoalType = 'body-weight' | 'strength' | 'consistency' | 'endurance'

interface GoalBase {
  id: string
  title: string
  createdAt: string
}

export type Goal = GoalBase &
  (
    | { type: 'body-weight'; startWeightKg: number; targetWeightKg: number; targetDate?: string }
    | { type: 'strength'; exerciseId: string; startWeightKg: number; targetWeightKg: number }
    | { type: 'consistency'; sessionsPerWeek: number }
    | { type: 'endurance'; minutesPerWeek: number }
  )

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'
export type TrainingFocus = 'build-muscle' | 'lose-weight' | 'endurance' | 'general'

export interface Profile {
  name: string
  age?: number
  heightCm?: number
  activityLevel: ActivityLevel
  focus: TrainingFocus
  weightUnit: WeightUnit
  lengthUnit: LengthUnit
  theme: ThemeMode
  createdAt: string
}

/** Everything the app persists, as one versioned document. */
export interface AppData {
  version: number
  profile: Profile | null
  workouts: Workout[]
  customExercises: Exercise[]
  metrics: BodyMetric[]
  goals: Goal[]
  meta: {
    seededDemo: boolean
    welcomeDismissed: boolean
  }
}

export const APP_DATA_VERSION = 1

export function emptyAppData(): AppData {
  return {
    version: APP_DATA_VERSION,
    profile: null,
    workouts: [],
    customExercises: [],
    metrics: [],
    goals: [],
    meta: { seededDemo: false, welcomeDismissed: false },
  }
}
