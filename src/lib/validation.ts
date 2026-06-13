/**
 * Input limits carried over from the original backend rules
 * (whole-number reps, 0–1000 kg weights) plus sane caps for the new fields.
 */
export const LIMITS = {
  repsMax: 1000,
  weightKgMax: 1000,
  durationSecMax: 24 * 3600,
  distanceKmMax: 1000,
  bodyWeightKgMin: 20,
  bodyWeightKgMax: 400,
  heightCmMin: 80,
  heightCmMax: 272,
  ageMin: 5,
  ageMax: 120,
  nameMax: 60,
  workoutNameMax: 80,
} as const

/** Strict positive integer within (0, max]; null when invalid. */
export function parsePositiveInt(value: string, max: number): number | null {
  const text = value.trim()
  if (!/^\d+$/.test(text)) return null
  const n = Number(text)
  if (!Number.isInteger(n) || n <= 0 || n > max) return null
  return n
}

/** Non-negative decimal within [0, max]; null when invalid. */
export function parseNonNegativeNumber(value: string, max: number): number | null {
  const text = value.trim()
  if (!/^\d+(\.\d+)?$/.test(text)) return null
  const n = Number(text)
  if (!Number.isFinite(n) || n < 0 || n > max) return null
  return n
}

/** Positive decimal within (0, max]; null when invalid. */
export function parsePositiveNumber(value: string, max: number): number | null {
  const n = parseNonNegativeNumber(value, max)
  return n == null || n === 0 ? null : n
}

/** "1:23:45", "23:45" or "45" (minutes) → seconds; null when invalid. */
export function parseDurationInput(value: string): number | null {
  const text = value.trim()
  if (!text) return null
  if (/^\d+(\.\d+)?$/.test(text)) {
    const minutes = Number(text)
    const sec = Math.round(minutes * 60)
    return sec > 0 && sec <= LIMITS.durationSecMax ? sec : null
  }
  const match = /^(?:(\d{1,2}):)?([0-5]?\d):([0-5]\d)$/.exec(text)
  if (!match) return null
  const h = Number(match[1] ?? 0)
  const m = Number(match[2])
  const s = Number(match[3])
  const sec = h * 3600 + m * 60 + s
  return sec > 0 && sec <= LIMITS.durationSecMax ? sec : null
}

export function validateProfileName(name: string): string | null {
  const text = name.trim()
  if (!text) return 'Name is required.'
  if (text.length > LIMITS.nameMax) return `Keep it under ${LIMITS.nameMax} characters.`
  return null
}

export function validateWorkoutName(name: string): string | null {
  const text = name.trim()
  if (!text) return 'Give the workout a name.'
  if (text.length > LIMITS.workoutNameMax) return `Keep it under ${LIMITS.workoutNameMax} characters.`
  return null
}

export function hasErrors(errors: Record<string, string | null | undefined>): boolean {
  return Object.values(errors).some(Boolean)
}
