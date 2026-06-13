import { useState } from 'react'
import type { ExerciseMetric, LengthUnit, WeightUnit, WorkoutSet } from '@/types'
import {
  distanceInUnit,
  distanceToKm,
  distanceUnitFor,
  weightInUnit,
  weightToKg,
} from '@/lib/units'
import { formatClock } from '@/lib/format'
import { LIMITS, parseDurationInput, parseNonNegativeNumber, parsePositiveInt, parsePositiveNumber } from '@/lib/validation'

const INPUT_CLASS =
  'h-9 w-full min-w-0 rounded-lg border bg-raised px-2 text-center text-sm tnum text-ink placeholder:text-faint transition focus:border-accent focus:outline-none'

interface CellProps {
  defaultValue: string
  placeholder: string
  inputMode: 'numeric' | 'decimal' | 'text'
  ariaLabel: string
  /** Parses display text → committed value; null = invalid. */
  parse: (text: string) => number | null
  onCommit: (value: number | undefined) => void
}

/**
 * One numeric cell: keeps its own text while typing, commits parsed values
 * upward, and flags invalid input with a red border. Empty clears the value.
 */
function SetCell({ defaultValue, placeholder, inputMode, ariaLabel, parse, onCommit }: CellProps) {
  const [invalid, setInvalid] = useState(false)
  return (
    <input
      type="text"
      inputMode={inputMode}
      defaultValue={defaultValue}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const text = e.target.value.trim()
        if (text === '') {
          setInvalid(false)
          onCommit(undefined)
          return
        }
        const parsed = parse(text)
        setInvalid(parsed == null)
        if (parsed != null) onCommit(parsed)
      }}
      className={`${INPUT_CLASS} ${invalid ? 'border-danger' : 'border-edge'}`}
    />
  )
}

/** Column headers matching the inputs rendered by SetInputs. */
export function setColumns(metric: ExerciseMetric, weightUnit: WeightUnit, lengthUnit: LengthUnit): string[] {
  switch (metric) {
    case 'weight-reps':
      return [weightUnit, 'reps']
    case 'reps':
      return ['reps']
    case 'duration':
      return ['time']
    case 'distance-duration':
      return [distanceUnitFor(lengthUnit), 'time']
  }
}

export function SetInputs({
  metric,
  set,
  weightUnit,
  lengthUnit,
  onChange,
}: {
  metric: ExerciseMetric
  set: WorkoutSet
  weightUnit: WeightUnit
  lengthUnit: LengthUnit
  onChange: (patch: Partial<WorkoutSet>) => void
}) {
  if (metric === 'weight-reps') {
    return (
      <>
        <SetCell
          defaultValue={set.weightKg != null ? String(weightInUnit(set.weightKg, weightUnit)) : ''}
          placeholder="0"
          inputMode="decimal"
          ariaLabel={`Weight in ${weightUnit}`}
          parse={(t) => {
            const v = parseNonNegativeNumber(t, LIMITS.weightKgMax * 2.3)
            return v == null ? null : weightToKg(v, weightUnit)
          }}
          onCommit={(weightKg) => onChange({ weightKg })}
        />
        <SetCell
          defaultValue={set.reps != null ? String(set.reps) : ''}
          placeholder="0"
          inputMode="numeric"
          ariaLabel="Repetitions"
          parse={(t) => parsePositiveInt(t, LIMITS.repsMax)}
          onCommit={(reps) => onChange({ reps })}
        />
      </>
    )
  }

  if (metric === 'reps') {
    return (
      <SetCell
        defaultValue={set.reps != null ? String(set.reps) : ''}
        placeholder="0"
        inputMode="numeric"
        ariaLabel="Repetitions"
        parse={(t) => parsePositiveInt(t, LIMITS.repsMax)}
        onCommit={(reps) => onChange({ reps })}
      />
    )
  }

  if (metric === 'duration') {
    return (
      <SetCell
        defaultValue={set.durationSec != null ? formatClock(set.durationSec) : ''}
        placeholder="mm:ss"
        inputMode="text"
        ariaLabel="Duration (minutes, or mm:ss)"
        parse={parseDurationInput}
        onCommit={(durationSec) => onChange({ durationSec })}
      />
    )
  }

  return (
    <>
      <SetCell
        defaultValue={set.distanceKm != null ? String(distanceInUnit(set.distanceKm, lengthUnit)) : ''}
        placeholder="0.0"
        inputMode="decimal"
        ariaLabel={`Distance in ${distanceUnitFor(lengthUnit)}`}
        parse={(t) => {
          const v = parsePositiveNumber(t, LIMITS.distanceKmMax)
          return v == null ? null : distanceToKm(v, lengthUnit)
        }}
        onCommit={(distanceKm) => onChange({ distanceKm })}
      />
      <SetCell
        defaultValue={set.durationSec != null ? formatClock(set.durationSec) : ''}
        placeholder="mm:ss"
        inputMode="text"
        ariaLabel="Duration (minutes, or mm:ss)"
        parse={parseDurationInput}
        onCommit={(durationSec) => onChange({ durationSec })}
      />
    </>
  )
}
