import {
  APP_DATA_VERSION,
  EXERCISE_CATEGORIES,
  type ActivityLevel,
  type AppData,
  type BodyMetric,
  type Exercise,
  type ExerciseMetric,
  type Goal,
  type LengthUnit,
  type Profile,
  type ThemeMode,
  type TrainingFocus,
  type WeightUnit,
  type Workout,
  type WorkoutSet,
} from '@/types'

export const STORAGE_KEY = 'pulse:data'
const BACKUP_KEY = 'pulse:data:corrupt-backup'

/**
 * Persistence boundary. The app only talks to this interface, so swapping
 * localStorage for IndexedDB or a real backend later is a one-file change.
 */
export interface StorageAdapter {
  load(): AppData | null
  save(data: AppData): void
  clear(): void
}

const EXERCISE_METRICS: ExerciseMetric[] = ['weight-reps', 'reps', 'duration', 'distance-duration']
const WORKOUT_STATUSES: Workout['status'][] = ['planned', 'active', 'completed']
const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'athlete']
const TRAINING_FOCI: TrainingFocus[] = ['build-muscle', 'lose-weight', 'endurance', 'general']
const WEIGHT_UNITS: WeightUnit[] = ['kg', 'lb']
const LENGTH_UNITS: LengthUnit[] = ['cm', 'in']
const THEMES: ThemeMode[] = ['dark', 'light']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function optionalString(value: unknown): string | undefined {
  return isString(value) && value.trim() ? value : undefined
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return isString(value) && allowed.includes(value as T) ? (value as T) : undefined
}

function parseSet(value: unknown): WorkoutSet | null {
  if (!isRecord(value) || !isString(value.id)) return null
  return {
    id: value.id,
    reps: finiteNumber(value.reps),
    weightKg: finiteNumber(value.weightKg),
    durationSec: finiteNumber(value.durationSec),
    distanceKm: finiteNumber(value.distanceKm),
    done: bool(value.done),
  }
}

function parseExercise(value: unknown): Exercise | null {
  if (!isRecord(value)) return null
  const category = enumValue(value.category, EXERCISE_CATEGORIES)
  const metric = enumValue(value.metric, EXERCISE_METRICS)
  const met = finiteNumber(value.met)
  if (!isString(value.id) || !isString(value.name) || !category || !metric || !isString(value.equipment) || met == null) {
    return null
  }
  return {
    id: value.id,
    name: value.name,
    category,
    metric,
    equipment: value.equipment,
    muscles: Array.isArray(value.muscles) ? value.muscles.filter(isString) : [],
    description: isString(value.description) ? value.description : '',
    met,
    isCustom: bool(value.isCustom),
  }
}

function parseWorkout(value: unknown): Workout | null {
  if (!isRecord(value)) return null
  const status = enumValue(value.status, WORKOUT_STATUSES)
  if (!isString(value.id) || !isString(value.name) || !status || !isString(value.createdAt) || !Array.isArray(value.exercises)) {
    return null
  }
  const exercises = value.exercises
    .filter(isRecord)
    .map((entry) => ({
      id: isString(entry.id) ? entry.id : '',
      exerciseId: isString(entry.exerciseId) ? entry.exerciseId : '',
      restSec: finiteNumber(entry.restSec) ?? 0,
      sets: Array.isArray(entry.sets) ? entry.sets.map(parseSet).filter((set): set is WorkoutSet => set !== null) : [],
    }))
    .filter((entry) => entry.id && entry.exerciseId)
  return {
    id: value.id,
    name: value.name,
    status,
    exercises,
    notes: optionalString(value.notes),
    createdAt: value.createdAt,
    scheduledFor: optionalString(value.scheduledFor),
    startedAt: optionalString(value.startedAt),
    completedAt: optionalString(value.completedAt),
    durationSec: finiteNumber(value.durationSec),
  }
}

function parseProfile(value: unknown): Profile | null {
  if (!isRecord(value) || !isString(value.name) || !isString(value.createdAt)) return null
  const activityLevel = enumValue(value.activityLevel, ACTIVITY_LEVELS)
  const focus = enumValue(value.focus, TRAINING_FOCI)
  const weightUnit = enumValue(value.weightUnit, WEIGHT_UNITS)
  const lengthUnit = enumValue(value.lengthUnit, LENGTH_UNITS)
  const theme = enumValue(value.theme, THEMES)
  if (!activityLevel || !focus || !weightUnit || !lengthUnit || !theme) return null
  return {
    name: value.name,
    age: finiteNumber(value.age),
    heightCm: finiteNumber(value.heightCm),
    activityLevel,
    focus,
    weightUnit,
    lengthUnit,
    theme,
    createdAt: value.createdAt,
  }
}

