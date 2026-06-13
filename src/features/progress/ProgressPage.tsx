import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Dumbbell, LineChart, Plus, Scale, Trash2, Trophy } from 'lucide-react'
import type { BodyMetric } from '@/types'
import { useAppData, useProfile } from '@/state/AppDataContext'
import { useToast } from '@/state/ToastContext'
import { newId } from '@/lib/id'
import {
  activityByDay,
  buildRecordBook,
  categorySplit,
  sortedMetrics,
  statsForWeek,
  weeklyHistory,
  weightDelta,
} from '@/lib/stats'
import { addDays, formatDateShort, formatRelativeDay, isoToDateKey, lastNWeekStarts, monthKeyOf, todayKey } from '@/lib/dates'
import { workoutCalories, workoutDurationSec, workoutVolumeKg } from '@/lib/calc'
import { formatWeight, weightInUnit, weightToKg } from '@/lib/units'
import { formatDuration, formatNumber, formatVolume } from '@/lib/format'
import { LIMITS, parsePositiveNumber } from '@/lib/validation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState } from '@/components/ui/EmptyState'
import { AreaChart } from '@/components/charts/AreaChart'
import { Heatmap } from '@/components/charts/Heatmap'
import { CategoryBadge, categoryColor } from '@/components/ui/Badge'

type Range = '30' | '90' | 'all'

function LogWeightModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addMetric } = useAppData()
  const profile = useProfile()
  const { toast } = useToast()
  const [date, setDate] = useState(todayKey())
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [errors, setErrors] = useState<{ weight?: string; bodyFat?: string; date?: string }>({})

  function save() {
    const next: typeof errors = {}
    const maxDisplay = profile.weightUnit === 'kg' ? LIMITS.bodyWeightKgMax : LIMITS.bodyWeightKgMax * 2.205
    const parsed = parsePositiveNumber(weight, maxDisplay)
    const weightKg = parsed != null ? weightToKg(parsed, profile.weightUnit) : null
    if (weightKg == null || weightKg < LIMITS.bodyWeightKgMin || weightKg > LIMITS.bodyWeightKgMax) {
      next.weight = `Enter a weight between ${formatWeight(LIMITS.bodyWeightKgMin, profile.weightUnit)} and ${formatWeight(LIMITS.bodyWeightKgMax, profile.weightUnit)}.`
    }
    let bodyFatPct: number | undefined
    if (bodyFat.trim()) {
      const bf = parsePositiveNumber(bodyFat, 75)
      if (bf == null) next.bodyFat = 'Enter a percentage between 0 and 75.'
      else bodyFatPct = bf
    }
    if (!date || date > todayKey()) next.date = 'Pick today or a past date.'
    setErrors(next)
    if (Object.keys(next).length > 0 || weightKg == null) return

    addMetric({ id: newId(), date, weightKg, bodyFatPct })
    toast({ tone: 'success', title: 'Weight logged', description: `${formatWeight(weightKg, profile.weightUnit)} on ${formatDateShort(date)}.` })
    setWeight('')
    setBodyFat('')
    setDate(todayKey())
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log body weight"
      subtitle="One entry per day — logging the same day again replaces it."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            Save entry
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label={`Weight (${profile.weightUnit})`}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={profile.weightUnit === 'kg' ? 'e.g. 81.4' : 'e.g. 179.5'}
          inputMode="decimal"
          error={errors.weight}
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Date"
            type="date"
            value={date}
            max={todayKey()}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
          />
          <TextField
            label="Body fat % (optional)"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            placeholder="e.g. 18.5"
            inputMode="decimal"
            error={errors.bodyFat}
          />
        </div>
      </div>
    </Modal>
  )
}

