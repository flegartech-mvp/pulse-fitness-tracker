import { describe, expect, it } from 'vitest'
import {
  distanceInUnit,
  distanceToKm,
  distanceUnitFor,
  formatHeight,
  formatWeight,
  kgToLb,
  lbToKg,
  weightInUnit,
  weightToKg,
} from '@/lib/units'

describe('units', () => {
  it('round-trips kg ↔ lb', () => {
    expect(lbToKg(kgToLb(80))).toBeCloseTo(80, 6)
    expect(kgToLb(100)).toBeCloseTo(220.46, 1)
  })

  it('converts display weight back to stored kg', () => {
    expect(weightToKg(100, 'kg')).toBe(100)
    expect(weightToKg(225, 'lb')).toBeCloseTo(102.06, 1)
    expect(weightInUnit(102.06, 'lb')).toBeCloseTo(225, 0)
  })

  it('formats weights with units', () => {
    expect(formatWeight(82.5, 'kg')).toBe('82.5 kg')
    expect(formatWeight(82.5, 'lb')).toBe('181.9 lb')
  })

  it('formats height in both systems', () => {
    expect(formatHeight(183, 'cm')).toBe('183 cm')
    expect(formatHeight(183, 'in')).toBe(`6'0"`)
    expect(formatHeight(180, 'in')).toBe(`5'11"`)
  })

  it('pairs distance units with the length unit', () => {
    expect(distanceUnitFor('cm')).toBe('km')
    expect(distanceUnitFor('in')).toBe('mi')
    expect(distanceInUnit(5, 'in')).toBeCloseTo(3.11, 2)
    expect(distanceToKm(3.11, 'in')).toBeCloseTo(5, 1)
  })
})
