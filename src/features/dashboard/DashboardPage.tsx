import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Info,
  Lightbulb,
  Play,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import { useAppData, useProfile } from '@/state/AppDataContext'
import { useWorkoutActions } from '@/features/workouts/useWorkoutActions'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatCard, DeltaTag } from '@/components/ui/StatCard'
import { ProgressRing, ProgressBar } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { BarChart } from '@/components/charts/BarChart'
import { WorkoutCard } from '@/features/workouts/WorkoutCard'
import {
  addDays,
  formatDateLong,
  formatDateShort,
  formatWeekday,
  greetingForHour,
  isoToDateKey,
  todayKey,
} from '@/lib/dates'
import { estimateWorkoutDurationSec, countSets } from '@/lib/calc'
import {
  bestStreak,
  completedWorkouts,
  currentStreak,
  goalProgress,
  statsForWeek,
  trainingDays,
  weeklyHistory,
} from '@/lib/stats'
import { startOfWeek } from '@/lib/dates'
import { buildRecommendations, type Recommendation } from '@/lib/recommendations'
import { formatDuration, formatNumber, formatVolume, plural } from '@/lib/format'
import { weightInUnit } from '@/lib/units'

function WelcomeBanner() {
  const { data, dismissWelcome } = useAppData()
  if (!data.meta.seededDemo || data.meta.welcomeDismissed) return null
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/15 via-accent/5 to-transparent p-4 sm:p-5">
      <div className="flex items-start gap-3 pr-8">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-accent-strong dark:text-accent" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-ink">You're viewing demo data</p>
          <p className="mt-0.5 text-sm text-soft">
            Pulse seeded ten weeks of realistic training so you can explore everything. When you're ready to make
            it yours, clear it in{' '}
            <Link to="/settings" className="font-medium text-accent-strong underline-offset-2 hover:underline dark:text-accent">
              Settings
            </Link>
            .
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={dismissWelcome}
        aria-label="Dismiss demo data notice"
        className="absolute right-3 top-3 rounded-lg p-1.5 text-faint transition hover:bg-raised hover:text-ink"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}

