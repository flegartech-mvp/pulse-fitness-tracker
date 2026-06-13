import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react'
import type { Exercise, Workout, WorkoutExercise, WorkoutSet } from '@/types'
import { useAppData, useProfile } from '@/state/AppDataContext'
import { useToast } from '@/state/ToastContext'
import { useWorkoutActions } from './useWorkoutActions'
import { newId } from '@/lib/id'
import { formatDateShort, todayKey } from '@/lib/dates'
import { validateWorkoutName } from '@/lib/validation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextAreaField, TextField, SelectField } from '@/components/ui/Field'
import { CategoryBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dumbbell } from 'lucide-react'
import { ExercisePicker } from './ExercisePicker'
import { SetInputs, setColumns } from './SetInputs'

const REST_OPTIONS = [0, 30, 45, 60, 90, 120, 150, 180, 240]

function emptySetFor(exercise: Exercise, copyFrom?: WorkoutSet): WorkoutSet {
  if (copyFrom) {
    return {
      id: newId(),
      reps: copyFrom.reps,
      weightKg: copyFrom.weightKg,
      durationSec: copyFrom.durationSec,
      distanceKm: copyFrom.distanceKm,
      done: false,
    }
  }
  switch (exercise.metric) {
    case 'weight-reps':
      return { id: newId(), reps: 8, weightKg: undefined, done: false }
    case 'reps':
      return { id: newId(), reps: 10, done: false }
    case 'duration':
      return { id: newId(), durationSec: 60, done: false }
    case 'distance-duration':
      return { id: newId(), durationSec: 1800, distanceKm: undefined, done: false }
  }
}

