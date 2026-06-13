import { useMemo, useState } from 'react'
import { History, Plus, Search } from 'lucide-react'
import type { Exercise, ExerciseCategory } from '@/types'
import { EXERCISE_CATEGORIES } from '@/types'
import { useAppData } from '@/state/AppDataContext'
import { completedWorkouts } from '@/lib/stats'
import { Modal } from '@/components/ui/Modal'
import { CategoryBadge } from '@/components/ui/Badge'
import { CATEGORY_LABELS } from '@/data/exerciseLibrary'
import { CustomExerciseModal } from '@/features/exercises/CustomExerciseModal'

/** Searchable exercise chooser used by the workout builder and live session. */
export function ExercisePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick: (exercise: Exercise) => void
}) {
  const { data, exercises, resolveExercise } = useAppData()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ExerciseCategory | 'all'>('all')
  const [showCustomForm, setShowCustomForm] = useState(false)

  const recent = useMemo(() => {
    const seen: Exercise[] = []
    for (const w of completedWorkouts(data.workouts).reverse()) {
      for (const entry of w.exercises) {
        const exercise = resolveExercise(entry.exerciseId)
        if (exercise && !seen.some((e) => e.id === exercise.id)) seen.push(exercise)
        if (seen.length >= 5) return seen
      }
    }
    return seen
  }, [data.workouts, resolveExercise])

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

  function pick(exercise: Exercise) {
    onPick(exercise)
    setQuery('')
  }

  return (
    <>
      <Modal open={open && !showCustomForm} onClose={onClose} title="Add exercise" size="lg">
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises, equipment, muscles…"
              aria-label="Search exercises"
              autoFocus
              className="h-11 w-full rounded-xl border border-edge bg-raised pl-10 pr-4 text-sm text-ink placeholder:text-faint transition focus:border-accent focus:outline-none"
            />
          </div>

          <div className="scroll-slim -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                category === 'all' ? 'bg-accent text-on-accent' : 'bg-raised text-soft hover:text-ink'
              }`}
            >
              All
            </button>
            {EXERCISE_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  category === c ? 'bg-accent text-on-accent' : 'bg-raised text-soft hover:text-ink'
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          {!query && category === 'all' && recent.length > 0 ? (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
                <History className="size-3.5" aria-hidden /> Recently used
              </p>
              <div className="flex flex-wrap gap-1.5">
                {recent.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => pick(e)}
                    className="rounded-full border border-edge bg-raised px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent"
                  >
                    {e.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            {filtered.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => pick(e)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-raised"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {e.name}
                    {e.isCustom ? <span className="ml-2 text-[10px] font-semibold uppercase text-faint">custom</span> : null}
                  </span>
                  <span className="block truncate text-xs text-faint">{e.equipment}</span>
                </span>
                <CategoryBadge category={e.category} />
              </button>
            ))}
            {filtered.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-soft">
                Nothing matches “{query}”. Try another term or create it below.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setShowCustomForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-edge-strong py-3 text-sm font-semibold text-soft transition hover:border-accent hover:text-ink"
          >
            <Plus className="size-4" aria-hidden />
            Create custom exercise
          </button>
        </div>
      </Modal>

      <CustomExerciseModal
        open={showCustomForm}
        onClose={() => setShowCustomForm(false)}
        onCreated={(exercise) => {
          setShowCustomForm(false)
          pick(exercise)
        }}
      />
    </>
  )
}
