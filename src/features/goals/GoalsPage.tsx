import { useMemo, useState } from 'react'
import { CalendarCheck, Dumbbell, HeartPulse, Pencil, Plus, Scale, Target, Trash2, Trophy } from 'lucide-react'
import type { Goal, GoalType } from '@/types'
import { useAppData, useProfile } from '@/state/AppDataContext'
import { useToast } from '@/state/ToastContext'
import { newId } from '@/lib/id'
import { buildRecordBook, goalProgress, latestMetric } from '@/lib/stats'
import { formatWeight, weightToKg } from '@/lib/units'
import { LIMITS, parsePositiveInt, parsePositiveNumber } from '@/lib/validation'
import { formatDateShort } from '@/lib/dates'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextField, SelectField } from '@/components/ui/Field'
import { ProgressRing } from '@/components/ui/Progress'
import { Pill } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const GOAL_TYPE_META: Record<GoalType, { label: string; blurb: string; icon: typeof Target }> = {
  'body-weight': { label: 'Body weight', blurb: 'Reach a target weight', icon: Scale },
  strength: { label: 'Strength', blurb: 'Hit a lift target', icon: Dumbbell },
  consistency: { label: 'Consistency', blurb: 'Train N times a week', icon: CalendarCheck },
  endurance: { label: 'Endurance', blurb: 'Weekly cardio minutes', icon: HeartPulse },
}

function GoalFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing?: Goal
}) {
  const { data, exercises, resolveExercise, addGoal, updateGoal } = useAppData()
  const profile = useProfile()
  const { toast } = useToast()

  const [type, setType] = useState<GoalType>(editing?.type ?? 'body-weight')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [target, setTarget] = useState(() => {
    if (!editing) return ''
    switch (editing.type) {
      case 'body-weight':
      case 'strength':
        return String(editing.targetWeightKg)
      case 'consistency':
        return String(editing.sessionsPerWeek)
      case 'endurance':
        return String(editing.minutesPerWeek)
    }
  })
  const [exerciseId, setExerciseId] = useState(
    editing?.type === 'strength' ? editing.exerciseId : 'ex-bench-press',
  )
  const [error, setError] = useState<string | null>(null)

  const strengthExercises = useMemo(
    () => exercises.filter((e) => e.metric === 'weight-reps'),
    [exercises],
  )

  const currentWeight = latestMetric(data.metrics)?.weightKg
  const records = useMemo(() => buildRecordBook(data.workouts, resolveExercise), [data.workouts, resolveExercise])

  function defaultTitle(): string {
    const value = target.trim()
    switch (type) {
      case 'body-weight':
        return `Reach ${value} ${profile.weightUnit}`
      case 'strength':
        return `${resolveExercise(exerciseId)?.name ?? 'Lift'} ${value} ${profile.weightUnit}`
      case 'consistency':
        return `Train ${value}× a week`
      case 'endurance':
        return `${value} cardio minutes a week`
    }
  }

  function save() {
    const value = target.trim()
    let goal: Goal | null = null
    const base = {
      id: editing?.id ?? newId(),
      title: title.trim() || defaultTitle(),
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    }

    if (type === 'body-weight') {
      const parsed = parsePositiveNumber(value, profile.weightUnit === 'kg' ? LIMITS.bodyWeightKgMax : 880)
      const targetKg = parsed != null ? weightToKg(parsed, profile.weightUnit) : null
      if (targetKg == null || targetKg < LIMITS.bodyWeightKgMin) {
        setError('Enter a realistic target weight.')
        return
      }
      if (currentWeight == null && !editing) {
        setError('Log your current body weight first (Progress → Log weight).')
        return
      }
      goal = {
        ...base,
        type: 'body-weight',
        startWeightKg: editing?.type === 'body-weight' ? editing.startWeightKg : currentWeight!,
        targetWeightKg: targetKg,
      }
    } else if (type === 'strength') {
      const parsed = parsePositiveNumber(value, LIMITS.weightKgMax * 2.3)
      const targetKg = parsed != null ? weightToKg(parsed, profile.weightUnit) : null
      if (targetKg == null) {
        setError('Enter a target weight for the lift.')
        return
      }
      const best = records.strength.get(exerciseId)?.bestWeightKg ?? 0
      goal = {
        ...base,
        type: 'strength',
        exerciseId,
        startWeightKg: editing?.type === 'strength' ? editing.startWeightKg : best,
        targetWeightKg: targetKg,
      }
    } else if (type === 'consistency') {
      const parsed = parsePositiveInt(value, 14)
      if (parsed == null) {
        setError('Enter a number of sessions between 1 and 14.')
        return
      }
      goal = { ...base, type: 'consistency', sessionsPerWeek: parsed }
    } else {
      const parsed = parsePositiveInt(value, 7 * 24 * 60)
      if (parsed == null) {
        setError('Enter weekly cardio minutes (e.g. 90).')
        return
      }
      goal = { ...base, type: 'endurance', minutesPerWeek: parsed }
    }

    setError(null)
    if (editing) {
      updateGoal(editing.id, () => goal)
      toast({ tone: 'success', title: 'Goal updated' })
    } else {
      addGoal(goal)
      toast({ tone: 'success', title: 'Goal set', description: 'Progress updates automatically as you train.' })
    }
    onClose()
  }

  const targetLabel =
    type === 'body-weight'
      ? `Target weight (${profile.weightUnit})`
      : type === 'strength'
        ? `Target weight (${profile.weightUnit})`
        : type === 'consistency'
          ? 'Sessions per week'
          : 'Cardio minutes per week'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit goal' : 'New goal'}
      subtitle={editing ? undefined : 'Pick a goal type — progress is measured from your real activity.'}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            {editing ? 'Save changes' : 'Set goal'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!editing ? (
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(GOAL_TYPE_META) as GoalType[]).map((t) => {
              const meta = GOAL_TYPE_META[t]
              const Icon = meta.icon
              const active = type === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t)
                    setError(null)
                  }}
                  aria-pressed={active}
                  className={`rounded-xl border p-3 text-left transition ${
                    active ? 'border-accent bg-accent/10' : 'border-edge bg-raised hover:border-edge-strong'
                  }`}
                >
                  <Icon className={`size-4 ${active ? 'text-accent-strong dark:text-accent' : 'text-soft'}`} aria-hidden />
                  <p className="mt-1.5 text-sm font-semibold text-ink">{meta.label}</p>
                  <p className="text-xs text-soft">{meta.blurb}</p>
                </button>
              )
            })}
          </div>
        ) : null}

        {type === 'strength' ? (
          <SelectField label="Exercise" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
            {strengthExercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </SelectField>
        ) : null}

        <TextField
          label={targetLabel}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          inputMode="decimal"
          placeholder={type === 'consistency' ? 'e.g. 4' : type === 'endurance' ? 'e.g. 90' : 'e.g. 80'}
          error={error}
          hint={
            type === 'body-weight' && currentWeight != null
              ? `Current: ${formatWeight(currentWeight, profile.weightUnit)}`
              : type === 'strength'
                ? (() => {
                    const best = records.strength.get(exerciseId)
                    return best ? `Current best: ${formatWeight(best.bestWeightKg, profile.weightUnit)} × ${best.bestWeightReps}` : undefined
                  })()
                : undefined
          }
        />

        <TextField
          label="Name (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={target.trim() ? defaultTitle() : 'Auto-named from your target'}
        />
      </div>
    </Modal>
  )
}

