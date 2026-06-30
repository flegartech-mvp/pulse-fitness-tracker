import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, BodyMetric, Exercise, Goal, Profile, Workout } from '@/types'
import { emptyAppData } from '@/types'
import { LocalStorageAdapter, type StorageAdapter } from '@/lib/storage'
import { buildDemoData } from '@/data/demoData'
import { EXERCISE_LIBRARY } from '@/data/exerciseLibrary'
import { latestMetric } from '@/lib/stats'
import { DEFAULT_BODY_WEIGHT_KG } from '@/lib/calc'

export interface AppDataApi {
  data: AppData
  /** Built-in library plus the user's custom exercises, alphabetical. */
  exercises: Exercise[]
  resolveExercise: (id: string) => Exercise | undefined
  /** Latest logged body weight, falling back to a sensible default for estimates. */
  bodyWeightKg: number

  updateProfile: (patch: Partial<Profile>) => void

  addWorkout: (workout: Workout) => void
  updateWorkout: (id: string, updater: (w: Workout) => Workout) => void
  deleteWorkout: (id: string) => void

  addMetric: (metric: BodyMetric) => void
  deleteMetric: (id: string) => void

  addGoal: (goal: Goal) => void
  updateGoal: (id: string, updater: (g: Goal) => Goal) => void
  deleteGoal: (id: string) => void

  addCustomExercise: (exercise: Exercise) => void
  /** Returns false (and does nothing) when workouts still reference the exercise. */
  deleteCustomExercise: (id: string) => boolean

  loadDemoData: () => void
  clearAllData: () => void
  replaceData: (next: AppData) => void
  exportJson: () => string
  dismissWelcome: () => void
}

const AppDataContext = createContext<AppDataApi | null>(null)

function defaultProfile(): Profile {
  return {
    name: 'Athlete',
    activityLevel: 'moderate',
    focus: 'general',
    weightUnit: 'kg',
    lengthUnit: 'cm',
    theme: 'dark',
    createdAt: new Date().toISOString(),
  }
}

export function AppDataProvider({
  children,
  adapter,
  initialData,
}: {
  children: ReactNode
  adapter?: StorageAdapter
  /** Test seam — bypasses the adapter for the initial state. */
  initialData?: AppData
}) {
  const [storage] = useState<StorageAdapter>(() => adapter ?? new LocalStorageAdapter())
  const [data, setData] = useState<AppData>(() => {
    if (initialData) return initialData
    const stored = storage.load()
    if (stored) return stored
    // First run: seed the demo dataset so the product is alive immediately.
    const demo = buildDemoData()
    storage.save(demo)
    return demo
  })

  const update = useCallback(
    (mutate: (d: AppData) => AppData) => {
      setData((prev) => {
        const next = mutate(prev)
        storage.save(next)
        return next
      })
    },
    [storage],
  )

  // Keep the document theme class in sync with the profile setting.
  const theme = data.profile?.theme ?? 'dark'
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const exercises = useMemo(() => {
    return [...EXERCISE_LIBRARY, ...data.customExercises].sort((a, b) => a.name.localeCompare(b.name))
  }, [data.customExercises])

  const exerciseIndex = useMemo(() => {
    const map = new Map<string, Exercise>()
    for (const e of exercises) map.set(e.id, e)
    return map
  }, [exercises])

  const resolveExercise = useCallback((id: string) => exerciseIndex.get(id), [exerciseIndex])

  const bodyWeightKg = latestMetric(data.metrics)?.weightKg ?? DEFAULT_BODY_WEIGHT_KG

  const api = useMemo<AppDataApi>(
    () => ({
      data,
      exercises,
      resolveExercise,
      bodyWeightKg,

      updateProfile: (patch) =>
        update((d) => ({ ...d, profile: { ...(d.profile ?? defaultProfile()), ...patch } })),

      addWorkout: (workout) => update((d) => ({ ...d, workouts: [...d.workouts, workout] })),
      updateWorkout: (id, updater) =>
        update((d) => ({ ...d, workouts: d.workouts.map((w) => (w.id === id ? updater(w) : w)) })),
      deleteWorkout: (id) => update((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) })),

      addMetric: (metric) =>
        update((d) => ({
          // One entry per day: replace an existing entry for the same date.
          ...d,
          metrics: [...d.metrics.filter((m) => m.date !== metric.date), metric],
        })),
      deleteMetric: (id) => update((d) => ({ ...d, metrics: d.metrics.filter((m) => m.id !== id) })),

      addGoal: (goal) => update((d) => ({ ...d, goals: [...d.goals, goal] })),
      updateGoal: (id, updater) =>
        update((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? updater(g) : g)) })),
      deleteGoal: (id) => update((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) })),

      addCustomExercise: (exercise) =>
        update((d) => ({ ...d, customExercises: [...d.customExercises, exercise] })),
      deleteCustomExercise: (id) => {
        const inUse = data.workouts.some((w) => w.exercises.some((e) => e.exerciseId === id))
        if (inUse) return false
        update((d) => ({ ...d, customExercises: d.customExercises.filter((e) => e.id !== id) }))
        return true
      },

      loadDemoData: () => update(() => buildDemoData()),
      clearAllData: () =>
        update((d) => ({
          ...emptyAppData(),
          profile: { ...(d.profile ?? defaultProfile()) },
          meta: { seededDemo: false, welcomeDismissed: true },
        })),
      replaceData: (next) => update(() => next),
      exportJson: () => JSON.stringify(data, null, 2),
      dismissWelcome: () => update((d) => ({ ...d, meta: { ...d.meta, welcomeDismissed: true } })),
    }),
    [data, exercises, resolveExercise, bodyWeightKg, update],
  )

  return <AppDataContext.Provider value={api}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataApi {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used inside <AppDataProvider>')
  return ctx
}

/** The user profile with defaults applied — pages can rely on it existing. */
export function useProfile(): Profile {
  const { data } = useAppData()
  return data.profile ?? defaultProfile()
}
