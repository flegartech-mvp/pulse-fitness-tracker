import { useEffect, type ReactNode } from 'react'
import { useNow } from '@/lib/useNow'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  Activity,
  BookOpen,
  Dumbbell,
  LayoutDashboard,
  LineChart,
  Play,
  Settings,
  Target,
} from 'lucide-react'
import { useAppData } from '@/state/AppDataContext'
import { formatClock } from '@/lib/format'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/exercises', label: 'Exercises', icon: BookOpen },
  { to: '/progress', label: 'Progress', icon: LineChart },
  { to: '/goals', label: 'Goals', icon: Target },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-2" aria-label="Pulse — go to dashboard">
      <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-on-accent">
        <Activity className="size-5" strokeWidth={2.5} aria-hidden />
      </span>
      <span className="text-lg font-bold tracking-tight text-ink">Pulse</span>
    </Link>
  )
}

function SideNav() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-edge bg-surface px-4 py-6 lg:flex">
      <Logo />
      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Main">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-accent/12 text-ink' : 'text-soft hover:bg-raised hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`size-4.5 ${isActive ? 'text-accent-strong dark:text-accent' : ''}`} aria-hidden />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            isActive ? 'bg-accent/12 text-ink' : 'text-soft hover:bg-raised hover:text-ink'
          }`
        }
      >
        <Settings className="size-4.5" aria-hidden />
        Settings
      </NavLink>
    </aside>
  )
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-edge bg-bg/85 px-4 py-3 backdrop-blur lg:hidden">
      <Logo />
      <NavLink
        to="/settings"
        aria-label="Settings"
        className={({ isActive }) =>
          `flex size-10 items-center justify-center rounded-xl transition ${
            isActive ? 'bg-accent/12 text-ink' : 'text-soft hover:bg-raised hover:text-ink'
          }`
        }
      >
        <Settings className="size-5" aria-hidden />
      </NavLink>
    </header>
  )
}

function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-edge bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition ${
                isActive ? 'text-accent-strong dark:text-accent' : 'text-faint hover:text-soft'
              }`
            }
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

/** Floating "resume workout" bar shown anywhere except the live session page. */
function ResumeWorkoutBar() {
  const { data } = useAppData()
  const location = useLocation()
  const now = useNow()
  const active = data.workouts.find((w) => w.status === 'active')

  if (!active || location.pathname === `/workouts/${active.id}/active`) return null
  const elapsed = active.startedAt ? (now - new Date(active.startedAt).getTime()) / 1000 : 0

  return (
    <Link
      to={`/workouts/${active.id}/active`}
      className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-accent/40 bg-raised/95 py-2 pl-2 pr-4 shadow-pop backdrop-blur transition hover:border-accent lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-accent text-on-accent">
        <Play className="size-4 fill-current" aria-hidden />
      </span>
      <span className="text-sm font-semibold text-ink">{active.name}</span>
      <span className="tnum text-sm font-medium text-accent-strong dark:text-accent">{formatClock(elapsed)}</span>
    </Link>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation()

  // New page → start at the top (mirrors native app behavior).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="min-h-dvh bg-bg">
      <SideNav />
      <MobileHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pl-68 lg:pt-10 xl:pl-72">
        {children}
      </main>
      <ResumeWorkoutBar />
      <BottomNav />
    </div>
  )
}
