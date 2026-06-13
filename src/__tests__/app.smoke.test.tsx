import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { AppDataProvider } from '@/state/AppDataContext'
import { ToastProvider } from '@/state/ToastContext'
import { MemoryAdapter } from '@/lib/storage'
import { buildDemoData } from '@/data/demoData'

function renderApp(route: string) {
  return render(
    <AppDataProvider adapter={new MemoryAdapter()} initialData={buildDemoData()}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      </ToastProvider>
    </AppDataProvider>,
  )
}

describe('app smoke', () => {
  it('renders the dashboard with demo data', async () => {
    renderApp('/')
    expect(await screen.findByText(/Alex/)).toBeInTheDocument()
    expect(await screen.findByText('Recent workouts')).toBeInTheDocument()
    expect(await screen.findByText("Today's workout")).toBeInTheDocument()
    expect(await screen.findByText('Sessions this week')).toBeInTheDocument()
  })

  it('renders the workouts list with history', async () => {
    renderApp('/workouts')
    expect(await screen.findByRole('heading', { name: 'Workouts' })).toBeInTheDocument()
    expect((await screen.findAllByText('Push Day')).length).toBeGreaterThan(0)
  })

  it('renders the exercise library', async () => {
    renderApp('/exercises')
    expect(await screen.findByRole('heading', { name: 'Exercise library' })).toBeInTheDocument()
    expect(await screen.findByText('Barbell Bench Press')).toBeInTheDocument()
  })

  it('renders progress with records', async () => {
    renderApp('/progress')
    expect(await screen.findByText('Body weight')).toBeInTheDocument()
    expect(await screen.findByText('Personal records')).toBeInTheDocument()
  })

  it('renders goals with computed progress', async () => {
    renderApp('/goals')
    expect(await screen.findByText('Cut to 80 kg')).toBeInTheDocument()
    expect(await screen.findByText('Train 4× a week')).toBeInTheDocument()
  })

  it('renders settings', async () => {
    renderApp('/settings')
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(await screen.findByText('Export data')).toBeInTheDocument()
  })

  it('shows a friendly 404 for unknown routes', async () => {
    renderApp('/nope')
    expect(await screen.findByText('Page not found')).toBeInTheDocument()
  })
})
