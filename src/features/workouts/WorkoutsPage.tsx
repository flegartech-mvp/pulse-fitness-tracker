import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, Dumbbell, History, Plus } from 'lucide-react'
import { useAppData } from '@/state/AppDataContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState } from '@/components/ui/EmptyState'
import { WorkoutCard } from './WorkoutCard'
import { isoToDateKey, monthKeyOf, formatMonth } from '@/lib/dates'

type Tab = 'all' | 'planned' | 'history'

export default function WorkoutsPage() {
  const { data } = useAppData()
  const [tab, setTab] = useState<Tab>('all')

  const active = data.workouts.filter((w) => w.status === 'active')
  const planned = useMemo(
    () =>
      data.workouts
        .filter((w) => w.status === 'planned')
        .sort((a, b) => ((a.scheduledFor ?? '9999') < (b.scheduledFor ?? '9999') ? -1 : 1)),
    [data.workouts],
  )
  const history = useMemo(
    () =>
      data.workouts
        .filter((w) => w.status === 'completed' && w.completedAt)
        .sort((a, b) => (a.completedAt! > b.completedAt! ? -1 : 1)),
    [data.workouts],
  )

  /** History grouped by month for scannable long lists. */
  const historyByMonth = useMemo(() => {
    const groups: Array<{ month: string; items: typeof history }> = []
    for (const w of history) {
      const month = monthKeyOf(isoToDateKey(w.completedAt!))
      const last = groups.at(-1)
      if (last && last.month === month) last.items.push(w)
      else groups.push({ month, items: [w] })
    }
    return groups
  }, [history])

  const showPlanned = tab !== 'history'
  const showHistory = tab !== 'planned'

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Workouts"
        subtitle="Plan sessions, train, and review your history."
        actions={
          <Link to="/workouts/new">
            <Button variant="primary">
              <Plus className="size-4" aria-hidden />
              New workout
            </Button>
          </Link>
        }
      />

      <SegmentedControl<Tab>
        ariaLabel="Filter workouts"
        className="mb-6"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'all', label: 'All' },
          { value: 'planned', label: `Planned (${planned.length + active.length})` },
          { value: 'history', label: `History (${history.length})` },
        ]}
      />

      {showPlanned ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-faint">Up next</h2>
          {active.length + planned.length > 0 ? (
            <div className="space-y-3">
              {[...active, ...planned].map((w) => (
                <WorkoutCard key={w.id} workout={w} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarPlus}
              title="Nothing planned"
              body="Build your next session now and it'll be waiting on your dashboard."
              action={
                <Link to="/workouts/new">
                  <Button variant="primary">
                    <Plus className="size-4" aria-hidden />
                    Plan a workout
                  </Button>
                </Link>
              }
            />
          )}
        </section>
      ) : null}

      {showHistory ? (
        <section>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-faint">
            <History className="size-3.5" aria-hidden />
            History
          </h2>
          {history.length > 0 ? (
            <div className="space-y-6">
              {historyByMonth.map((group) => (
                <div key={group.month}>
                  <h3 className="mb-2 text-xs font-semibold text-soft">{formatMonth(group.month)}</h3>
                  <div className="space-y-3">
                    {group.items.map((w) => (
                      <WorkoutCard key={w.id} workout={w} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Dumbbell}
              title="No completed workouts yet"
              body="Finish your first session and it will show up here with volume, duration, and any records you set."
            />
          )}
        </section>
      ) : null}
    </div>
  )
}
