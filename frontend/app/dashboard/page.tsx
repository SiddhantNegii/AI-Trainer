'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import TopNav from '../../components/TopNav'
import Footer from '../../components/Footer'
import BottomCTA from '../../components/BottomCTA'
import { useAuthFetch } from '../../utils/authFetch'

interface SessionRow {
  id: number
  exercise: string
  reps: number
  form_score: number
  duration_seconds: number
  created_at: string
}

interface Stats {
  total_sessions: number
  total_reps: number
  avg_form_score: number
  by_exercise: Record<string, { sessions: number; avg_score: number; reps: number }>
  last_7_scores: { score: number; exercise: string; created_at: string }[]
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'GOOD MORNING'
  if (h < 18) return 'GOOD AFTERNOON'
  return 'GOOD EVENING'
}

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

function shortDate(iso: string) {
  const d = new Date(iso)
  return d
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
    .toUpperCase()
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
  const { user, isLoaded } = useUser()
  const authFetch = useAuthFetch()

  const [stats, setStats] = useState<Stats | null>(null)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dateString, setDateString] = useState('')

  useEffect(() => {
    setDateString(formatDate(new Date()))
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    let cancelled = false
    const load = async () => {
      try {
        const [statsRes, sessionsRes] = await Promise.all([
          authFetch('/api/sessions/stats'),
          authFetch('/api/sessions?limit=10'),
        ])
        if (cancelled) return
        if (statsRes.ok) setStats(await statsRes.json())
        if (sessionsRes.ok) setSessions(await sessionsRes.json())
      } catch (e) {
        console.error('Dashboard load error:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isLoaded, authFetch])

  const firstName =
    user?.firstName ||
    user?.username ||
    user?.fullName ||
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    'ATHLETE'

  const breakdownRows = stats
    ? (
        [
          'squat',
          'pushup',
          'plank',
          'lunge',
          'bicep_curl',
          'shoulder_press',
        ] as const
      ).map((ex) => ({
        exercise: ex.replace('_', ' ').toUpperCase(),
        sessions: stats.by_exercise[ex]?.sessions ?? 0,
        score: stats.by_exercise[ex]?.avg_score ?? 0,
      }))
    : []

  const trendScores = stats?.last_7_scores ?? []
  const totalSessions = stats?.total_sessions ?? 0
  const avgScore = stats?.avg_form_score ?? 0
  const totalReps = stats?.total_reps ?? 0
  const hasSessions = totalSessions > 0

  return (
    <div className="bg-background text-on-background min-h-screen">
      <TopNav />

      <main className="pt-24 pb-0">
        <section className="px-margin-mobile lg:px-margin-desktop flex flex-col md:flex-row md:justify-between md:items-baseline gap-2 mb-12">
          <h1 className="font-headline-md text-headline-md text-primary uppercase">
            {greeting()}, {firstName.toUpperCase()}.
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

        {!loading && !hasSessions && (
          <section className="px-margin-mobile lg:px-margin-desktop py-section-gap text-center">
            <p className="font-display-xl text-[40px] md:text-[64px] leading-none text-primary uppercase mb-6">
              NO SESSIONS YET
            </p>
            <p className="font-body-lg text-body-lg text-secondary mb-8">
              Run a pose detection session to start tracking your form.
            </p>
            <Link
              href="/pose-detection"
              className="inline-block bg-primary-fixed text-on-primary-fixed font-headline-md text-headline-md tracking-widest px-12 py-6 hover:bg-white hover:text-black transition-colors active:scale-95"
            >
              START YOUR FIRST SESSION
            </Link>
          </section>
        )}

        {hasSessions && (
          <>
            <section className="px-margin-mobile lg:px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-section-gap mb-section-gap">
              <div className="flex flex-col">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-6">
                  EXERCISE BREAKDOWN
                </h3>
                {breakdownRows.map((row) => (
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
                        {row.score || '—'} SCORE
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
                    READY FOR ANOTHER SESSION?
                  </h2>
                  <p className="font-body-lg text-body-lg text-secondary mb-8 max-w-sm">
                    Beat your last score.
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

            {trendScores.length > 0 && (
              <section className="px-margin-mobile lg:px-margin-desktop mb-section-gap">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-8 uppercase">
                  FORM SCORE — RECENT SESSIONS
                </h3>
                <div className="flex items-end gap-2 md:gap-4 h-64 border-b border-outline-variant/20 pb-4">
                  {trendScores.map((row, i) => (
                    <div
                      key={i}
                      className={`flex-1 ${trendBarColor(row.score)} relative group`}
                      style={{ height: `${row.score}%` }}
                      title={`${row.score} — ${row.exercise}`}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 font-label-caps text-[10px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                        {row.score}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4">
                  {trendScores.map((row, i) => (
                    <span
                      key={i}
                      className="font-label-caps text-[10px] text-on-surface-variant flex-1 text-center"
                    >
                      {shortDate(row.created_at)}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-section-gap">
              <div className="px-margin-mobile lg:px-margin-desktop mb-6">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  RECENT ACTIVITY
                </h3>
              </div>
              <div className="flex flex-col">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="grid grid-cols-4 px-margin-mobile lg:px-margin-desktop py-6 border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors items-center"
                  >
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      {shortDate(s.created_at)}
                    </span>
                    <span className="font-headline-md text-[20px] md:text-[24px] text-primary uppercase">
                      {s.exercise}
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      {s.exercise === 'plank' ? `${s.duration_seconds}S` : `${s.reps} REPS`}
                    </span>
                    <span
                      className={`font-headline-md text-[20px] md:text-[24px] text-right ${scoreColor(
                        s.form_score,
                      )}`}
                    >
                      {s.form_score}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

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