function BodyWeightSection() {
  const { data, deleteMetric } = useAppData()
  const profile = useProfile()
  const { toast } = useToast()
  const [range, setRange] = useState<Range>('90')
  const [logOpen, setLogOpen] = useState(false)

  const metrics = useMemo(() => sortedMetrics(data.metrics), [data.metrics])
  const latest = metrics.at(-1)
  const delta7 = weightDelta(data.metrics, 7)
  const delta30 = weightDelta(data.metrics, 30)

  const visible = useMemo(() => {
    if (range === 'all') return metrics
    const cutoff = addDays(todayKey(), -Number(range))
    return metrics.filter((m) => m.date >= cutoff)
  }, [metrics, range])

  function describeDelta(delta: number | undefined): string {
    if (delta == null) return '—'
    const sign = delta > 0 ? '+' : ''
    return `${sign}${weightInUnit(delta, profile.weightUnit).toFixed(1)} ${profile.weightUnit}`
  }

  return (
    <Card>
      <CardHeader
        title="Body weight"
        subtitle={latest ? `Last entry ${formatRelativeDay(latest.date).toLowerCase()}` : 'No entries yet'}
        action={
          <Button size="sm" variant="primary" onClick={() => setLogOpen(true)}>
            <Plus className="size-3.5" aria-hidden />
            Log weight
          </Button>
        }
      />
      <div className="p-5">
        {metrics.length > 0 ? (
          <>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-soft">Current</p>
                  <p className="tnum text-2xl font-bold tracking-tight text-ink">
                    {latest ? formatWeight(latest.weightKg, profile.weightUnit) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-soft">7 days</p>
                  <p className={`tnum text-2xl font-bold tracking-tight ${delta7 != null && delta7 < 0 ? 'text-success' : 'text-ink'}`}>
                    {describeDelta(delta7)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-soft">30 days</p>
                  <p className={`tnum text-2xl font-bold tracking-tight ${delta30 != null && delta30 < 0 ? 'text-success' : 'text-ink'}`}>
                    {describeDelta(delta30)}
                  </p>
                </div>
              </div>
              <SegmentedControl<Range>
                ariaLabel="Chart range"
                value={range}
                onChange={setRange}
                options={[
                  { value: '30', label: '1M' },
                  { value: '90', label: '3M' },
                  { value: 'all', label: 'All' },
                ]}
              />
            </div>
            <AreaChart
              points={visible.map((m) => ({
                label: formatDateShort(m.date),
                value: weightInUnit(m.weightKg, profile.weightUnit),
              }))}
              formatValue={(v) => `${v.toFixed(1)}`}
            />
            <details className="group mt-4">
              <summary className="cursor-pointer list-none text-xs font-semibold text-soft transition hover:text-ink">
                Recent entries <span className="text-faint group-open:hidden">(show)</span>
              </summary>
              <ul className="mt-2 divide-y divide-edge">
                {[...visible].reverse().slice(0, 10).map((m: BodyMetric) => (
                  <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-soft">{formatDateShort(m.date)}</span>
                    <span className="flex items-center gap-3">
                      <span className="tnum font-semibold text-ink">{formatWeight(m.weightKg, profile.weightUnit)}</span>
                      {m.bodyFatPct != null ? <span className="tnum text-xs text-faint">{m.bodyFatPct}% bf</span> : null}
                      <IconButton
                        aria-label={`Delete entry from ${formatDateShort(m.date)}`}
                        size="sm"
                        onClick={() => {
                          deleteMetric(m.id)
                          toast({ tone: 'info', title: 'Entry deleted' })
                        }}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </IconButton>
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </>
        ) : (
          <EmptyState
            icon={Scale}
            title="No weight entries yet"
            body="Log your body weight regularly to see your trend — it powers your weight goal and calorie estimates."
            action={
              <Button variant="primary" onClick={() => setLogOpen(true)}>
                <Plus className="size-4" aria-hidden />
                Log your first entry
              </Button>
            }
          />
        )}
      </div>
      <LogWeightModal open={logOpen} onClose={() => setLogOpen(false)} />
    </Card>
  )
}

function TrainingSection() {
  const { data, resolveExercise, bodyWeightKg } = useAppData()
  const profile = useProfile()

  const weeks = useMemo(
    () => weeklyHistory(data.workouts, resolveExercise, bodyWeightKg, 12),
    [data.workouts, resolveExercise, bodyWeightKg],
  )
  const split = useMemo(() => categorySplit(data.workouts, resolveExercise, 30), [data.workouts, resolveExercise])
  const totalSets = [...split.values()].reduce((a, b) => a + b, 0)
  const ranked = [...split.entries()].sort((a, b) => b[1] - a[1])

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader title="Volume trend" subtitle="Weekly training volume, last 12 weeks" />
        <div className="p-5 pt-4">
          <AreaChart
            points={weeks.map((w) => ({
              label: formatDateShort(w.weekStart),
              value: weightInUnit(w.volumeKg, profile.weightUnit),
            }))}
            color="var(--c-violet)"
            formatValue={(v) => formatNumber(v)}
          />
        </div>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Muscle balance" subtitle="Sets per area, last 30 days" />
        <div className="space-y-3 p-5 pt-4">
          {ranked.length > 0 ? (
            ranked.map(([category, sets]) => (
              <div key={category}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <CategoryBadge category={category} />
                  <span className="tnum font-semibold text-soft">{sets} sets</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-edge">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(sets / Math.max(totalSets, 1)) * 100}%`, background: categoryColor(category) }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-soft">Complete workouts to see your training balance.</p>
          )}
        </div>
      </Card>
    </div>
  )
}

function ConsistencySection() {
  const { data, resolveExercise, bodyWeightKg } = useAppData()
  const profile = useProfile()

  const activity = useMemo(() => activityByDay(data.workouts), [data.workouts])
  const weekStarts = useMemo(() => lastNWeekStarts(8), [])
  const avgSessions = useMemo(() => {
    const counts = weekStarts.map(
      (ws) => statsForWeek(data.workouts, resolveExercise, 0, ws).sessions,
    )
    return counts.reduce((a, b) => a + b, 0) / Math.max(counts.length, 1)
  }, [weekStarts, data.workouts, resolveExercise])

  const thisMonth = monthKeyOf(todayKey())
  const monthStats = useMemo(() => {
    const stats = { sessions: 0, volumeKg: 0, durationSec: 0, calories: 0 }
    for (const w of data.workouts) {
      if (w.status !== 'completed' || !w.completedAt) continue
      if (monthKeyOf(isoToDateKey(w.completedAt)) !== thisMonth) continue
      stats.sessions += 1
      stats.volumeKg += workoutVolumeKg(w)
      stats.durationSec += workoutDurationSec(w, resolveExercise)
      stats.calories += workoutCalories(w, resolveExercise, bodyWeightKg)
    }
    return stats
  }, [data.workouts, resolveExercise, bodyWeightKg, thisMonth])

  return (
    <Card>
      <CardHeader title="Consistency" subtitle={`Averaging ${avgSessions.toFixed(1)} sessions a week over the last 8 weeks`} />
      <div className="p-5 pt-4">
        <Heatmap activity={activity} />
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-edge pt-4 sm:grid-cols-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-soft">
              <CalendarDays className="size-3.5" aria-hidden /> This month
            </p>
            <p className="tnum mt-1 text-lg font-bold text-ink">{monthStats.sessions} sessions</p>
          </div>
          <div>
            <p className="text-xs text-soft">Volume</p>
            <p className="tnum mt-1 text-lg font-bold text-ink">{formatVolume(monthStats.volumeKg, profile.weightUnit)}</p>
          </div>
          <div>
            <p className="text-xs text-soft">Active time</p>
            <p className="tnum mt-1 text-lg font-bold text-ink">{formatDuration(monthStats.durationSec)}</p>
          </div>
          <div>
            <p className="text-xs text-soft">Calories</p>
            <p className="tnum mt-1 text-lg font-bold text-ink">~{formatNumber(monthStats.calories)}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

function RecordsSection() {
  const { data, resolveExercise } = useAppData()
  const profile = useProfile()
  const records = useMemo(() => buildRecordBook(data.workouts, resolveExercise), [data.workouts, resolveExercise])

  const strength = [...records.strength.values()]
    .sort((a, b) => b.est1RmKg - a.est1RmKg)
    .slice(0, 10)

  return (
    <Card>
      <CardHeader title="Personal records" subtitle="Best estimated one-rep max per exercise" />
      <div className="p-5 pt-3">
        {strength.length > 0 ? (
          <ul className="divide-y divide-edge">
            {strength.map((r) => {
              const exercise = resolveExercise(r.exerciseId)
              if (!exercise) return null
              return (
                <li key={r.exerciseId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{exercise.name}</p>
                    <p className="mt-0.5 text-xs text-soft">
                      {formatWeight(r.bestWeightKg, profile.weightUnit)} × {r.bestWeightReps} · {formatDateShort(r.date)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <CategoryBadge category={exercise.category} />
                    <span className="tnum rounded-lg bg-accent/12 px-2.5 py-1 text-sm font-bold text-accent-strong dark:text-accent">
                      {formatWeight(r.est1RmKg, profile.weightUnit)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState
            icon={Trophy}
            title="No records yet"
            body="Complete weighted sets and your best lifts will be tracked automatically."
            className="border-0"
          />
        )}
      </div>
    </Card>
  )
}

export default function ProgressPage() {
  const { data } = useAppData()
  const hasAnything = data.workouts.some((w) => w.status === 'completed') || data.metrics.length > 0

  return (
    <div className="animate-fade-up">
      <PageHeader title="Progress" subtitle="Body weight, training volume, consistency, and records." />
      {hasAnything ? (
        <div className="space-y-4">
          <BodyWeightSection />
          <TrainingSection />
          <ConsistencySection />
          <RecordsSection />
        </div>
      ) : (
        <EmptyState
          icon={LineChart}
          title="Nothing to chart yet"
          body="Complete a workout or log your body weight and your progress will start building here."
          action={
            <Link to="/workouts/new">
              <Button variant="primary">
                <Dumbbell className="size-4" aria-hidden />
                Plan a workout
              </Button>
            </Link>
          }
        />
      )}
    </div>
  )
}
