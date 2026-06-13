import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Moon, RefreshCcw, Scale, Sun, Trash2 } from 'lucide-react'
import type { ActivityLevel, TrainingFocus } from '@/types'
import { useAppData, useProfile } from '@/state/AppDataContext'
import { useToast } from '@/state/ToastContext'
import { exportFileName } from '@/lib/storage'
import { formatWeight, heightInUnit, heightToCm } from '@/lib/units'
import { latestMetric } from '@/lib/stats'
import { LIMITS, parsePositiveInt, parsePositiveNumber, validateProfileName } from '@/lib/validation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TextField, SelectField } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const ACTIVITY_LEVELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary — desk life, little movement',
  light: 'Lightly active — walks, occasional training',
  moderate: 'Moderately active — trains a few times a week',
  active: 'Active — trains most days',
  athlete: 'Athlete — high training load',
}

const FOCUS_LABELS: Record<TrainingFocus, string> = {
  'build-muscle': 'Build muscle',
  'lose-weight': 'Lose weight',
  endurance: 'Improve endurance',
  general: 'General fitness',
}

function ProfileSection() {
  const { updateProfile, data } = useAppData()
  const profile = useProfile()
  const { toast } = useToast()

  const [name, setName] = useState(profile.name)
  const [age, setAge] = useState(profile.age != null ? String(profile.age) : '')
  const [height, setHeight] = useState(
    profile.heightCm != null ? String(heightInUnit(profile.heightCm, profile.lengthUnit)) : '',
  )
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel)
  const [focus, setFocus] = useState<TrainingFocus>(profile.focus)
  const [errors, setErrors] = useState<{ name?: string | null; age?: string; height?: string }>({})

  const currentWeight = latestMetric(data.metrics)

  function save() {
    const next: typeof errors = { name: validateProfileName(name) }

    let parsedAge: number | undefined
    if (age.trim()) {
      const a = parsePositiveInt(age, LIMITS.ageMax)
      if (a == null || a < LIMITS.ageMin) next.age = `Enter an age between ${LIMITS.ageMin} and ${LIMITS.ageMax}.`
      else parsedAge = a
    }

    let heightCm: number | undefined
    if (height.trim()) {
      const maxDisplay = profile.lengthUnit === 'cm' ? LIMITS.heightCmMax : 107
      const h = parsePositiveNumber(height, maxDisplay)
      const cm = h != null ? heightToCm(h, profile.lengthUnit) : null
      if (cm == null || cm < LIMITS.heightCmMin || cm > LIMITS.heightCmMax) {
        next.height = profile.lengthUnit === 'cm' ? 'Enter a height between 80 and 272 cm.' : 'Enter a height between 32 and 107 in.'
      } else heightCm = cm
    }

    setErrors(next)
    if (next.name || next.age || next.height) return

    updateProfile({ name: name.trim(), age: parsedAge, heightCm, activityLevel, focus })
    toast({ tone: 'success', title: 'Profile saved' })
  }

  return (
    <Card>
      <CardHeader title="Profile" subtitle="Used for greetings and calorie estimates." />
      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <TextField
            label="Age (optional)"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            inputMode="numeric"
            error={errors.age}
          />
          <TextField
            label={`Height (${profile.lengthUnit === 'cm' ? 'cm' : 'in'}, optional)`}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            inputMode="decimal"
            error={errors.height}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Activity level"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
          >
            {(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((level) => (
              <option key={level} value={level}>
                {ACTIVITY_LEVELS[level]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Primary focus" value={focus} onChange={(e) => setFocus(e.target.value as TrainingFocus)}>
            {(Object.keys(FOCUS_LABELS) as TrainingFocus[]).map((f) => (
              <option key={f} value={f}>
                {FOCUS_LABELS[f]}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-edge pt-4">
          <p className="flex items-center gap-2 text-sm text-soft">
            <Scale className="size-4" aria-hidden />
            {currentWeight ? (
              <>
                Body weight: <strong className="tnum text-ink">{formatWeight(currentWeight.weightKg, profile.weightUnit)}</strong>
                <Link to="/progress" className="text-accent-strong underline-offset-2 hover:underline dark:text-accent">
                  update
                </Link>
              </>
            ) : (
              <>
                No body weight logged —{' '}
                <Link to="/progress" className="text-accent-strong underline-offset-2 hover:underline dark:text-accent">
                  log it in Progress
                </Link>
              </>
            )}
          </p>
          <Button variant="primary" onClick={save}>
            Save profile
          </Button>
        </div>
      </div>
    </Card>
  )
}

function PreferencesSection() {
  const { updateProfile } = useAppData()
  const profile = useProfile()

  return (
    <Card>
      <CardHeader title="Preferences" subtitle="Applied instantly across the app." />
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Theme</p>
            <p className="text-xs text-soft">Dark is the default Pulse look.</p>
          </div>
          <SegmentedControl<'dark' | 'light'>
            ariaLabel="Theme"
            value={profile.theme}
            onChange={(theme) => updateProfile({ theme })}
            options={[
              { value: 'dark', label: '🌙 Dark' },
              { value: 'light', label: '☀️ Light' },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge pt-4">
          <div>
            <p className="text-sm font-semibold text-ink">Weight unit</p>
            <p className="text-xs text-soft">Lifting weights, volume, and body weight.</p>
          </div>
          <SegmentedControl<'kg' | 'lb'>
            ariaLabel="Weight unit"
            value={profile.weightUnit}
            onChange={(weightUnit) => updateProfile({ weightUnit })}
            options={[
              { value: 'kg', label: 'kg' },
              { value: 'lb', label: 'lb' },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge pt-4">
          <div>
            <p className="text-sm font-semibold text-ink">Length unit</p>
            <p className="text-xs text-soft">Height and distances (cm pairs with km, in with mi).</p>
          </div>
          <SegmentedControl<'cm' | 'in'>
            ariaLabel="Length unit"
            value={profile.lengthUnit}
            onChange={(lengthUnit) => updateProfile({ lengthUnit })}
            options={[
              { value: 'cm', label: 'cm' },
              { value: 'in', label: 'in' },
            ]}
          />
        </div>
      </div>
    </Card>
  )
}

function DataSection() {
  const { data, exportJson, loadDemoData, clearAllData } = useAppData()
  const { toast } = useToast()
  const [confirmDemo, setConfirmDemo] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  function download() {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFileName()
    a.click()
    URL.revokeObjectURL(url)
    toast({ tone: 'success', title: 'Data exported', description: 'A JSON file with everything was downloaded.' })
  }

  const counts = `${data.workouts.length} workouts · ${data.metrics.length} weight entries · ${data.goals.length} goals`

  return (
    <Card>
      <CardHeader title="Data" subtitle={`Everything lives in this browser. ${counts}.`} />
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Export data</p>
            <p className="text-xs text-soft">Download all workouts, metrics, and goals as JSON.</p>
          </div>
          <Button onClick={download}>
            <Download className="size-4" aria-hidden />
            Export JSON
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge pt-4">
          <div>
            <p className="text-sm font-semibold text-ink">Reset demo data</p>
            <p className="text-xs text-soft">Replace everything with the fresh demo dataset.</p>
          </div>
          <Button onClick={() => setConfirmDemo(true)}>
            <RefreshCcw className="size-4" aria-hidden />
            Load demo
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge pt-4">
          <div>
            <p className="text-sm font-semibold text-danger">Clear all data</p>
            <p className="text-xs text-soft">Delete every workout, metric, and goal. Profile settings stay.</p>
          </div>
          <Button variant="danger-soft" onClick={() => setConfirmClear(true)}>
            <Trash2 className="size-4" aria-hidden />
            Clear data
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDemo}
        title="Load demo data?"
        body="This replaces your current workouts, metrics, goals, and profile with the demo dataset. Export first if you want a backup."
        confirmLabel="Load demo data"
        onConfirm={() => {
          loadDemoData()
          setConfirmDemo(false)
          toast({ tone: 'success', title: 'Demo data loaded' })
        }}
        onCancel={() => setConfirmDemo(false)}
      />
      <ConfirmDialog
        open={confirmClear}
        title="Clear all data?"
        body="Every workout, body weight entry, goal, and custom exercise will be permanently deleted from this device. This cannot be undone."
        confirmLabel="Delete everything"
        danger
        onConfirm={() => {
          clearAllData()
          setConfirmClear(false)
          toast({ tone: 'info', title: 'All data cleared', description: 'You have a clean slate.' })
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </Card>
  )
}

export default function SettingsPage() {
  const profile = useProfile()
  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <PageHeader title="Settings" subtitle="Profile, preferences, and your data." />
      <div className="space-y-4">
        <ProfileSection />
        <PreferencesSection />
        <DataSection />
        <p className="flex items-center justify-center gap-2 pt-2 text-center text-xs text-faint">
          {profile.theme === 'dark' ? <Moon className="size-3.5" aria-hidden /> : <Sun className="size-3.5" aria-hidden />}
          Pulse v1.0 — private by design: no account, no servers, your data never leaves this device.
        </p>
        <p className="text-center text-xs text-faint/60">
          Made by FlegarTech.{' '}
          <a
            href="https://paypal.me/TiniFlegar"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-faint"
          >
            Support development
          </a>
        </p>
      </div>
    </div>
  )
}
