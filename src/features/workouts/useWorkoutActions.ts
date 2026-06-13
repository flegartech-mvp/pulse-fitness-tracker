import { useNavigate } from 'react-router-dom'
import type { Workout } from '@/types'
import { useAppData } from '@/state/AppDataContext'
import { useToast } from '@/state/ToastContext'
import { newId } from '@/lib/id'
import { todayKey } from '@/lib/dates'
import { estimateWorkoutDurationSec, workoutVolumeKg } from '@/lib/calc'
import { prsInWorkout } from '@/lib/stats'
import { formatDuration, formatVolume } from '@/lib/format'
import { formatWeight } from '@/lib/units'
import { useProfile } from '@/state/AppDataContext'

/** Start / finish / cancel / duplicate / delete logic shared across pages. */
export function useWorkoutActions() {
  const { data, updateWorkout, addWorkout, deleteWorkout, resolveExercise } = useAppData()
  const profile = useProfile()
  const { toast } = useToast()
  const navigate = useNavigate()

  function startWorkout(id: string) {
    const existing = data.workouts.find((w) => w.status === 'active')
    if (existing && existing.id !== id) {
      toast({
        tone: 'warning',
        title: 'A workout is already running',
        description: `Finish or discard “${existing.name}” first.`,
      })
      navigate(`/workouts/${existing.id}/active`)
      return
    }
    if (!existing) {
      updateWorkout(id, (w) => ({
        ...w,
        status: 'active',
        startedAt: w.startedAt ?? new Date().toISOString(),
      }))
    }
    navigate(`/workouts/${id}/active`)
  }

  function finishWorkout(id: string) {
    const current = data.workouts.find((w) => w.id === id)
    if (!current) return
    const completedAt = new Date().toISOString()
    const durationSec = current.startedAt
      ? Math.max(60, Math.round((Date.now() - new Date(current.startedAt).getTime()) / 1000))
      : estimateWorkoutDurationSec(current, resolveExercise)
    const completed: Workout = { ...current, status: 'completed', completedAt, durationSec }
    updateWorkout(id, () => completed)

    const volume = workoutVolumeKg(completed)
    toast({
      tone: 'success',
      title: 'Workout complete 💪',
      description: `${formatVolume(volume, profile.weightUnit)} of volume in ${formatDuration(durationSec)}.`,
    })

    const others = data.workouts.filter((w) => w.id !== id)
    const prs = prsInWorkout(completed, [...others, completed], resolveExercise)
    for (const pr of prs.slice(0, 2)) {
      const exercise = resolveExercise(pr.exerciseId)
      toast({
        tone: 'record',
        title: `New record — ${exercise?.name ?? 'Exercise'}`,
        description: `${formatWeight(pr.bestWeightKg, profile.weightUnit)} × ${pr.bestWeightReps} reps`,
      })
    }
    navigate(`/workouts/${id}`)
  }

  /** Reverts an active session to planned, clearing progress. */
  function discardSession(id: string) {
    updateWorkout(id, (w) => ({
      ...w,
      status: 'planned',
      startedAt: undefined,
      exercises: w.exercises.map((e) => ({
        ...e,
        sets: e.sets.map((s) => ({ ...s, done: false })),
      })),
    }))
    toast({ tone: 'info', title: 'Session discarded', description: 'The workout is back in your plan.' })
    navigate('/workouts')
  }

  /** Copies any workout into a fresh planned session for today. */
  function repeatWorkout(source: Workout) {
    const id = newId()
    addWorkout({
      id,
      name: source.name,
      status: 'planned',
      notes: source.notes,
      createdAt: new Date().toISOString(),
      scheduledFor: todayKey(),
      exercises: source.exercises.map((e) => ({
        id: newId(),
        exerciseId: e.exerciseId,
        restSec: e.restSec,
        sets: e.sets.map((s) => ({
          id: newId(),
          reps: s.reps,
          weightKg: s.weightKg,
          durationSec: s.durationSec,
          distanceKm: s.distanceKm,
          done: false,
        })),
      })),
    })
    toast({ tone: 'success', title: 'Workout planned', description: `“${source.name}” was added for today.` })
    navigate(`/workouts/${id}`)
  }

  function removeWorkout(id: string) {
    deleteWorkout(id)
    toast({ tone: 'info', title: 'Workout deleted' })
  }

  return { startWorkout, finishWorkout, discardSession, repeatWorkout, removeWorkout }
}
