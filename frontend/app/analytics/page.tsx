'use client'

import { useEffect, useState } from 'react'
import TopNav from '../../components/TopNav'
import Footer from '../../components/Footer'
import BottomCTA from '../../components/BottomCTA'
import { getApiUrl } from '../../utils/api'

interface WeeklyStats {
  total_workouts: number
  total_calories: number
  total_duration: number
  avg_intensity: number
  most_common_exercise: string
  workout_streak: number
}

interface PerformanceMetrics {
  total_workouts: number
  total_time_minutes: number
  avg_workout_duration: number
  total_calories_burned: number
  peak_performance_day: string
  consistency_percentage: number
  favorite_exercises: string[]
}

export default function AnalyticsPage() {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const apiUrl = getApiUrl()
        const [statsRes, insRes, perfRes] = await Promise.all([
          fetch(`${apiUrl}/api/analytics/weekly-stats`),
          fetch(`${apiUrl}/api/analytics/insights`),
          fetch(`${apiUrl}/api/analytics/performance-metrics`),
        ])
        const statsData = await statsRes.json()
        const insData = await insRes.json()
        const perfData = await perfRes.json()
        setWeeklyStats(statsData.stats ?? null)
        setInsights(Array.isArray(insData.insights) ? insData.insights : [])
        setPerformance(perfData.metrics ?? null)
      } catch (err) {
        console.error('Analytics fetch error:', err)
        setError('Could not load analytics. Try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return (
    <div className="bg-background text-on-background min-h-screen">
      <TopNav />

      <main className="pt-24 pb-0">
        <section className="px-margin-mobile lg:px-margin-desktop py-12 border-b border-outline-variant/20">
          <h1 className="font-display-xl text-[48px] md:text-[64px] leading-none text-primary uppercase">
            ANALYTICS
          </h1>
          <p className="font-body-lg text-body-lg text-secondary mt-3">
            Your training history at a glance.
          </p>
        </section>

        {loading && (
          <div className="px-margin-mobile lg:px-margin-desktop py-24 text-center">
            <p className="font-label-caps text-label-caps text-on-surface-variant">
              LOADING ANALYTICS…
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="px-margin-mobile lg:px-margin-desktop py-24">
            <div className="border-l-4 border-signal bg-surface-container p-6">
              <p className="font-label-caps text-label-caps text-signal">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && weeklyStats && (
          <section className="px-margin-mobile lg:px-margin-desktop py-section-gap">
            <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-8">
              THIS WEEK
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 border-y border-outline-variant/20">
              <StatCell value={weeklyStats.total_workouts} label="WORKOUTS" highlight />
              <StatCell value={weeklyStats.total_calories} label="CAL BURNED" />
              <StatCell value={`${weeklyStats.total_duration}M`} label="MINUTES" />
              <StatCell
                value={`${weeklyStats.avg_intensity}/10`}
                label="AVG INTENSITY"
              />
              <StatCell value={`${weeklyStats.workout_streak}D`} label="STREAK" />
              <StatCell
                value={(weeklyStats.most_common_exercise || '—').toUpperCase()}
                label="FAVORITE"
                small
              />
            </div>
          </section>
        )}

        {!loading && !error && insights.length > 0 && (
          <section className="px-margin-mobile lg:px-margin-desktop py-section-gap border-t border-outline-variant/20">
            <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-8">
              INSIGHTS
            </h2>
            <div className="flex flex-col">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-6 py-5 border-b border-outline-variant/20"
                >
                  <span className="font-display-xl text-[32px] md:text-[40px] leading-none text-primary-fixed w-12 flex-shrink-0">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <p className="font-body-lg text-body-lg text-primary">{insight}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && !error && performance && (
          <section className="px-margin-mobile lg:px-margin-desktop py-section-gap border-t border-outline-variant/20">
            <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-8">
              ALL-TIME PERFORMANCE
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 border-y border-outline-variant/20">
              <StatCell
                value={performance.total_workouts}
                label="TOTAL WORKOUTS"
                highlight
              />
              <StatCell
                value={`${performance.total_time_minutes}M`}
                label="TOTAL MINUTES"
              />
              <StatCell
                value={`${performance.avg_workout_duration}M`}
                label="AVG DURATION"
              />
              <StatCell
                value={performance.total_calories_burned}
                label="CAL BURNED"
              />
              <StatCell
                value={performance.peak_performance_day || '—'}
                label="PEAK DAY"
                small
              />
              <StatCell
                value={`${performance.consistency_percentage}%`}
                label="CONSISTENCY"
              />
            </div>

            {performance.favorite_exercises?.length > 0 && (
              <div className="mt-12">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-6">
                  TOP EXERCISES
                </h3>
                <div className="flex flex-col">
                  {performance.favorite_exercises.slice(0, 5).map((ex, i) => (
                    <div
                      key={`${ex}-${i}`}
                      className="flex items-baseline gap-6 py-4 border-b border-outline-variant/20"
                    >
                      <span className="font-display-xl text-[28px] md:text-[36px] leading-none text-primary-fixed w-10 flex-shrink-0">
                        {(i + 1).toString().padStart(2, '0')}
                      </span>
                      <span className="font-headline-md text-headline-md text-primary uppercase">
                        {ex}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <BottomCTA
          headline="KEEP MOVING."
          buttonLabel="START A SESSION"
          href="/pose-detection"
        />
      </main>

      <Footer />
    </div>
  )
}

function StatCell({
  value,
  label,
  highlight,
  small,
}: {
  value: string | number
  label: string
  highlight?: boolean
  small?: boolean
}) {
  return (
    <div className="py-10 px-4 md:px-8 border-r border-b last:border-r-0 md:[&:nth-child(3n)]:border-r-0 border-outline-variant/20 flex flex-col items-start">
      <span
        className={`font-data-point leading-none ${
          highlight ? 'text-primary-fixed' : 'text-primary'
        } ${small ? 'text-[28px] md:text-[40px]' : 'text-[40px] md:text-[64px]'}`}
      >
        {value}
      </span>
      <span className="font-label-caps text-label-caps text-on-surface-variant mt-3">
        {label}
      </span>
    </div>
  )
}
