import type { AppData, BodyMetric, Goal, Profile, Workout, WorkoutExercise, WorkoutSet } from '@/types'
import { APP_DATA_VERSION } from '@/types'
import { addDays, parseDateKey, todayKey } from '@/lib/dates'

/**
 * Deterministic, realistic demo dataset generated relative to "today":
 * ~10 weeks of a push/pull/legs + cardio split with progressive overload,
 * a gently trending body weight log, three goals, and a planned session
 * for today so the dashboard has something to start.
 */

// Small seeded PRNG (mulberry32) so the demo is identical on every run.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface PlanExercise {
  exerciseId: string
  sets: number
  reps: [min: number, max: number]
  /** Starting working weight in kg; 0 for bodyweight. */
  startKg: number
  /** Total kg added across the whole demo period. */
  totalGainKg: number
  restSec: number
}

interface PlanDay {
  name: string
  exercises: PlanExercise[]
  cardio?: { exerciseId: string; minutes: [number, number]; km?: [number, number] }
}

const PUSH: PlanDay = {
  name: 'Push Day',
  exercises: [
    { exerciseId: 'ex-bench-press', sets: 4, reps: [6, 9], startKg: 70, totalGainKg: 7.5, restSec: 150 },
    { exerciseId: 'ex-incline-db-press', sets: 3, reps: [8, 11], startKg: 26, totalGainKg: 4, restSec: 120 },
    { exerciseId: 'ex-overhead-press', sets: 3, reps: [6, 9], startKg: 42.5, totalGainKg: 5, restSec: 150 },
    { exerciseId: 'ex-lateral-raise', sets: 3, reps: [12, 15], startKg: 10, totalGainKg: 2, restSec: 90 },
    { exerciseId: 'ex-triceps-pushdown', sets: 3, reps: [10, 14], startKg: 25, totalGainKg: 5, restSec: 90 },
  ],
}

const PULL: PlanDay = {
  name: 'Pull Day',
  exercises: [
    { exerciseId: 'ex-deadlift', sets: 3, reps: [4, 6], startKg: 120, totalGainKg: 15, restSec: 180 },
    { exerciseId: 'ex-pull-up', sets: 3, reps: [6, 10], startKg: 0, totalGainKg: 0, restSec: 120 },
    { exerciseId: 'ex-lat-pulldown', sets: 3, reps: [9, 12], startKg: 55, totalGainKg: 7.5, restSec: 120 },
    { exerciseId: 'ex-barbell-curl', sets: 3, reps: [8, 12], startKg: 27.5, totalGainKg: 5, restSec: 90 },
    { exerciseId: 'ex-face-pull', sets: 3, reps: [12, 16], startKg: 18, totalGainKg: 4, restSec: 75 },
  ],
}

const LEGS: PlanDay = {
  name: 'Leg Day',
  exercises: [
    { exerciseId: 'ex-back-squat', sets: 4, reps: [5, 8], startKg: 95, totalGainKg: 12.5, restSec: 180 },
    { exerciseId: 'ex-romanian-deadlift', sets: 3, reps: [8, 10], startKg: 80, totalGainKg: 10, restSec: 150 },
    { exerciseId: 'ex-leg-press', sets: 3, reps: [9, 12], startKg: 160, totalGainKg: 20, restSec: 120 },
    { exerciseId: 'ex-leg-curl', sets: 3, reps: [10, 13], startKg: 40, totalGainKg: 5, restSec: 90 },
    { exerciseId: 'ex-calf-raise', sets: 4, reps: [10, 14], startKg: 60, totalGainKg: 10, restSec: 75 },
  ],
}

const CONDITIONING: PlanDay = {
  name: 'Cardio & Core',
  exercises: [
    { exerciseId: 'ex-plank', sets: 3, reps: [0, 0], startKg: 0, totalGainKg: 0, restSec: 60 },
    { exerciseId: 'ex-hanging-leg-raise', sets: 3, reps: [8, 12], startKg: 0, totalGainKg: 0, restSec: 75 },
  ],
  cardio: { exerciseId: 'ex-running', minutes: [26, 36], km: [4.4, 6.2] },
}

