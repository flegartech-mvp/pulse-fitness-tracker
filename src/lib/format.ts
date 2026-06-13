import type { WeightUnit } from '@/types'
import { weightInUnit } from './units'

const NUMBER = new Intl.NumberFormat('en-US')

export function formatNumber(n: number): string {
  return NUMBER.format(Math.round(n))
}

/** 12 480 → "12.5k"; keeps small values plain. */
export function formatCompact(n: number): string {
  if (Math.abs(n) >= 10_000) {
    return `${(n / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`
  }
  return formatNumber(n)
}

/** Training volume in the display unit, compact: "12.5k kg". */
export function formatVolume(volumeKg: number, unit: WeightUnit): string {
  return `${formatCompact(weightInUnit(volumeKg, unit))} ${unit}`
}

/** 5025 → "1h 24m"; 2700 → "45m"; 90 → "1m 30s"; 45 → "45s". */
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  if (m >= 10) return `${m}m`
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`
  return `${s}s`
}

/** Stopwatch style "48:12" or "1:02:45". */
export function formatClock(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

/** Signed delta: "+3.2%" / "−1.4%". Uses a true minus sign. */
export function formatSignedPercent(fraction: number): string {
  const pct = Math.round(Math.abs(fraction) * 100)
  return `${fraction < 0 ? '−' : '+'}${pct}%`
}

export function plural(n: number, singular: string, pluralForm?: string): string {
  return n === 1 ? singular : (pluralForm ?? `${singular}s`)
}
