import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { PageSkeleton } from './components/ui/Skeleton'

const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'))
const WorkoutsPage = lazy(() => import('./features/workouts/WorkoutsPage'))
const WorkoutBuilderPage = lazy(() => import('./features/workouts/WorkoutBuilderPage'))
const WorkoutDetailPage = lazy(() => import('./features/workouts/WorkoutDetailPage'))
const ActiveWorkoutPage = lazy(() => import('./features/workouts/ActiveWorkoutPage'))
const ExercisesPage = lazy(() => import('./features/exercises/ExercisesPage'))
const ProgressPage = lazy(() => import('./features/progress/ProgressPage'))
const GoalsPage = lazy(() => import('./features/goals/GoalsPage'))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'))
const NotFoundPage = lazy(() => import('./features/NotFoundPage'))

export default function App() {
  return (
    <AppLayout>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/workouts" element={<WorkoutsPage />} />
          <Route path="/workouts/new" element={<WorkoutBuilderPage />} />
          <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
          <Route path="/workouts/:id/edit" element={<WorkoutBuilderPage />} />
          <Route path="/workouts/:id/active" element={<ActiveWorkoutPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppLayout>
  )
}
