import type { LengthUnit, WeightUnit } from '@/types'

export const KG_PER_LB = 0.45359237
export const CM_PER_IN = 2.54
export const KM_PER_MI = 1.609344

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB
}

export function cmToIn(cm: number): number {
  return cm / CM_PER_IN
}

export function inToCm(inches: number): number {
  return inches * CM_PER_IN
}

export function kmToMi(km: number): number {
  return km / KM_PER_MI
}

export function miToKm(mi: number): number {
  return mi * KM_PER_MI
}

function round(value: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** Weight in the user's display unit, rounded to 1 decimal. */
export function weightInUnit(kg: number, unit: WeightUnit): number {
  return round(unit === 'kg' ? kg : kgToLb(kg), 1)
}

/** Converts a number entered in the user's display unit back to stored kg. */
export function weightToKg(value: number, unit: WeightUnit): number {
  return round(unit === 'kg' ? value : lbToKg(value), 2)
}

/** "82.5 kg" / "181.9 lb". */
export function formatWeight(kg: number, unit: WeightUnit, withUnit = true): string {
  const v = weightInUnit(kg, unit)
  const text = v.toLocaleString('en-US', { maximumFractionDigits: 1 })
  return withUnit ? `${text} ${unit}` : text
}

/** Distance display pairs with the length unit: metric → km, imperial → mi. */
export function distanceUnitFor(lengthUnit: LengthUnit): 'km' | 'mi' {
  return lengthUnit === 'cm' ? 'km' : 'mi'
}

export function distanceInUnit(km: number, lengthUnit: LengthUnit): number {
  return round(lengthUnit === 'cm' ? km : kmToMi(km), 2)
}

export function distanceToKm(value: number, lengthUnit: LengthUnit): number {
  return round(lengthUnit === 'cm' ? value : miToKm(value), 3)
}

export function formatDistance(km: number, lengthUnit: LengthUnit): string {
  const v = distanceInUnit(km, lengthUnit)
  return `${v.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${distanceUnitFor(lengthUnit)}`
}

/** "183 cm" or 6'0" style depending on unit. */
export function formatHeight(cm: number, unit: LengthUnit): string {
  if (unit === 'cm') return `${Math.round(cm)} cm`
  const totalIn = cmToIn(cm)
  const ft = Math.floor(totalIn / 12)
  const inches = Math.round(totalIn % 12)
  if (inches === 12) return `${ft + 1}'0"`
  return `${ft}'${inches}"`
}

export function heightInUnit(cm: number, unit: LengthUnit): number {
  return round(unit === 'cm' ? cm : cmToIn(cm), 1)
}

export function heightToCm(value: number, unit: LengthUnit): number {
  return round(unit === 'cm' ? value : inToCm(value), 1)
}
