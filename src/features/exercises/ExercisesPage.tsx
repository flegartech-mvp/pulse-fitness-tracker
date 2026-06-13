import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, Plus, Search, Sparkles, Trash2, Trophy } from 'lucide-react'
import type { Exercise, ExerciseCategory } from '@/types'
import { EXERCISE_CATEGORIES } from '@/types'
import { useAppData, useProfile } from '@/state/AppDataContext'
import { useToast } from '@/state/ToastContext'
import { buildRecordBook, categorySplit, completedWorkouts } from '@/lib/stats'
import { isoToDateKey, formatDateShort } from '@/lib/dates'
import { formatWeight } from '@/lib/units'
import { formatClock } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, InteractiveCard } from '@/components/ui/Card'
import { CategoryBadge, Pill } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CATEGORY_LABELS } from '@/data/exerciseLibrary'
import { CustomExerciseModal } from './CustomExerciseModal'

function isCategory(value: string | null): value is ExerciseCategory {
  return Boolean(value && (EXERCISE_CATEGORIES as readonly string[]).includes(value))
}

/** Per-exercise usage stats for the detail panel. */
function useExerciseStats(exercise: Exercise | null) {
  const { data, resolveExercise } = useAppData()
  return useMemo(() => {
    if (!exercise) return null
    const records = buildRecordBook(data.workouts, resolveExercise)
    let timesPerformed = 0
    let lastPerformed: string | undefined
    for (const w of completedWorkouts(data.workouts)) {
      if (w.exercises.some((e) => e.exerciseId === exercise.id && e.sets.some((s) => s.done))) {
        timesPerformed += 1
        lastPerformed = isoToDateKey(w.completedAt!)
      }
    }
    return {
      timesPerformed,
      lastPerformed,
      strength: records.strength.get(exercise.id),
      reps: records.reps.get(exercise.id),
      cardio: records.cardio.get(exercise.id),
    }
  }, [exercise, data.workouts, resolveExercise])
}

