'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import TopNav from '../../components/TopNav'
import Footer from '../../components/Footer'
import BottomCTA from '../../components/BottomCTA'

interface Session {
  date: string
  exercise: string
  reps: string
  score: number
}

const FALLBACK_SESSIONS: Session[] = [
  { date: '11 MAY', exercise: 'SQUAT', reps: '15 REPS', score: 92 },
  { date: '10 MAY', exercise: 'PUSH-UP', reps: '12 REPS', score: 84 },
  { date: '09 MAY', exercise: 'SQUAT', reps: '18 REPS', score: 88 },
  { date: '08 MAY', exercise: 'PLANK', reps: '60S', score: 95 },
  { date: '06 MAY', exercise: 'PUSH-UP', reps: '10 REPS', score: 79 },
]

const FALLBACK_BREAKDOWN = [
  { exercise: 'SQUAT', sessions: 12, score: 89 },
  { exercise: 'PUSH-UP', sessions: 8, score: 85 },
  { exercise: 'PLANK', sessions: 3, score: 91 },
]

const FALLBACK_TREND = [92, 88, 84, 95, 72, 80, 92]

function formatDate(d: Date) {
  return d
    .toLocaleDateString('en-US', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase()
    .replace(',', ' ·')
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'GOOD MORNING'
  if (h < 18) return 'GOOD AFTERNOON'
  return 'GOOD EVENING'
}

function scoreColor(score: number) {
  if (score >= 85) return 'text-primary-fixed'
  if (score >= 75) return 'text-primary'
  return 'text-signal'
}

function trendBarColor(score: number) {
  if (score >= 85) return 'bg-primary-fixed'
  if (score >= 75) return 'bg-primary'
  return 'bg-signal'
}

export default function DashboardPage() {
  const [dateString, setDateString] = useState('')

  useEffect(() => {
    setDateString(formatDate(new Date()))
  }, [])

  const sessions = FALLBACK_SESSIONS
  const breakdown = FALLBACK_BREAKDOWN
  const trend = FALLBACK_TREND
  const totalSessions = breakdown.reduce((sum, b) => sum + b.sessions, 0)
  const avgScore =
    Math.round(
      breakdown.reduce((sum, b) => sum + b.score * b.sessions, 0) /
        Math.max(totalSessions, 1),
    ) || 0
  const totalReps = 1247

  return (
    <div className="bg-background text-on-background min-h-screen">
      <TopNav />

      <main className="pt-24 pb-0">
        <section className="px-margin-mobile lg:px-margin-desktop flex flex-col md:flex-row md:justify-between md:items-baseline gap-2 mb-12">
          <h1 className="font-headline-md text-headline-md text-primary uppercase">
            {greeting()}, ATHLETE.
          </h1>
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">
            {dateString || 'LOADING...'}
          </p>
        </section>

        <section className="px-margin-mobile lg:px-margin-desktop grid grid-cols-1 md:grid-cols-3 mb-section-gap border-y border-outline-variant/20">
          <div className="py-12 border-b md:border-b-0 md:border-r border-outline-variant/20 flex flex-col items-start">
            <span className="font-data-point text-[80px] md:text-[120px] text-primary-fixed leading-none">
              {totalSessions}
            </span>
            <span className="font-label-caps text-label-caps text-on-surface-variant mt-4">
              SESSIONS LOGGED
            </span>
          </div>
          <div className="py-12 border-b md:border-b-0 md:border-r border-outline-variant/20 flex flex-col items-start md:px-12">
            <div className="flex items-baseline">
              <span className="font-data-point text-[80px] md:text-[120px] text-primary leading-none">
                {avgScore}
              </span>
              <span className="font-headline-md text-[36px] md:text-[48px] text-on-surface-variant ml-2 leading-none">
                /100
              </span>
            </div>
            <span className="font-label-caps text-label-caps text-on-surface-variant mt-4">
              ACROSS ALL EXERCISES
            </span>
          </div>
          <div className="py-12 flex flex-col items-start md:px-12">
            <span className="font-data-point text-[80px] md:text-[120px] text-primary leading-none">
              {totalReps.toLocaleString()}
            </span>
            <span className="font-label-caps text-label-caps text-on-surface-variant mt-4">
              REPS COMPLETED
            </span>
          </div>
        </section>

        <section className="px-margin-mobile lg:px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-section-gap mb-section-gap">
          <div className="flex flex-col">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-6">
              EXERCISE BREAKDOWN
            </h3>
            {breakdown.map((row) => (
              <div
                key={row.exercise}
                className="flex justify-between items-center py-6 border-b border-outline-variant/20"
              >
                <span className="font-headline-md text-headline-md text-primary">
                  {row.exercise}
                </span>
                <div className="text-right">
                  <span className="font-body-md text-body-md text-on-surface-variant block">
                    {row.sessions} SESSIONS
                  </span>
                  <span
                    className={`font-headline-md text-headline-md ${scoreColor(row.score)}`}
                  >
                    {row.score} SCORE
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-surface-container p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <span className="font-label-caps text-label-caps text-primary-fixed mb-4 block">
                JUMP BACK IN
              </span>
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-8 max-w-sm">
                READY FOR ANOTHER SQUAT SESSION?
              </h2>
              <p className="font-body-lg text-body-lg text-secondary mb-8 max-w-sm">
                Your last form score was 92. Beat it.
              </p>
              <Link
                href="/pose-detection"
                className="inline-block bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps px-8 py-5 uppercase font-bold active:scale-95 transition-transform"
              >
                START POSE DETECTION
              </Link>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
              <span
                className="material-symbols-outlined text-[200px]"
                style={{ fontVariationSettings: '"wght" 100' }}
              >
                fitness_center
              </span>
            </div>
          </div>
        </section>

        <section className="px-margin-mobile lg:px-margin-desktop mb-section-gap">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-8 uppercase">
            FORM SCORE — LAST 7 SESSIONS
          </h3>
          <div className="flex items-end gap-2 md:gap-4 h-64 border-b border-outline-variant/20 pb-4">
            {trend.map((score, i) => (
              <div
                key={i}
                className={`flex-1 ${trendBarColor(score)} relative group`}
                style={{ height: `${score}%` }}
                title={`${score}`}
              >
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 font-label-caps text-[10px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                  {score}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            {['05 MAY', '06 MAY', '07 MAY', '08 MAY', '09 MAY', '10 MAY', '11 MAY'].map(
              (d) => (
                <span
                  key={d}
                  className="font-label-caps text-[10px] text-on-surface-variant"
                >
                  {d}
                </span>
              ),
            )}
          </div>
        </section>

        <section className="mb-section-gap">
          <div className="px-margin-mobile lg:px-margin-desktop mb-6">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              RECENT ACTIVITY
            </h3>
          </div>
          <div className="flex flex-col">
            {sessions.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-4 px-margin-mobile lg:px-margin-desktop py-6 border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors items-center"
              >
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  {s.date}
                </span>
                <span className="font-headline-md text-[20px] md:text-[24px] text-primary">
                  {s.exercise}
                </span>
                <span className="font-body-md text-body-md text-on-surface-variant">
                  {s.reps}
                </span>
                <span
                  className={`font-headline-md text-[20px] md:text-[24px] text-right ${scoreColor(
                    s.score,
                  )}`}
                >
                  {s.score}
                </span>
              </div>
            ))}
          </div>
        </section>

        <BottomCTA
          headline="KEEP GOING."
          buttonLabel="EXPLORE EXERCISES"
          href="/workout"
        />
      </main>

      <Footer />
    </div>
  )
}