export default function GoalsPage() {
  const { data, resolveExercise, exercises, deleteGoal } = useAppData()
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | undefined>(undefined)
  const [deleting, setDeleting] = useState<Goal | undefined>(undefined)

  const ctx = useMemo(
    () => ({ workouts: data.workouts, metrics: data.metrics, resolve: resolveExercise, exercises }),
    [data.workouts, data.metrics, resolveExercise, exercises],
  )

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Goals"
        subtitle="Measurable targets, tracked automatically from your training."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4" aria-hidden />
            New goal
          </Button>
        }
      />

      {data.goals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.goals.map((goal) => {
            const progress = goalProgress(goal, ctx)
            const meta = GOAL_TYPE_META[goal.type]
            return (
              <Card key={goal.id} className={`p-5 ${progress.achieved ? 'border-success/40' : ''}`}>
                <div className="flex items-start gap-4">
                  <ProgressRing
                    fraction={progress.fraction}
                    size={64}
                    strokeWidth={6}
                    color={progress.achieved ? 'var(--c-success)' : 'var(--c-accent)'}
                  >
                    {progress.achieved ? (
                      <Trophy className="size-5 text-success" aria-hidden />
                    ) : (
                      <span className="tnum text-xs font-bold text-ink">{Math.round(progress.fraction * 100)}%</span>
                    )}
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-ink">{goal.title}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Pill tone={progress.achieved ? 'success' : 'neutral'}>
                            {progress.achieved ? 'Achieved' : meta.label}
                          </Pill>
                          {goal.type === 'body-weight' && goal.targetDate ? (
                            <span className="text-xs text-faint">by {formatDateShort(goal.targetDate)}</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <IconButton
                          aria-label={`Edit goal ${goal.title}`}
                          size="sm"
                          onClick={() => {
                            setEditing(goal)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </IconButton>
                        <IconButton
                          aria-label={`Delete goal ${goal.title}`}
                          size="sm"
                          onClick={() => setDeleting(goal)}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </IconButton>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-soft">{progress.label}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No goals yet"
          body="Set a target — lose weight, hit a lift, train consistently, or build endurance — and Pulse tracks it from your real activity."
          action={
            <Button variant="primary" onClick={() => setFormOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Set your first goal
            </Button>
          }
        />
      )}

      {formOpen ? (
        <GoalFormModal
          key={editing?.id ?? 'new'}
          open={formOpen}
          editing={editing}
          onClose={() => {
            setFormOpen(false)
            setEditing(undefined)
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete “${deleting?.title}”?`}
        body="The goal and its progress tracking will be removed. Your workouts and metrics are untouched."
        confirmLabel="Delete goal"
        danger
        onConfirm={() => {
          if (deleting) {
            deleteGoal(deleting.id)
            toast({ tone: 'info', title: 'Goal deleted' })
          }
          setDeleting(undefined)
        }}
        onCancel={() => setDeleting(undefined)}
      />
    </div>
  )
}