function ExerciseDetailModal({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  const profile = useProfile()
  const { deleteCustomExercise } = useAppData()
  const { toast } = useToast()
  const stats = useExerciseStats(exercise)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!exercise) return null

  return (
    <>
      <Modal open={!confirmDelete} onClose={onClose} title={exercise.name} subtitle={exercise.equipment}>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={exercise.category} />
            {exercise.isCustom ? <Pill>Custom</Pill> : null}
            {exercise.muscles.map((m) => (
              <span key={m} className="rounded-full bg-raised px-2.5 py-0.5 text-[11px] font-medium text-soft">
                {m}
              </span>
            ))}
          </div>

          <p className="text-sm leading-relaxed text-soft">{exercise.description}</p>

          {stats ? (
            <div className="rounded-xl border border-edge bg-raised/60 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
                <Trophy className="size-3.5" aria-hidden />
                Your stats
              </p>
              {stats.timesPerformed > 0 ? (
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-soft">Times performed</dt>
                    <dd className="tnum mt-0.5 font-bold text-ink">{stats.timesPerformed}</dd>
                  </div>
                  {stats.lastPerformed ? (
                    <div>
                      <dt className="text-xs text-soft">Last performed</dt>
                      <dd className="mt-0.5 font-bold text-ink">{formatDateShort(stats.lastPerformed)}</dd>
                    </div>
                  ) : null}
                  {stats.strength ? (
                    <>
                      <div>
                        <dt className="text-xs text-soft">Best set</dt>
                        <dd className="tnum mt-0.5 font-bold text-ink">
                          {formatWeight(stats.strength.bestWeightKg, profile.weightUnit)} × {stats.strength.bestWeightReps}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-soft">Est. 1RM</dt>
                        <dd className="tnum mt-0.5 font-bold text-ink">
                          {formatWeight(stats.strength.est1RmKg, profile.weightUnit)}
                        </dd>
                      </div>
                    </>
                  ) : null}
                  {stats.reps ? (
                    <div>
                      <dt className="text-xs text-soft">Best reps</dt>
                      <dd className="tnum mt-0.5 font-bold text-ink">{stats.reps.bestReps}</dd>
                    </div>
                  ) : null}
                  {stats.cardio?.longestDurationSec ? (
                    <div>
                      <dt className="text-xs text-soft">Longest session</dt>
                      <dd className="tnum mt-0.5 font-bold text-ink">{formatClock(stats.cardio.longestDurationSec)}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className="text-sm text-soft">You haven't logged this exercise yet.</p>
              )}
            </div>
          ) : null}

          {exercise.isCustom ? (
            <Button variant="danger-soft" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-3.5" aria-hidden />
              Delete custom exercise
            </Button>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete “${exercise.name}”?`}
        body="This removes the exercise from your library. Exercises used in any workout can't be deleted."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          const ok = deleteCustomExercise(exercise.id)
          setConfirmDelete(false)
          if (ok) {
            toast({ tone: 'info', title: 'Exercise deleted' })
            onClose()
          } else {
            toast({
              tone: 'warning',
              title: "Can't delete this exercise",
              description: 'One or more workouts still use it. Delete those first.',
            })
          }
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}

export default function ExercisesPage() {
  const { data, exercises, resolveExercise } = useAppData()
  const profile = useProfile()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [showCustomForm, setShowCustomForm] = useState(false)

  const categoryParam = searchParams.get('category')
  const category: ExerciseCategory | 'all' = isCategory(categoryParam) ? categoryParam : 'all'

  const records = useMemo(() => buildRecordBook(data.workouts, resolveExercise), [data.workouts, resolveExercise])

  /** Categories you've trained least in 3 weeks → suggested exercises. */
  const suggested = useMemo(() => {
    const split = categorySplit(data.workouts, resolveExercise, 21)
    const ranked = [...EXERCISE_CATEGORIES]
      .filter((c) => c !== 'fullbody')
      .sort((a, b) => (split.get(a) ?? 0) - (split.get(b) ?? 0))
      .slice(0, 3)
    const picks: Exercise[] = []
    for (const cat of ranked) {
      const candidates = exercises.filter((e) => e.category === cat)
      if (candidates.length > 0) picks.push(candidates[Math.min(1, candidates.length - 1)]!)
    }
    return picks
  }, [data.workouts, resolveExercise, exercises])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter((e) => {
      if (category !== 'all' && e.category !== category) return false
      if (!q) return true
      return (
        e.name.toLowerCase().includes(q) ||
        e.equipment.toLowerCase().includes(q) ||
        e.muscles.some((m) => m.toLowerCase().includes(q))
      )
    })
  }, [exercises, query, category])

  function setCategory(next: ExerciseCategory | 'all') {
    setSearchParams(next === 'all' ? {} : { category: next }, { replace: true })
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Exercise library"
        subtitle={`${exercises.length} movements across ${EXERCISE_CATEGORIES.length} categories.`}
        actions={
          <Button variant="primary" onClick={() => setShowCustomForm(true)}>
            <Plus className="size-4" aria-hidden />
            New exercise
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, equipment, or muscle…"
          aria-label="Search exercises"
          className="h-11 w-full rounded-xl border border-edge bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-faint transition focus:border-accent focus:outline-none"
        />
      </div>

      <div className="scroll-slim -mx-1 mb-6 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            category === 'all' ? 'bg-accent text-on-accent' : 'border border-edge bg-surface text-soft hover:text-ink'
          }`}
        >
          All
        </button>
        {EXERCISE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              category === c ? 'bg-accent text-on-accent' : 'border border-edge bg-surface text-soft hover:text-ink'
            }`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {!query && category === 'all' && suggested.length > 0 ? (
        <Card className="mb-6 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
            <Sparkles className="size-3.5 text-accent-strong dark:text-accent" aria-hidden />
            Suggested for balance — your least-trained areas
          </p>
          <div className="flex flex-wrap gap-2">
            {suggested.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelected(e)}
                className="flex items-center gap-2 rounded-xl border border-edge bg-raised px-3 py-2 text-sm font-medium text-ink transition hover:border-accent"
              >
                {e.name}
                <CategoryBadge category={e.category} />
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => {
            const record = records.strength.get(e.id)
            const repsRecord = records.reps.get(e.id)
            return (
              <button key={e.id} type="button" onClick={() => setSelected(e)} className="block text-left">
                <InteractiveCard className="flex h-full flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-ink">{e.name}</h3>
                    <CategoryBadge category={e.category} />
                  </div>
                  <p className="mt-1 text-xs text-faint">
                    {e.equipment}
                    {e.isCustom ? ' · custom' : ''}
                  </p>
                  {record ? (
                    <p className="tnum mt-auto pt-3 text-xs font-semibold text-soft">
                      <Trophy className="mr-1 inline size-3.5 text-accent-strong dark:text-accent" aria-hidden />
                      Best: {formatWeight(record.bestWeightKg, profile.weightUnit)} × {record.bestWeightReps}
                    </p>
                  ) : repsRecord ? (
                    <p className="tnum mt-auto pt-3 text-xs font-semibold text-soft">
                      <Trophy className="mr-1 inline size-3.5 text-accent-strong dark:text-accent" aria-hidden />
                      Best: {repsRecord.bestReps} reps
                    </p>
                  ) : null}
                </InteractiveCard>
              </button>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No exercises found"
          body={`Nothing matches “${query}”${category !== 'all' ? ` in ${CATEGORY_LABELS[category]}` : ''}. Try a different search or create a custom exercise.`}
          action={
            <Button variant="primary" onClick={() => setShowCustomForm(true)}>
              <Plus className="size-4" aria-hidden />
              Create custom exercise
            </Button>
          }
        />
      )}

      <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />
      <CustomExerciseModal open={showCustomForm} onClose={() => setShowCustomForm(false)} />
    </div>
  )
}
