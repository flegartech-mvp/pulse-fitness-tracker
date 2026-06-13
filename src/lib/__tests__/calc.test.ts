import { describe, expect, it } from 'vitest'
import { epley1Rm, estimateWorkoutDurationSec, setVolumeKg, workoutCalories, workoutVolumeKg } from '@/lib/calc'
import { EXERCISE_LIBRARY } from '@/data/exerciseLibrary'
import { completedWorkout, set } from '@/test/factories'

const resolve = (id: string) => EXERCISE_LIBRARY.find((e) => e.id === id)

describe('calc', () => {
  it('computes set volume only for weighted sets', () => {
    expect(setVolumeKg(set({ weightKg: 100, reps: 5 }))).toBe(500)
    expect(setVolumeKg(set({ reps: 10 }))).toBe(0)
    expect(setVolumeKg(set({ durationSec: 60 }))).toBe(0)
  })

  it('counts only done sets toward completed workout volume', () => {
    const workout = completedWorkout('2026-06-10', [
      {
        exerciseId: 'ex-bench-press',
        sets: [set({ weightKg: 80, reps: 8 }), set({ weightKg: 80, reps: 8, done: false })],
      },
    ])
    expect(workoutVolumeKg(workout)).toBe(640)
  })

  it('estimates 1RM with Epley and caps silly rep counts', () => {
    expect(epley1Rm(100, 1)).toBe(100)
    expect(epley1Rm(100, 5)).toBeCloseTo(116.67, 1)
    expect(epley1Rm(50, 30)).toBe(epley1Rm(50, 12)) // capped
  })

  it('estimates duration from sets and rest', () => {
    const workout = completedWorkout(
      '2026-06-10',
      [{ exerciseId: 'ex-bench-press', sets: [set({ weightKg: 80, reps: 8 }), set({ weightKg: 80, reps: 8 })], restSec: 120 }],
      { durationSec: undefined },
    )
    // 2 sets × (40s work + 120s rest)
    expect(estimateWorkoutDurationSec(workout, resolve)).toBe(320)
  })

  it('estimates calories that scale with body weight', () => {
    const workout = completedWorkout('2026-06-10', [
      { exerciseId: 'ex-running', sets: [set({ durationSec: 1800, distanceKm: 5 })], restSec: 0 },
    ])
    const light = workoutCalories(workout, resolve, 60)
    const heavy = workoutCalories(workout, resolve, 90)
    expect(light).toBeGreaterThan(150)
    expect(heavy).toBeGreaterThan(light)
    // Running 30 min at MET 9.8 for 75 kg ≈ 386 kcal
    expect(workoutCalories(workout, resolve, 75)).toBeCloseTo(386, -1)
  })
})
