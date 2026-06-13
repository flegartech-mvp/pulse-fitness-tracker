import { describe, expect, it } from 'vitest'
import {
  bestStreak,
  buildRecordBook,
  currentStreak,
  goalProgress,
  prsInWorkout,
  statsForWeek,
  trainingDays,
  weightDelta,
} from '@/lib/stats'
import { addDays, startOfWeek, todayKey } from '@/lib/dates'
import { EXERCISE_LIBRARY } from '@/data/exerciseLibrary'
import { completedWorkout, set } from '@/test/factories'
import type { BodyMetric, Goal } from '@/types'

const resolve = (id: string) => EXERCISE_LIBRARY.find((e) => e.id === id)
const today = todayKey()

function bench(dateKey: string, weightKg: number, reps = 5) {
  return completedWorkout(dateKey, [{ exerciseId: 'ex-bench-press', sets: [set({ weightKg, reps })] }])
}

describe('streaks (rest-day-friendly 48h rule)', () => {
  it('is zero with no training', () => {
    expect(currentStreak(new Set())).toEqual({ length: 0, atRisk: false })
  })

  it('counts consecutive training days', () => {
    const days = new Set([addDays(today, -2), addDays(today, -1), today])
    expect(currentStreak(days)).toEqual({ length: 3, atRisk: false })
  })

  it('survives a single rest day between sessions', () => {
    const days = new Set([addDays(today, -4), addDays(today, -2), today])
    expect(currentStreak(days).length).toBe(3)
  })

  it('breaks after two consecutive rest days', () => {
    const days = new Set([addDays(today, -6), addDays(today, -5), addDays(today, -1)])
    expect(currentStreak(days).length).toBe(1)
  })

  it('is dead when the last session was 3+ days ago', () => {
    const days = new Set([addDays(today, -3)])
    expect(currentStreak(days).length).toBe(0)
  })

  it('flags at-risk when the last session was exactly 2 days ago', () => {
    const days = new Set([addDays(today, -2)])
    expect(currentStreak(days)).toEqual({ length: 1, atRisk: true })
  })

  it('finds the best historical streak', () => {
    const days = new Set([
      // streak of 3 (with one rest gap)
      addDays(today, -30),
      addDays(today, -28),
      addDays(today, -27),
      // long break, then 2
      addDays(today, -10),
      addDays(today, -9),
    ])
    expect(bestStreak(days)).toBe(3)
  })

  it('derives training days from completed workouts only', () => {
    const done = bench(addDays(today, -1), 80)
    const planned = { ...bench(today, 80), status: 'planned' as const, completedAt: undefined }
    expect([...trainingDays([done, planned])]).toEqual([addDays(today, -1)])
  })
})

describe('weekly stats', () => {
  it('only counts workouts inside the week window', () => {
    const weekStart = startOfWeek(today)
    const inWeek = bench(weekStart, 100, 5)
    const before = bench(addDays(weekStart, -1), 100, 5)
    const stats = statsForWeek([inWeek, before], resolve, 75, weekStart)
    expect(stats.sessions).toBe(1)
    expect(stats.volumeKg).toBe(500)
    expect(stats.durationSec).toBe(3600)
    expect(stats.calories).toBeGreaterThan(0)
  })
})

describe('records', () => {
  it('tracks the best estimated 1RM per exercise', () => {
    const workouts = [bench(addDays(today, -20), 80, 5), bench(addDays(today, -10), 85, 3), bench(addDays(today, -5), 82.5, 8)]
    const book = buildRecordBook(workouts, resolve)
    const record = book.strength.get('ex-bench-press')
    // 82.5×8 → e1RM 104.5 beats 85×3 → 93.5
    expect(record?.bestWeightKg).toBe(82.5)
    expect(record?.bestWeightReps).toBe(8)
  })

  it('detects PRs set by a specific workout', () => {
    const history = [bench(addDays(today, -20), 80, 5)]
    const prWorkout = bench(addDays(today, -1), 90, 5)
    const prs = prsInWorkout(prWorkout, [...history, prWorkout], resolve)
    expect(prs).toHaveLength(1)
    expect(prs[0]?.bestWeightKg).toBe(90)

    const weakWorkout = bench(today, 60, 5)
    expect(prsInWorkout(weakWorkout, [...history, weakWorkout], resolve)).toHaveLength(0)
  })
})

describe('body metrics', () => {
  const metrics: BodyMetric[] = [
    { id: 'm1', date: addDays(today, -30), weightKg: 85 },
    { id: 'm2', date: addDays(today, -7), weightKg: 83 },
    { id: 'm3', date: today, weightKg: 82 },
  ]

  it('computes deltas against the right baseline', () => {
    expect(weightDelta(metrics, 7)).toBeCloseTo(-1, 5)
    expect(weightDelta(metrics, 60)).toBeCloseTo(-3, 5)
    expect(weightDelta([metrics[2]!], 7)).toBeUndefined()
  })
})

describe('goal progress', () => {
  const ctx = {
    workouts: [bench(addDays(today, -1), 90, 5)],
    metrics: [
      { id: 'm1', date: addDays(today, -30), weightKg: 85 },
      { id: 'm2', date: today, weightKg: 82.5 },
    ] as BodyMetric[],
    resolve,
    exercises: EXERCISE_LIBRARY,
  }

  it('measures weight-loss goals directionally', () => {
    const goal: Goal = {
      id: 'g1',
      type: 'body-weight',
      title: 'Cut',
      startWeightKg: 85,
      targetWeightKg: 80,
      createdAt: new Date().toISOString(),
    }
    const progress = goalProgress(goal, ctx)
    expect(progress.fraction).toBeCloseTo(0.5, 5)
    expect(progress.achieved).toBe(false)
  })

  it('marks strength goals achieved at the target', () => {
    const goal: Goal = {
      id: 'g2',
      type: 'strength',
      title: 'Bench 90',
      exerciseId: 'ex-bench-press',
      startWeightKg: 70,
      targetWeightKg: 90,
      createdAt: new Date().toISOString(),
    }
    const progress = goalProgress(goal, ctx)
    expect(progress.achieved).toBe(true)
    expect(progress.fraction).toBe(1)
  })

  it('tracks consistency against the current week', () => {
    const goal: Goal = {
      id: 'g3',
      type: 'consistency',
      title: '4x week',
      sessionsPerWeek: 4,
      createdAt: new Date().toISOString(),
    }
    const progress = goalProgress(goal, { ...ctx, workouts: [bench(startOfWeek(today), 80)] })
    expect(progress.fraction).toBeCloseTo(0.25, 5)
  })
})