/** Weekly schedule as day-of-week offsets from Monday. */
const SCHEDULE: Array<{ dow: number; day: PlanDay }> = [
  { dow: 0, day: PUSH }, // Monday
  { dow: 1, day: PULL }, // Tuesday
  { dow: 3, day: LEGS }, // Thursday
  { dow: 5, day: CONDITIONING }, // Saturday
]

const DEMO_WEEKS = 10
const SKIP_RATE = 0.12

function roundToPlate(kg: number): number {
  return Math.round(kg / 2.5) * 2.5
}

function buildSets(
  rng: () => number,
  plan: PlanExercise,
  progress: number,
  idPrefix: string,
): WorkoutSet[] {
  const sets: WorkoutSet[] = []
  // Linear progression with a mild deload dip around week 6 and small noise.
  const deload = progress > 0.55 && progress < 0.65 ? -0.06 : 0
  const weight =
    plan.startKg === 0 ? undefined : roundToPlate(plan.startKg + plan.totalGainKg * (progress + deload))
  for (let i = 0; i < plan.sets; i++) {
    const isPlank = plan.exerciseId === 'ex-plank'
    const baseReps = plan.reps[0] + Math.round(rng() * (plan.reps[1] - plan.reps[0]))
    // Final set often loses a rep or two as fatigue sets in.
    const fatigue = i === plan.sets - 1 && rng() < 0.5 ? -1 : 0
    sets.push({
      id: `${idPrefix}-s${i}`,
      done: true,
      ...(isPlank
        ? { durationSec: 45 + Math.round(progress * 35) + Math.round(rng() * 15) }
        : {
            reps: Math.max(1, baseReps + fatigue),
            ...(weight != null ? { weightKg: weight } : {}),
          }),
    })
  }
  return sets
}

function buildWorkout(
  rng: () => number,
  day: PlanDay,
  dateKey: string,
  progress: number,
  index: number,
): Workout {
  const exercises: WorkoutExercise[] = day.exercises.map((plan, i) => ({
    id: `demo-w${index}-e${i}`,
    exerciseId: plan.exerciseId,
    restSec: plan.restSec,
    sets: buildSets(rng, plan, progress, `demo-w${index}-e${i}`),
  }))

  if (day.cardio) {
    const minutes = day.cardio.minutes[0] + rng() * (day.cardio.minutes[1] - day.cardio.minutes[0])
    const durationSec = Math.round(minutes * 60)
    const km = day.cardio.km
      ? Math.round((day.cardio.km[0] + progress * (day.cardio.km[1] - day.cardio.km[0]) + rng() * 0.4) * 100) /
        100
      : undefined
    exercises.push({
      id: `demo-w${index}-cardio`,
      exerciseId: day.cardio.exerciseId,
      restSec: 0,
      sets: [
        {
          id: `demo-w${index}-cardio-s0`,
          done: true,
          durationSec,
          ...(km != null ? { distanceKm: km } : {}),
        },
      ],
    })
  }

  // Evening sessions with a little variance.
  const start = parseDateKey(dateKey)
  start.setHours(17, 30 + Math.round(rng() * 80), 0, 0)
  const durationSec = Math.round((48 + rng() * 22) * 60)
  const end = new Date(start.getTime() + durationSec * 1000)

  return {
    id: `demo-workout-${index}`,
    name: day.name,
    status: 'completed',
    exercises,
    createdAt: start.toISOString(),
    scheduledFor: dateKey,
    startedAt: start.toISOString(),
    completedAt: end.toISOString(),
    durationSec,
  }
}

