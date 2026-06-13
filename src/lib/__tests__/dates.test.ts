import { describe, expect, it } from 'vitest'
import {
  addDays,
  diffDays,
  formatRelativeDay,
  lastNDates,
  lastNWeekStarts,
  monthKeyOf,
  startOfWeek,
  todayKey,
} from '@/lib/dates'

describe('dates', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2026-06-30', 1)).toBe('2026-07-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29') // leap year
  })

  it('computes day differences', () => {
    expect(diffDays('2026-06-10', '2026-06-12')).toBe(2)
    expect(diffDays('2026-06-12', '2026-06-10')).toBe(-2)
    expect(diffDays('2026-06-12', '2026-06-12')).toBe(0)
  })

  it('finds the Monday-based start of week', () => {
    expect(startOfWeek('2026-06-12')).toBe('2026-06-08') // Friday → Monday
    expect(startOfWeek('2026-06-08')).toBe('2026-06-08') // Monday stays
    expect(startOfWeek('2026-06-14')).toBe('2026-06-08') // Sunday belongs to same week
  })

  it('lists trailing weeks oldest-first ending with the current week', () => {
    const weeks = lastNWeekStarts(4, '2026-06-12')
    expect(weeks).toHaveLength(4)
    expect(weeks.at(-1)).toBe('2026-06-08')
    expect(weeks[0]).toBe('2026-05-18')
  })

  it('lists trailing dates ending today', () => {
    const days = lastNDates(3, '2026-06-12')
    expect(days).toEqual(['2026-06-10', '2026-06-11', '2026-06-12'])
  })

  it('labels relative days', () => {
    const today = todayKey()
    expect(formatRelativeDay(today)).toBe('Today')
    expect(formatRelativeDay(addDays(today, -1))).toBe('Yesterday')
    expect(formatRelativeDay(addDays(today, 1))).toBe('Tomorrow')
  })

  it('extracts month keys', () => {
    expect(monthKeyOf('2026-06-12')).toBe('2026-06')
  })
})
