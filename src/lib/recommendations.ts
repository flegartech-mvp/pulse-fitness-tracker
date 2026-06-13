import type { AppData, Exercise, ExerciseCategory } from '@/types'
import type { ExerciseResolver } from './calc'
import { diffDays, formatDateShort, startOfWeek, todayKey } from './dates'
import {
  categorySplit,
  completedWorkouts,
  currentStreak,
  lastTrainedByCategory,
  latestMetric,
  statsForWeek,
  trainingDays,
  weeklyHistory,
} from './stats'

export interface Recommendation {
  id: string
  tone: 'push' | 'win' | 'warn' | 'info'
  title: string
  body: string
  /** Optional route the card links to. */
  to?: string
}

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  chest: 'chest',
  back: 'back',
  legs: 'legs',
  shoulders: 'shoulders',
  arms: 'arms',
  core: 'core',
  cardio: 'cardio',
  fullbody: 'full-body',
}

/**
 * Rule-based coaching tips computed from real activity. Ordered by priority,
 * capped to keep the dashboard focused.
 */
export function buildRecommendations(
  data: AppData,
  resolve: ExerciseResolver,
  exercises: Exercise[],
  max = 3,
): Recommendation[] {
  const out: Recommendation[] = []
  const today = todayKey()
  const completed = completedWorkouts(data.workouts)
  const days = trainingDays(data.workouts)
  const streak = currentStreak(days, today)

  // 1. Streak about to break.
  if (streak.length >= 2 && streak.atRisk) {
    out.push({
      id: 'streak-risk',
      tone: 'warn',
      title: `Your ${streak.length}-day streak is on the line`,
      body: 'Two rest days in a row resets it. A short session today keeps the chain alive.',
      to: '/workouts',
    })
  }

  // 2. Consistency goal pacing.
  const consistency = data.goals.find((g) => g.type === 'consistency')
  if (consistency && consistency.type === 'consistency') {
    const week = statsForWeek(data.workouts, resolve, 0, startOfWeek(today))
    const remaining = consistency.sessionsPerWeek - week.sessions
    const daysLeft = 7 - ((diffDays(startOfWeek(today), today) % 7) + 1) + 1
    if (remaining > 0 && remaining <= daysLeft) {
      out.push({
        id: 'consistency-pace',
        tone: 'push',
        title: `${remaining} session${remaining === 1 ? '' : 's'} left to hit your weekly goal`,
        body: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left this week — right on schedule if you train ${
          remaining === 1 ? 'once' : `${remaining} more times`
        }.`,
        to: '/goals',
      })
    } else if (remaining > daysLeft) {
      out.push({
        id: 'consistency-behind',
        tone: 'warn',
        title: 'Weekly goal is slipping',
        body: `You need ${remaining} more sessions but only ${daysLeft} days remain. Even one short workout protects the habit.`,
        to: '/workouts',
      })
    }
  }

  // 3. Neglected muscle group (trained before, untouched for 14+ days).
  const lastTrained = lastTrainedByCategory(data.workouts, resolve)
  let staleCategory: { category: ExerciseCategory; daysAgo: number } | undefined
  for (const [category, day] of lastTrained) {
    if (category === 'cardio' || category === 'fullbody') continue
    const ago = diffDays(day, today)
    if (ago >= 14 && (!staleCategory || ago > staleCategory.daysAgo)) {
      staleCategory = { category, daysAgo: ago }
    }
  }
  if (staleCategory) {
    const suggestion = exercises.find(
      (e) => e.category === staleCategory.category && e.metric === 'weight-reps',
    )
    out.push({
      id: `stale-${staleCategory.category}`,
      tone: 'info',
      title: `${CATEGORY_LABELS[staleCategory.category]} hasn't been trained in ${staleCategory.daysAgo} days`,
      body: suggestion
        ? `Work it back in — ${suggestion.name} is a solid place to start.`
        : 'Work it back into your next session to keep your training balanced.',
      to: `/exercises?category=${staleCategory.category}`,
    })
  }

  // 4. Volume trend vs the previous 3-week average.
  const weeks = weeklyHistory(data.workouts, resolve, 0, 4)
  const thisWeek = weeks.at(-1)
  const prior = weeks.slice(0, -1).filter((w) => w.volumeKg > 0)
  if (thisWeek && prior.length >= 2) {
    const avg = prior.reduce((s, w) => s + w.volumeKg, 0) / prior.length
    if (avg > 0 && thisWeek.volumeKg > avg * 1.15) {
      out.push({
        id: 'volume-up',
        tone: 'win',
        title: 'Training volume is trending up',
        body: `This week is ${Math.round((thisWeek.volumeKg / avg - 1) * 100)}% above your recent average. Progressive overload is working.`,
        to: '/progress',
      })
    }
  }

  // 5. Body weight logging nudge.
  const latest = latestMetric(data.metrics)
  if (data.metrics.length > 0 && latest && diffDays(latest.date, today) >= 7) {
    out.push({
      id: 'log-weight',
      tone: 'info',
      title: 'Time for a weigh-in',
      body: `Last entry was ${formatDateShort(latest.date)}. Regular check-ins keep your trend honest.`,
      to: '/progress',
    })
  }

  // 6. Fresh-start encouragement.
  if (completed.length === 0) {
    out.push({
      id: 'first-workout',
      tone: 'push',
      title: 'Log your first workout',
      body: 'Everything in Pulse — streaks, records, progress charts — starts with one session.',
      to: '/workouts/new',
    })
  }

  // 7. Cardio balance for muscle-focused users who do zero cardio.
  const split = categorySplit(data.workouts, resolve, 21)
  if (completed.length >= 6 && !split.has('cardio')) {
    out.push({
      id: 'add-cardio',
      tone: 'info',
      title: 'No cardio in 3 weeks',
      body: 'A weekly 20-minute session supports recovery and heart health without eating into your lifts.',
      to: '/exercises?category=cardio',
    })
  }

  // 8. Streak celebration when nothing urgent is happening.
  if (streak.length >= 5 && !streak.atRisk) {
    out.push({
      id: 'streak-win',
      tone: 'win',
      title: `${streak.length} training days and counting`,
      body: 'Consistency is the single best predictor of results. Keep the rhythm.',
    })
  }

  return out.slice(0, max)
}
