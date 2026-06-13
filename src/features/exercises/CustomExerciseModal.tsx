import { useState } from 'react'
import type { Exercise, ExerciseCategory, ExerciseMetric } from '@/types'
import { EXERCISE_CATEGORIES } from '@/types'
import { useAppData } from '@/state/AppDataContext'
import { useToast } from '@/state/ToastContext'
import { newId } from '@/lib/id'
import { LIMITS, hasErrors } from '@/lib/validation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field'
import { CATEGORY_LABELS } from '@/data/exerciseLibrary'

const METRIC_LABELS: Record<ExerciseMetric, string> = {
  'weight-reps': 'Weight × reps (e.g. bench press)',
  reps: 'Reps only (e.g. push-ups)',
  duration: 'Time (e.g. plank)',
  'distance-duration': 'Distance + time (e.g. running)',
}

/** Default MET by how the exercise is logged — used for calorie estimates. */
const METRIC_MET: Record<ExerciseMetric, number> = {
  'weight-reps': 5,
  reps: 5,
  duration: 5,
  'distance-duration': 7,
}

export function CustomExerciseModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated?: (exercise: Exercise) => void
}) {
  const { exercises, addCustomExercise } = useAppData()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ExerciseCategory>('chest')
  const [metric, setMetric] = useState<ExerciseMetric>('weight-reps')
  const [equipment, setEquipment] = useState('')
  const [muscles, setMuscles] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<{ name?: string }>({})

  function reset() {
    setName('')
    setCategory('chest')
    setMetric('weight-reps')
    setEquipment('')
    setMuscles('')
    setDescription('')
    setErrors({})
  }

  function save() {
    const trimmed = name.trim()
    const nextErrors: { name?: string } = {}
    if (!trimmed) nextErrors.name = 'Name is required.'
    else if (trimmed.length > LIMITS.nameMax) nextErrors.name = `Keep it under ${LIMITS.nameMax} characters.`
    else if (exercises.some((e) => e.name.toLowerCase() === trimmed.toLowerCase()))
      nextErrors.name = 'An exercise with this name already exists.'
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    const exercise: Exercise = {
      id: `custom-${newId()}`,
      name: trimmed,
      category,
      metric,
      equipment: equipment.trim() || 'Other',
      muscles: muscles
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
      description: description.trim() || 'Custom exercise.',
      met: METRIC_MET[metric],
      isCustom: true,
    }
    addCustomExercise(exercise)
    toast({ tone: 'success', title: 'Exercise created', description: `“${exercise.name}” is in your library.` })
    onCreated?.(exercise)
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New custom exercise"
      subtitle="Add a movement that isn't in the library."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            Create exercise
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Landmine Press"
          error={errors.name}
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value as ExerciseCategory)}>
            {EXERCISE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Logged as" value={metric} onChange={(e) => setMetric(e.target.value as ExerciseMetric)}>
            {(Object.keys(METRIC_LABELS) as ExerciseMetric[]).map((m) => (
              <option key={m} value={m}>
                {METRIC_LABELS[m]}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField
          label="Equipment (optional)"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          placeholder="e.g. Barbell"
        />
        <TextField
          label="Muscles (optional, comma-separated)"
          value={muscles}
          onChange={(e) => setMuscles(e.target.value)}
          placeholder="e.g. Shoulders, Triceps"
        />
        <TextAreaField
          label="Notes (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Setup cues, form reminders…"
        />
      </div>
    </Modal>
  )
}
