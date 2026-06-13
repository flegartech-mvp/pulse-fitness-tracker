import { useEffect, useState } from 'react'
import { useNow } from '@/lib/useNow'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Check, Dumbbell, Flag, Plus, Timer, X } from 'lucide-react'
import type { Exercise, WorkoutSet } from '@/types'
import { useAppData, useProfile } from '@/state/AppDataContext'
import { useWorkoutActions } from './useWorkoutActions'
import { newId } from '@/lib/id'
import { countSets } from '@/lib/calc'
import { formatClock } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/Progress'
import { CategoryBadge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ExercisePicker } from './ExercisePicker'
import { SetInputs, setColumns } from './SetInputs'

/** Floating rest countdown that appears after checking off a set. */
function RestTimer({ endsAt, onDone }: { endsAt: number; onDone: () => void }) {
  const now = useNow(250)
  const remaining = Math.ceil((endsAt - now) / 1000)
  useEffect(() => {
    if (remaining <= 0) onDone()
  }, [remaining, onDone])
  if (remaining <= 0) return null
  return (
    <div className="fixed bottom-36 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-sky/40 bg-raised/95 py-2 pl-3 pr-2 shadow-pop backdrop-blur lg:bottom-24">
      <Timer className="size-4 text-sky" aria-hidden />
      <span className="text-xs font-semibold text-soft">Rest</span>
      <span className="tnum w-12 text-center text-base font-bold text-ink">{formatClock(remaining)}</span>
      <Button size="sm" variant="ghost" onClick={onDone}>
        Skip
      </Button>
    </div>
  )
}

