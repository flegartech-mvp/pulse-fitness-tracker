import { describe, expect, it } from 'vitest'
import { buildDemoData } from '@/data/demoData'
import { EXERCISE_LIBRARY } from '@/data/exerciseLibrary'
import { todayKey } from '@/lib/dates'

describe('demo data', () => {
  const data = buildDemoData()
  const today = todayKey()

  it('creates a believable training history', () => {
    const completed = data.workouts.filter((w) => w.status === 'completed')
    expect(completed.length).toBeGreaterThan(20)
    for (const w of completed) {
      expect(w.completedAt).toBeTruthy()
      expect(w.exercises.length).toBeGreaterThan(0)
    }
  })

  it('plans exactly one workout for today', () => {
    const planned = data.workouts.filter((w) => w.status === 'planned')
    expect(planned).toHaveLength(1)
    expect(planned[0]?.scheduledFor).toBe(today)
    expect(planned[0]?.exercises.every((e) => e.sets.every((s) => !s.done))).toBe(true)
  })

  it('references only exercises that exist in the library', () => {
    const ids = new Set(EXERCISE_LIBRARY.map((e) => e.id))
    for (const w of data.workouts) {
      for (const entry of w.exercises) {
        expect(ids.has(entry.exerciseId)).toBe(true)
      }
    }
  })

  it('logs a downward body-weight trend', () => {
    expect(data.metrics.length).toBeGreaterThan(10)
    const dates = data.metrics.map((m) => m.date)
    expect([...dates].sort()).toEqual(dates) // ascending
    const first = data.metrics[0]!.weightKg
    const last = data.metrics.at(-1)!.weightKg
    expect(last).toBeLessThan(first)
  })

  it('is deterministic for a given day', () => {
    const again = buildDemoData()
    expect(again.workouts.length).toBe(data.workouts.length)
    expect(again.metrics).toEqual(data.metrics)
  })

  it('ships three goals and a profile', () => {
    expect(data.goals).toHaveLength(3)
    expect(data.profile?.name).toBe('Alex')
    expect(data.meta.seededDemo).toBe(true)
  })
})