function parseGoal(value: unknown): Goal | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.title) || !isString(value.createdAt) || !isString(value.type)) {
    return null
  }
  const base = { id: value.id, title: value.title, createdAt: value.createdAt }
  if (value.type === 'body-weight') {
    const startWeightKg = finiteNumber(value.startWeightKg)
    const targetWeightKg = finiteNumber(value.targetWeightKg)
    if (startWeightKg == null || targetWeightKg == null) return null
    return { ...base, type: 'body-weight', startWeightKg, targetWeightKg, targetDate: optionalString(value.targetDate) }
  }
  if (value.type === 'strength') {
    const startWeightKg = finiteNumber(value.startWeightKg)
    const targetWeightKg = finiteNumber(value.targetWeightKg)
    if (!isString(value.exerciseId) || startWeightKg == null || targetWeightKg == null) return null
    return { ...base, type: 'strength', exerciseId: value.exerciseId, startWeightKg, targetWeightKg }
  }
  if (value.type === 'consistency') {
    const sessionsPerWeek = finiteNumber(value.sessionsPerWeek)
    return sessionsPerWeek == null ? null : { ...base, type: 'consistency', sessionsPerWeek }
  }
  if (value.type === 'endurance') {
    const minutesPerWeek = finiteNumber(value.minutesPerWeek)
    return minutesPerWeek == null ? null : { ...base, type: 'endurance', minutesPerWeek }
  }
  return null
}

/** Hook for future schema upgrades; currently a no-op at version 1. */
function migrate(data: AppData): AppData {
  if (data.version === APP_DATA_VERSION) return data
  return { ...data, version: APP_DATA_VERSION }
}

export function normalizeAppData(value: unknown): AppData {
  if (!isRecord(value)) throw new Error('Export file is not a Pulse data object.')
  if (
    typeof value.version !== 'number' ||
    !Array.isArray(value.workouts) ||
    !Array.isArray(value.metrics) ||
    !Array.isArray(value.goals) ||
    !Array.isArray(value.customExercises)
  ) {
    throw new Error('Export file is missing required Pulse data fields.')
  }

  const metrics: BodyMetric[] = []
  for (const metric of value.metrics) {
    if (!isRecord(metric)) continue
    const weightKg = finiteNumber(metric.weightKg)
    if (!isString(metric.id) || !isString(metric.date) || weightKg == null) continue
    const next: BodyMetric = { id: metric.id, date: metric.date, weightKg }
    const bodyFatPct = finiteNumber(metric.bodyFatPct)
    const note = optionalString(metric.note)
    if (bodyFatPct != null) next.bodyFatPct = bodyFatPct
    if (note) next.note = note
    metrics.push(next)
  }

  const meta = isRecord(value.meta) ? value.meta : {}
  return migrate({
    version: value.version,
    profile: parseProfile(value.profile),
    workouts: value.workouts.map(parseWorkout).filter((workout): workout is Workout => workout !== null),
    customExercises: value.customExercises
      .map(parseExercise)
      .filter((exercise): exercise is Exercise => exercise !== null && Boolean(exercise.isCustom)),
    metrics,
    goals: value.goals.map(parseGoal).filter((goal): goal is Goal => goal !== null),
    meta: {
      seededDemo: bool(meta.seededDemo),
      welcomeDismissed: bool(meta.welcomeDismissed),
    },
  })
}

export function parseAppDataJson(json: string): AppData {
  try {
    return normalizeAppData(JSON.parse(json))
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Export file could not be read.', { cause: error })
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  load(): AppData | null {
    let raw: string | null
    try {
      raw = localStorage.getItem(STORAGE_KEY)
    } catch {
      return null // storage unavailable (private mode, blocked)
    }
    if (!raw) return null
    try {
      return normalizeAppData(JSON.parse(raw))
    } catch {
      // Keep the corrupt blob around for manual recovery instead of silently losing it.
      try {
        localStorage.setItem(BACKUP_KEY, raw)
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* best effort */
      }
      return null
    }
  }

  save(data: AppData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Quota exceeded or storage blocked — the in-memory copy keeps the session alive.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
}

/** Used by tests and available as a fallback when localStorage is blocked. */
export class MemoryAdapter implements StorageAdapter {
  private data: AppData | null = null
  load(): AppData | null {
    return this.data ? structuredClone(this.data) : null
  }
  save(data: AppData): void {
    this.data = structuredClone(data)
  }
  clear(): void {
    this.data = null
  }
}

export function exportFileName(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `pulse-export-${y}${m}${d}.json`
}