export default function ActiveWorkoutPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, updateWorkout, resolveExercise } = useAppData()
  const profile = useProfile()
  const { finishWorkout, discardSession } = useWorkoutActions()
  const now = useNow()

  const workout = data.workouts.find((w) => w.id === id)
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Deep links: a planned workout opened here starts automatically.
  useEffect(() => {
    if (workout && workout.status === 'planned') {
      updateWorkout(workout.id, (w) => ({
        ...w,
        status: 'active',
        startedAt: w.startedAt ?? new Date().toISOString(),
      }))
    }
  }, [workout, updateWorkout])

  const total = workout ? countSets(workout) : 0
  const done = workout ? countSets(workout, true) : 0

  const elapsed = workout?.startedAt ? (now - new Date(workout.startedAt).getTime()) / 1000 : 0

  if (!workout) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Workout not found"
        body="It may have been deleted."
        action={<Button onClick={() => navigate('/workouts')}>Back to workouts</Button>}
      />
    )
  }

  if (workout.status === 'completed') {
    return <Navigate to={`/workouts/${workout.id}`} replace />
  }

  function toggleSet(entryId: string, set: WorkoutSet, restSec: number) {
    const nowDone = !set.done
    updateWorkout(workout!.id, (w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id === entryId ? { ...e, sets: e.sets.map((s) => (s.id === set.id ? { ...s, done: nowDone } : s)) } : e,
      ),
    }))
    if (nowDone && restSec > 0) setRestEndsAt(Date.now() + restSec * 1000)
    if (!nowDone) setRestEndsAt(null)
  }

  function addExercise(exercise: Exercise) {
    updateWorkout(workout!.id, (w) => ({
      ...w,
      exercises: [
        ...w.exercises,
        {
          id: newId(),
          exerciseId: exercise.id,
          restSec: exercise.metric === 'weight-reps' ? 90 : exercise.metric === 'reps' ? 60 : 0,
          sets: [
            exercise.metric === 'duration'
              ? { id: newId(), durationSec: 60, done: false }
              : exercise.metric === 'distance-duration'
                ? { id: newId(), durationSec: 1800, done: false }
                : { id: newId(), reps: exercise.metric === 'reps' ? 10 : 8, done: false },
          ],
        },
      ],
    }))
    setPickerOpen(false)
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      {/* Session header */}
      <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-edge bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:rounded-2xl lg:border lg:bg-surface/95">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-strong dark:text-accent">
              In session
            </p>
            <h1 className="truncate text-lg font-bold tracking-tight text-ink">{workout.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="tnum rounded-xl border border-edge bg-raised px-3 py-1.5 text-base font-bold text-ink">
              {formatClock(elapsed)}
            </span>
            <Button
              variant="primary"
              onClick={() => (done < total ? setConfirmFinish(true) : finishWorkout(workout.id))}
            >
              <Flag className="size-4" aria-hidden />
              Finish
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar fraction={total > 0 ? done / total : 0} className="flex-1" />
          <span className="tnum shrink-0 text-xs font-semibold text-soft">
            {done}/{total} sets
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {workout.exercises.map((entry) => {
          const exercise = resolveExercise(entry.exerciseId)
          if (!exercise) return null
          const columns = setColumns(exercise.metric, profile.weightUnit, profile.lengthUnit)
          const allDone = entry.sets.length > 0 && entry.sets.every((s) => s.done)
          return (
            <Card key={entry.id} className={`p-4 transition sm:p-5 ${allDone ? 'opacity-70' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-ink">{exercise.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <CategoryBadge category={exercise.category} />
                    {entry.restSec > 0 ? (
                      <span className="text-xs text-faint">rest {entry.restSec}s</span>
                    ) : null}
                  </div>
                </div>
                {allDone ? <Check className="size-5 shrink-0 text-success" aria-hidden /> : null}
              </div>

              <div className="mt-4">
                <div
                  className="grid items-center gap-2 px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-faint"
                  style={{ gridTemplateColumns: `2rem repeat(${columns.length}, minmax(0,1fr)) 3rem` }}
                >
                  <span>Set</span>
                  {columns.map((c) => (
                    <span key={c} className="text-center">
                      {c}
                    </span>
                  ))}
                  <span className="text-center">✓</span>
                </div>
                <div className="space-y-1.5">
                  {entry.sets.map((set, setIndex) => (
                    <div
                      key={set.id}
                      className="grid items-center gap-2"
                      style={{ gridTemplateColumns: `2rem repeat(${columns.length}, minmax(0,1fr)) 3rem` }}
                    >
                      <span className="tnum pl-1 text-xs font-semibold text-soft">{setIndex + 1}</span>
                      <SetInputs
                        metric={exercise.metric}
                        set={set}
                        weightUnit={profile.weightUnit}
                        lengthUnit={profile.lengthUnit}
                        onChange={(patch) =>
                          updateWorkout(workout.id, (w) => ({
                            ...w,
                            exercises: w.exercises.map((e) =>
                              e.id === entry.id
                                ? { ...e, sets: e.sets.map((s) => (s.id === set.id ? { ...s, ...patch } : s)) }
                                : e,
                            ),
                          }))
                        }
                      />
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => toggleSet(entry.id, set, entry.restSec)}
                          aria-label={set.done ? `Mark set ${setIndex + 1} not done` : `Mark set ${setIndex + 1} done`}
                          aria-pressed={set.done}
                          className={`flex size-9 items-center justify-center rounded-lg border transition active:scale-95 ${
                            set.done
                              ? 'border-accent bg-accent text-on-accent'
                              : 'border-edge bg-raised text-faint hover:border-accent hover:text-ink'
                          }`}
                        >
                          <Check className="size-4" strokeWidth={3} aria-hidden />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() =>
                    updateWorkout(workout.id, (w) => ({
                      ...w,
                      exercises: w.exercises.map((e) => {
                        if (e.id !== entry.id) return e
                        const last = e.sets.at(-1)
                        return {
                          ...e,
                          sets: [
                            ...e.sets,
                            {
                              id: newId(),
                              reps: last?.reps,
                              weightKg: last?.weightKg,
                              durationSec: last?.durationSec,
                              distanceKm: last?.distanceKm,
                              done: false,
                            },
                          ],
                        }
                      }),
                    }))
                  }
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add set
                </Button>
              </div>
            </Card>
          )
        })}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => setPickerOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Add exercise
          </Button>
          <Button variant="danger-soft" className="flex-1" onClick={() => setConfirmDiscard(true)}>
            <X className="size-4" aria-hidden />
            Discard session
          </Button>
        </div>
      </div>

      {restEndsAt != null ? <RestTimer endsAt={restEndsAt} onDone={() => setRestEndsAt(null)} /> : null}

      <ConfirmDialog
        open={confirmFinish}
        title="Finish with unchecked sets?"
        body={`${total - done} of ${total} sets aren't marked done. They'll be saved as skipped and won't count toward your stats.`}
        confirmLabel="Finish workout"
        onConfirm={() => {
          setConfirmFinish(false)
          finishWorkout(workout.id)
        }}
        onCancel={() => setConfirmFinish(false)}
      />
      <ConfirmDialog
        open={confirmDiscard}
        title="Discard this session?"
        body="Progress from this session will be cleared and the workout returns to your plan."
        confirmLabel="Discard"
        danger
        onConfirm={() => {
          setConfirmDiscard(false)
          discardSession(workout.id)
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={addExercise} />
    </div>
  )
}
