import { describe, expect, it } from 'vitest'
import {
  parseDurationInput,
  parseNonNegativeNumber,
  parsePositiveInt,
  parsePositiveNumber,
  validateProfileName,
  validateWorkoutName,
} from '@/lib/validation'

describe('numeric parsing', () => {
  it('accepts only whole positive reps within range', () => {
    expect(parsePositiveInt('8', 1000)).toBe(8)
    expect(parsePositiveInt('0', 1000)).toBeNull()
    expect(parsePositiveInt('-3', 1000)).toBeNull()
    expect(parsePositiveInt('8.5', 1000)).toBeNull()
    expect(parsePositiveInt('1001', 1000)).toBeNull()
    expect(parsePositiveInt('abc', 1000)).toBeNull()
  })

  it('accepts non-negative decimals within range', () => {
    expect(parseNonNegativeNumber('0', 1000)).toBe(0)
    expect(parseNonNegativeNumber('82.5', 1000)).toBe(82.5)
    expect(parseNonNegativeNumber('-1', 1000)).toBeNull()
    expect(parseNonNegativeNumber('1e3', 1000)).toBeNull()
  })

  it('rejects zero for strictly positive fields', () => {
    expect(parsePositiveNumber('0', 1000)).toBeNull()
    expect(parsePositiveNumber('0.5', 1000)).toBe(0.5)
  })
})

describe('duration parsing', () => {
  it('treats bare numbers as minutes', () => {
    expect(parseDurationInput('45')).toBe(45 * 60)
    expect(parseDurationInput('1.5')).toBe(90)
  })

  it('parses mm:ss and h:mm:ss', () => {
    expect(parseDurationInput('12:30')).toBe(750)
    expect(parseDurationInput('1:02:03')).toBe(3723)
  })

  it('rejects malformed input', () => {
    expect(parseDurationInput('abc')).toBeNull()
    expect(parseDurationInput('12:99')).toBeNull()
    expect(parseDurationInput('')).toBeNull()
    expect(parseDurationInput('0')).toBeNull()
  })
})

describe('name validation', () => {
  it('requires names and caps their length', () => {
    expect(validateProfileName('Alex')).toBeNull()
    expect(validateProfileName('  ')).toBeTruthy()
    expect(validateProfileName('x'.repeat(61))).toBeTruthy()
    expect(validateWorkoutName('Push Day')).toBeNull()
    expect(validateWorkoutName('')).toBeTruthy()
  })
})