function buildPlannedForToday(today: string, lastPush: Workout | undefined): Workout {
  // Next session in the rotation, pre-filled from the most recent push day.
  const source = lastPush ?? buildWorkout(mulberry32(7), PUSH, today, 1, 9999)
  const exercises: WorkoutExercise[] = source.exercises.map((entry, i) => ({
    id: `planned-e${i}`,
    exerciseId: entry.exerciseId,
    restSec: entry.restSec,
    sets: entry.sets.map((s, j) => ({
      id: `planned-e${i}-s${j}`,
      reps: s.reps,
      weightKg: s.weightKg,
      durationSec: s.durationSec,
      distanceKm: s.distanceKm,
      done: false,
    })),
  }))
  return {
    id: 'demo-planned-today',
    name: 'Push Day',
    status: 'planned',
    exercises,
    notes: 'Aim to add one rep on the top bench set.',
    createdAt: new Date().toISOString(),
    scheduledFor: today,
  }
}

export function buildDemoData(): AppData {
  const rng = mulberry32(20260612)
  const today = todayKey()

  // Anchor the history to the Monday DEMO_WEEKS ago.
  const todayDate = parseDateKey(today)
  const mondayOffset = (todayDate.getDay() + 6) % 7
  const thisMonday = addDays(today, -mondayOffset)
  const firstMonday = addDays(thisMonday, -7 * (DEMO_WEEKS - 1))

  const workouts: Workout[] = []
  let index = 0
  for (let week = 0; week < DEMO_WEEKS; week++) {
    for (const slot of SCHEDULE) {
      const dateKey = addDays(firstMonday, week * 7 + slot.dow)
      if (dateKey >= today) continue // history only
      if (rng() < SKIP_RATE) continue // life happens
      const progress = week / Math.max(1, DEMO_WEEKS - 1)
      workouts.push(buildWorkout(rng, slot.day, dateKey, progress, index++))
    }
  }

  const lastPush = [...workouts].reverse().find((w) => w.name === 'Push Day')
  workouts.push(buildPlannedForToday(today, lastPush))

  // Body weight: 84.6 → ~81.8 kg with noise, logged every 2–4 days.
  const metrics: BodyMetric[] = []
  const startWeight = 84.6
  const endWeight = 81.8
  const totalDays = DEMO_WEEKS * 7
  let cursor = 0
  let mIndex = 0
  while (cursor < totalDays - 1) {
    const dateKey = addDays(firstMonday, cursor)
    if (dateKey >= today) break
    const progress = cursor / totalDays
    const weight = startWeight + (endWeight - startWeight) * progress + (rng() - 0.5) * 0.6
    metrics.push({
      id: `demo-metric-${mIndex++}`,
      date: dateKey,
      weightKg: Math.round(weight * 10) / 10,
      ...(mIndex % 4 === 0 ? { bodyFatPct: Math.round((19.5 - 1.8 * progress + (rng() - 0.5) * 0.6) * 10) / 10 } : {}),
    })
    cursor += 2 + Math.round(rng() * 2)
  }

  const createdAt = parseDateKey(firstMonday).toISOString()
  const goals: Goal[] = [
    {
      id: 'demo-goal-weight',
      type: 'body-weight',
      title: 'Cut to 80 kg',
      startWeightKg: startWeight,
      targetWeightKg: 80,
      targetDate: addDays(today, 42),
      createdAt,
    },
    {
      id: 'demo-goal-bench',
      type: 'strength',
      title: 'Bench press 100 kg',
      exerciseId: 'ex-bench-press',
      startWeightKg: 70,
      targetWeightKg: 100,
      createdAt,
    },
    {
      id: 'demo-goal-consistency',
      type: 'consistency',
      title: 'Train 4× a week',
      sessionsPerWeek: 4,
      createdAt,
    },
  ]

  const profile: Profile = {
    name: 'Alex',
    age: 29,
    heightCm: 180,
    activityLevel: 'moderate',
    focus: 'build-muscle',
    weightUnit: 'kg',
    lengthUnit: 'cm',
    theme: 'dark',
    createdAt,
  }

  return {
    version: APP_DATA_VERSION,
    profile,
    workouts,
    customExercises: [],
    metrics,
    goals,
    meta: { seededDemo: true, welcomeDismissed: false },
  }
}