/** Hero card: resume an active session, start today's plan, or celebrate a done day. */
function TodayCard() {
  const { data, resolveExercise } = useAppData()
  const { startWorkout } = useWorkoutActions()
  const today = todayKey()

  const active = data.workouts.find((w) => w.status === 'active')
  const planned = data.workouts
    .filter((w) => w.status === 'planned')
    .sort((a, b) => (a.scheduledFor ?? '9999') < (b.scheduledFor ?? '9999') ? -1 : 1)
  const todaysPlan = planned.find((w) => (w.scheduledFor ?? '') <= today) ?? planned[0]
  const doneToday = data.workouts.find(
    (w) => w.status === 'completed' && w.completedAt && isoToDateKey(w.completedAt) === today,
  )

  if (active) {
    const done = countSets(active, true)
    const total = countSets(active)
    return (
      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-accent/15 blur-3xl" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wider text-warning">Workout in progress</p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">{active.name}</h2>
        <p className="mt-1 text-sm text-soft">
          {done} of {total} sets done — keep it moving.
        </p>
        <ProgressBar fraction={total > 0 ? done / total : 0} className="mt-4" />
        <Button variant="primary" size="lg" className="mt-5" onClick={() => startWorkout(active.id)}>
          <Play className="size-4 fill-current" aria-hidden />
          Resume session
        </Button>
      </Card>
    )
  }

  if (todaysPlan) {
    const overdue = (todaysPlan.scheduledFor ?? today) < today
    const estimate = estimateWorkoutDurationSec(todaysPlan, resolveExercise)
    return (
      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-accent/15 blur-3xl" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong dark:text-accent">
          {overdue ? 'Waiting for you' : todaysPlan.scheduledFor === today ? "Today's workout" : 'Next workout'}
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">{todaysPlan.name}</h2>
        <p className="mt-1 text-sm text-soft">
          {todaysPlan.exercises.length} {plural(todaysPlan.exercises.length, 'exercise')} ·{' '}
          {countSets(todaysPlan)} sets · ~{formatDuration(estimate)}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="primary" size="lg" onClick={() => startWorkout(todaysPlan.id)}>
            <Play className="size-4 fill-current" aria-hidden />
            Start workout
          </Button>
          <Link to={`/workouts/${todaysPlan.id}`}>
            <Button size="lg">Preview</Button>
          </Link>
        </div>
      </Card>
    )
  }

  if (doneToday) {
    return (
      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-success/15 blur-3xl" aria-hidden />
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-success">
          <CheckCircle2 className="size-4" aria-hidden />
          Done for today
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">{doneToday.name} — complete</h2>
        <p className="mt-1 text-sm text-soft">Recovery is where the gains happen. See you tomorrow.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to={`/workouts/${doneToday.id}`}>
            <Button size="lg">View summary</Button>
          </Link>
          <Link to="/workouts/new">
            <Button variant="ghost" size="lg">
              <Plus className="size-4" aria-hidden />
              Extra session
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div className="absolute -right-16 -top-16 size-48 rounded-full bg-accent/10 blur-3xl" aria-hidden />
      <p className="text-xs font-semibold uppercase tracking-wider text-soft">Nothing planned</p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">Ready when you are</h2>
      <p className="mt-1 text-sm text-soft">Plan a session or jump straight into an empty workout.</p>
      <div className="mt-5">
        <Link to="/workouts/new">
          <Button variant="primary" size="lg">
            <Plus className="size-4" aria-hidden />
            New workout
          </Button>
        </Link>
      </div>
    </Card>
  )
}

function StreakCard() {
  const { data } = useAppData()
  const days = useMemo(() => trainingDays(data.workouts), [data.workouts])
  const streak = currentStreak(days)
  const best = bestStreak(days)
  const today = todayKey()
  const lastSeven = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)), [today])

  return (
    <Card className="flex flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-soft">Streak</p>
        {streak.atRisk ? (
          <span className="text-[11px] font-semibold text-warning">train today to keep it</span>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-warning/15">
          <Flame className="size-6 text-warning" aria-hidden />
        </span>
        <div>
          <p className="tnum text-3xl font-bold tracking-tight text-ink">
            {streak.length}
            <span className="ml-1.5 text-sm font-medium text-soft">{plural(streak.length, 'day')}</span>
          </p>
          <p className="text-xs text-soft">best {best} — rest days don't break it</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-1">
        {lastSeven.map((day) => {
          const trained = days.has(day)
          return (
            <div key={day} className="flex flex-col items-center gap-1.5">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-[10px] font-bold ${
                  trained ? 'bg-accent text-on-accent' : 'bg-raised text-faint'
                }`}
                title={`${formatDateShort(day)}${trained ? ' — trained' : ''}`}
              >
                {trained ? '✓' : ''}
              </span>
              <span className={`text-[9px] font-medium ${day === today ? 'text-ink' : 'text-faint'}`}>
                {formatWeekday(day).slice(0, 1)}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

const TIP_ICON: Record<Recommendation['tone'], typeof Info> = {
  push: Zap,
  win: Trophy,
  warn: Flame,
  info: Lightbulb,
}

const TIP_COLOR: Record<Recommendation['tone'], string> = {
  push: 'var(--c-accent)',
  win: 'var(--c-success)',
  warn: 'var(--c-warning)',
  info: 'var(--c-sky)',
}

function CoachTips() {
  const appData = useAppData()
  const tips = useMemo(
    () => buildRecommendations(appData.data, appData.resolveExercise, appData.exercises),
    [appData.data, appData.resolveExercise, appData.exercises],
  )
  if (tips.length === 0) return null
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold tracking-tight text-ink">Coach tips</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tips.map((tip) => {
          const Icon = TIP_ICON[tip.tone]
          const color = TIP_COLOR[tip.tone]
          const body = (
            <Card className="flex h-full items-start gap-3 p-4 transition hover:border-edge-strong">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{tip.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-soft">{tip.body}</p>
              </div>
            </Card>
          )
          return tip.to ? (
            <Link key={tip.id} to={tip.to} className="block">
              {body}
            </Link>
          ) : (
            <div key={tip.id}>{body}</div>
          )
        })}
      </div>
    </section>
  )
}

function GoalsPreview() {
  const { data, workouts, resolveExercise, exercises } = useGoalsCtx()
  if (data.goals.length === 0) return null
  return (
    <Card>
      <CardHeader
        title="Goals"
        action={
          <Link to="/goals" className="inline-flex items-center gap-1 text-xs font-semibold text-soft transition hover:text-ink">
            All goals <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        }
      />
      <div className="grid gap-1 p-3 pt-3">
        {data.goals.slice(0, 3).map((goal) => {
          const progress = goalProgress(goal, { workouts, metrics: data.metrics, resolve: resolveExercise, exercises })
          return (
            <Link
              key={goal.id}
              to="/goals"
              className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-raised"
            >
              <ProgressRing
                fraction={progress.fraction}
                size={44}
                strokeWidth={4}
                color={progress.achieved ? 'var(--c-success)' : 'var(--c-accent)'}
              >
                <span className="tnum text-[10px] font-bold text-ink">{Math.round(progress.fraction * 100)}</span>
              </ProgressRing>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{goal.title}</p>
                <p className="truncate text-xs text-soft">{progress.label}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}

// Small helper so GoalsPreview reads cleanly above.
function useGoalsCtx() {
  const { data, resolveExercise, exercises } = useAppData()
  return { data, workouts: data.workouts, resolveExercise, exercises }
}

export default function DashboardPage() {
  const { data, resolveExercise, bodyWeightKg } = useAppData()
  const profile = useProfile()

  const weeks = useMemo(
    () => weeklyHistory(data.workouts, resolveExercise, bodyWeightKg, 8),
    [data.workouts, resolveExercise, bodyWeightKg],
  )
  const thisWeek = weeks.at(-1) ?? statsForWeek([], resolveExercise, 0, startOfWeek(todayKey()))
  const lastWeek = weeks.at(-2)

  const recent = useMemo(() => completedWorkouts(data.workouts).slice(-3).reverse(), [data.workouts])
  const consistencyGoal = data.goals.find((g) => g.type === 'consistency')

  const volumeDelta =
    lastWeek && lastWeek.volumeKg > 0 ? thisWeek.volumeKg / lastWeek.volumeKg - 1 : undefined

  return (
    <div className="animate-fade-up">
      <WelcomeBanner />

      <div className="mb-6">
        <p className="text-sm text-soft">{formatDateLong(todayKey())}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {greetingForHour(new Date().getHours())}, {profile.name}
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TodayCard />
        </div>
        <div className="lg:col-span-2">
          <StreakCard />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label="Sessions this week"
          value={String(thisWeek.sessions)}
          sub={
            consistencyGoal?.type === 'consistency'
              ? `target ${consistencyGoal.sessionsPerWeek}/week`
              : lastWeek
                ? `${lastWeek.sessions} last week`
                : undefined
          }
        />
        <StatCard
          icon={TrendingUp}
          label="Volume this week"
          value={formatVolume(thisWeek.volumeKg, profile.weightUnit)}
          sub={volumeDelta != null ? <DeltaTag delta={volumeDelta} /> : 'lifted weight × reps'}
          iconColor="var(--c-violet)"
        />
        <StatCard
          icon={Flame}
          label="Calories burned"
          value={`~${formatNumber(thisWeek.calories)}`}
          sub="estimated, this week"
          iconColor="var(--c-warning)"
        />
        <StatCard
          icon={Clock}
          label="Active time"
          value={formatDuration(thisWeek.durationSec)}
          sub={thisWeek.cardioMinutes > 0 ? `${thisWeek.cardioMinutes}m cardio` : 'this week'}
          iconColor="var(--c-sky)"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Weekly volume" subtitle="Total weight lifted per week" />
          <div className="p-5 pt-4">
            <BarChart
              bars={weeks.map((w, i) => ({
                label: formatDateShort(w.weekStart).replace(' ', ' '),
                value: weightInUnit(w.volumeKg, profile.weightUnit),
                emphasis: i === weeks.length - 1,
              }))}
              formatValue={(v) => `${formatNumber(v)} ${profile.weightUnit}`}
            />
          </div>
        </Card>
        <div className="lg:col-span-2">
          <GoalsPreview />
        </div>
      </div>

      <div className="mt-8">
        <CoachTips />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-ink">Recent workouts</h2>
          <Link to="/workouts" className="inline-flex items-center gap-1 text-xs font-semibold text-soft transition hover:text-ink">
            View all <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        {recent.length > 0 ? (
          <div className="space-y-3">
            {recent.map((w) => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Dumbbell}
            title="No workouts yet"
            body="Your completed sessions will show up here with volume, duration, and records."
            action={
              <Link to="/workouts/new">
                <Button variant="primary">
                  <Plus className="size-4" aria-hidden />
                  Plan your first workout
                </Button>
              </Link>
            }
          />
        )}
      </section>

      <p className="mt-10 flex items-center justify-center gap-1.5 text-center text-xs text-faint">
        <Target className="size-3.5" aria-hidden />
        All data stays on this device.
      </p>
    </div>
  )
}