/** Create (/workouts/new) and edit (/workouts/:id/edit) share this page. */
export default function WorkoutBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, addWorkout, updateWorkout, resolveExercise } = useAppData()
  const profile = useProfile()
  const { toast } = useToast()
  const { startWorkout } = useWorkoutActions()

  const existing = id ? data.workouts.find((w) => w.id === id) : undefined
  const isEdit = Boolean(id)

  const [draft, setDraft] = useState<Workout>(() =>
    existing
      ? structuredClone(existing)
      : {
          id: newId(),
          name: '',
          status: 'planned',
          exercises: [],
          createdAt: new Date().toISOString(),
          scheduledFor: todayKey(),
        },
  )
  const [nameError, setNameError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const namePlaceholder = useMemo(() => `Workout · ${formatDateShort(draft.scheduledFor ?? todayKey())}`, [draft.scheduledFor])

  if (isEdit && !existing) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Workout not found"
        body="It may have been deleted."
        action={<Button onClick={() => navigate('/workouts')}>Back to workouts</Button>}
      />
    )
  }

  function patchExercise(entryId: string, patch: Partial<WorkoutExercise>) {
    setDraft((d) => ({
      ...d,
      exercises: d.exercises.map((e) => (e.id === entryId ? { ...e, ...patch } : e)),
    }))
  }

  function patchSet(entryId: string, setId: string, patch: Partial<WorkoutSet>) {
    setDraft((d) => ({
      ...d,
      exercises: d.exercises.map((e) =>
        e.id === entryId ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) } : e,
      ),
    }))
  }

  function addExercise(exercise: Exercise) {
    const entry: WorkoutExercise = {
      id: newId(),
      exerciseId: exercise.id,
      restSec: exercise.metric === 'weight-reps' ? 90 : exercise.metric === 'reps' ? 60 : 0,
      sets: [emptySetFor(exercise), emptySetFor(exercise), emptySetFor(exercise)],
    }
    setDraft((d) => ({ ...d, exercises: [...d.exercises, entry] }))
    setPickerOpen(false)
  }

  function moveExercise(index: number, dir: -1 | 1) {
    setDraft((d) => {
      const list = [...d.exercises]
      const target = index + dir
      if (target < 0 || target >= list.length) return d
      const [item] = list.splice(index, 1)
      list.splice(target, 0, item!)
      return { ...d, exercises: list }
    })
  }

  function save(startAfter = false) {
    const error = draft.name.trim() ? validateWorkoutName(draft.name) : null
    setNameError(error)
    if (error) return
    if (draft.exercises.length === 0) {
      toast({ tone: 'warning', title: 'Add at least one exercise', description: 'A workout needs something to do.' })
      return
    }
    const cleaned: Workout = {
      ...draft,
      name: draft.name.trim() || namePlaceholder,
      exercises: draft.exercises.filter((e) => e.sets.length > 0),
      notes: draft.notes?.trim() || undefined,
    }
    if (isEdit) {
      updateWorkout(cleaned.id, () => cleaned)
      toast({ tone: 'success', title: 'Workout updated' })
    } else {
      addWorkout(cleaned)
      toast({ tone: 'success', title: 'Workout saved', description: 'Added to your plan.' })
    }
    if (startAfter) startWorkout(cleaned.id)
    else navigate(`/workouts/${cleaned.id}`)
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <PageHeader
        title={isEdit ? 'Edit workout' : 'New workout'}
        subtitle={isEdit ? 'Adjust exercises, sets, and targets.' : 'Build the session, then start it now or save it for later.'}
      />

      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <TextField
            label="Name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder={namePlaceholder}
            error={nameError}
          />
          <TextField
            label="Scheduled for"
            type="date"
            value={draft.scheduledFor ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, scheduledFor: e.target.value || undefined }))}
            className="sm:w-44"
          />
        </div>
        <TextAreaField
          label="Notes (optional)"
          value={draft.notes ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          placeholder="Focus, cues, how you want this session to go…"
        />
      </Card>

      <div className="mt-5 space-y-4">
        {draft.exercises.map((entry, index) => {
          const exercise = resolveExercise(entry.exerciseId)
          if (!exercise) return null
          const columns = setColumns(exercise.metric, profile.weightUnit, profile.lengthUnit)
          return (
            <Card key={entry.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-ink">{exercise.name}</h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    <CategoryBadge category={exercise.category} />
                    <span className="text-xs text-faint">{exercise.equipment}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <IconButton aria-label="Move exercise up" size="sm" disabled={index === 0} onClick={() => moveExercise(index, -1)}>
                    <ArrowUp className="size-4" aria-hidden />
                  </IconButton>
                  <IconButton
                    aria-label="Move exercise down"
                    size="sm"
                    disabled={index === draft.exercises.length - 1}
                    onClick={() => moveExercise(index, 1)}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </IconButton>
                  <IconButton
                    aria-label={`Remove ${exercise.name}`}
                    size="sm"
                    className="text-danger hover:bg-danger/10"
                    onClick={() => setDraft((d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== entry.id) }))}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </IconButton>
                </div>
              </div>

              <div className="mt-4">
                <div
                  className="grid items-center gap-2 px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-faint"
                  style={{ gridTemplateColumns: `2rem repeat(${columns.length}, minmax(0,1fr)) 4.5rem` }}
                >
                  <span>Set</span>
                  {columns.map((c) => (
                    <span key={c} className="text-center">
                      {c}
                    </span>
                  ))}
                  <span />
                </div>
                <div className="space-y-1.5">
                  {entry.sets.map((set, setIndex) => (
                    <div
                      key={set.id}
                      className="grid items-center gap-2"
                      style={{ gridTemplateColumns: `2rem repeat(${columns.length}, minmax(0,1fr)) 4.5rem` }}
                    >
                      <span className="tnum pl-1 text-xs font-semibold text-soft">{setIndex + 1}</span>
                      <SetInputs
                        metric={exercise.metric}
                        set={set}
                        weightUnit={profile.weightUnit}
                        lengthUnit={profile.lengthUnit}
                        onChange={(patch) => patchSet(entry.id, set.id, patch)}
                      />
                      <div className="flex justify-end gap-0.5">
                        <IconButton
                          aria-label="Duplicate set"
                          size="sm"
                          onClick={() =>
                            patchExercise(entry.id, { sets: [...entry.sets, emptySetFor(exercise, set)] })
                          }
                        >
                          <Copy className="size-3.5" aria-hidden />
                        </IconButton>
                        <IconButton
                          aria-label="Remove set"
                          size="sm"
                          disabled={entry.sets.length <= 1}
                          onClick={() => patchExercise(entry.id, { sets: entry.sets.filter((s) => s.id !== set.id) })}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      patchExercise(entry.id, { sets: [...entry.sets, emptySetFor(exercise, entry.sets.at(-1))] })
                    }
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Add set
                  </Button>
                  {exercise.metric === 'weight-reps' || exercise.metric === 'reps' ? (
                    <label className="flex items-center gap-2 text-xs text-soft">
                      Rest
                      <SelectField
                        value={String(entry.restSec)}
                        onChange={(e) => patchExercise(entry.id, { restSec: Number(e.target.value) })}
                        aria-label="Rest between sets"
                        className="!h-8 w-24 !text-xs"
                      >
                        {REST_OPTIONS.map((sec) => (
                          <option key={sec} value={sec}>
                            {sec === 0 ? 'none' : sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m${sec % 60 ? ` ${sec % 60}s` : ''}`}
                          </option>
                        ))}
                      </SelectField>
                    </label>
                  ) : null}
                </div>
              </div>
            </Card>
          )
        })}

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-edge-strong py-5 text-sm font-semibold text-soft transition hover:border-accent hover:text-ink"
        >
          <Plus className="size-4" aria-hidden />
          Add exercise
        </button>
      </div>

      <div className="sticky bottom-20 mt-6 flex justify-end gap-2 rounded-2xl border border-edge bg-surface/95 p-3 shadow-pop backdrop-blur lg:bottom-4">
        <Button onClick={() => navigate(-1)}>Cancel</Button>
        <Button variant="secondary" onClick={() => save(false)}>
          {isEdit ? 'Save changes' : 'Save for later'}
        </Button>
        {!isEdit || existing?.status === 'planned' ? (
          <Button variant="primary" onClick={() => save(true)}>
            Save & start
          </Button>
        ) : null}
      </div>

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={addExercise} />
    </div>
  )
}
