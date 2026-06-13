/**
 * Date helpers built around local-time "date keys" (YYYY-MM-DD strings).
 * Keys sort lexicographically in chronological order, which the stats code relies on.
 */

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

/** Parses a YYYY-MM-DD key as local midnight. */
export function parseDateKey(key: string): Date {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isoToDateKey(iso: string): string {
  return toDateKey(new Date(iso))
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

/** Whole days from `a` to `b` (positive when b is later). */
export function diffDays(a: string, b: string): number {
  const ms = parseDateKey(b).getTime() - parseDateKey(a).getTime()
  return Math.round(ms / 86_400_000)
}

/** Monday-based start of week for a date key. */
export function startOfWeek(key: string): string {
  const d = parseDateKey(key)
  const offset = (d.getDay() + 6) % 7 // Mon=0 ... Sun=6
  d.setDate(d.getDate() - offset)
  return toDateKey(d)
}

/** Start-of-week keys for the last `n` weeks, oldest first, ending with the current week. */
export function lastNWeekStarts(n: number, from = todayKey()): string[] {
  const current = startOfWeek(from)
  const weeks: string[] = []
  for (let i = n - 1; i >= 0; i--) weeks.push(addDays(current, -7 * i))
  return weeks
}

/** The last `n` date keys, oldest first, ending today. */
export function lastNDates(n: number, from = todayKey()): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) out.push(addDays(from, -i))
  return out
}

export function monthKeyOf(key: string): string {
  return key.slice(0, 7)
}

// ---------------------------------------------------------------------------
// Formatting

const WEEKDAY_SHORT = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
const DATE_SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const DATE_MEDIUM = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const DATE_LONG = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const MONTH_LONG = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
const TIME_SHORT = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

/** "Jun 12" */
export function formatDateShort(key: string): string {
  return DATE_SHORT.format(parseDateKey(key))
}

/** "Thu, Jun 12" */
export function formatDateMedium(key: string): string {
  return DATE_MEDIUM.format(parseDateKey(key))
}

/** "Thursday, June 12" */
export function formatDateLong(key: string): string {
  return DATE_LONG.format(parseDateKey(key))
}

/** "June 2026" */
export function formatMonth(monthKey: string): string {
  return MONTH_LONG.format(parseDateKey(`${monthKey}-01`))
}

/** "Mon" */
export function formatWeekday(key: string): string {
  return WEEKDAY_SHORT.format(parseDateKey(key))
}

/** "6:24 PM" from an ISO datetime. */
export function formatTime(iso: string): string {
  return TIME_SHORT.format(new Date(iso))
}

/** "Today" / "Yesterday" / "Tomorrow" / "Mon, Jun 9". */
export function formatRelativeDay(key: string): string {
  const today = todayKey()
  const diff = diffDays(today, key)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff === 1) return 'Tomorrow'
  return formatDateMedium(key)
}

/** "Jun 2 – Jun 8" for the week starting at `weekStart`. */
export function formatWeekRange(weekStart: string): string {
  return `${formatDateShort(weekStart)} – ${formatDateShort(addDays(weekStart, 6))}`
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return 'Burning the midnight oil'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
