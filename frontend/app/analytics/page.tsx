'use client'

import { useState, useEffect } from 'react'

export default function AnalyticsPage() {
  const [weeklyStats, setWeeklyStats] = useState<any>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const apiUrl = (() => {
        const hostport = process.env.NEXT_PUBLIC_API_HOSTPORT
        if (hostport) return `https://${hostport}`
        const host = process.env.NEXT_PUBLIC_API_HOST
        if (host) return `https://${host}`
        return process.env.NEXT_PUBLIC_API_URL || ''
      })()
      // Fetch weekly stats
      const statsRes = await fetch(`${apiUrl}/api/analytics/weekly-stats`)
      const statsData = await statsRes.json()
      setWeeklyStats(statsData.stats)

      // Fetch insights
      const insightsRes = await fetch(`${apiUrl}/api/analytics/insights`)
      const insightsData = await insightsRes.json()
      setInsights(insightsData.insights)

      // Fetch performance metrics
      const metricsRes = await fetch(`${apiUrl}/api/analytics/performance-metrics`)
      const metricsData = await metricsRes.json()
      setPerformanceMetrics(metricsData.metrics)

      setLoading(false)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-8 text-center">
          📊 Your Fitness Analytics
        </h1>

        {/* Weekly Stats */}
        {weeklyStats && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-6">This Week</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-500/20 rounded-xl p-6 border border-blue-400/30">
                <div className="text-blue-300 text-sm font-medium mb-2">Total Workouts</div>
                <div className="text-white text-4xl font-bold">{weeklyStats.total_workouts}</div>
              </div>
              <div className="bg-green-500/20 rounded-xl p-6 border border-green-400/30">
                <div className="text-green-300 text-sm font-medium mb-2">Calories Burned</div>
                <div className="text-white text-4xl font-bold">{weeklyStats.total_calories}</div>
              </div>
              <div className="bg-purple-500/20 rounded-xl p-6 border border-purple-400/30">
                <div className="text-purple-300 text-sm font-medium mb-2">Total Minutes</div>
                <div className="text-white text-4xl font-bold">{weeklyStats.total_duration}</div>
              </div>
              <div className="bg-orange-500/20 rounded-xl p-6 border border-orange-400/30">
                <div className="text-orange-300 text-sm font-medium mb-2">Avg Intensity</div>
                <div className="text-white text-4xl font-bold">{weeklyStats.avg_intensity}/10</div>
              </div>
              <div className="bg-pink-500/20 rounded-xl p-6 border border-pink-400/30">
                <div className="text-pink-300 text-sm font-medium mb-2">Favorite Exercise</div>
                <div className="text-white text-2xl font-bold">{weeklyStats.most_common_exercise}</div>
              </div>
              <div className="bg-yellow-500/20 rounded-xl p-6 border border-yellow-400/30">
                <div className="text-yellow-300 text-sm font-medium mb-2">Workout Streak</div>
                <div className="text-white text-4xl font-bold">{weeklyStats.workout_streak} days</div>
              </div>
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-6">💡 Personalized Insights</h2>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-white/10"
                >
                  <p className="text-white text-lg">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {performanceMetrics && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6">🏆 All-Time Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-indigo-500/20 rounded-xl p-6 border border-indigo-400/30">
                <div className="text-indigo-300 text-sm font-medium mb-2">Total Workouts</div>
                <div className="text-white text-3xl font-bold">{performanceMetrics.total_workouts}</div>
              </div>
              <div className="bg-teal-500/20 rounded-xl p-6 border border-teal-400/30">
                <div className="text-teal-300 text-sm font-medium mb-2">Total Time</div>
                <div className="text-white text-3xl font-bold">{performanceMetrics.total_time_minutes} min</div>
              </div>
              <div className="bg-cyan-500/20 rounded-xl p-6 border border-cyan-400/30">
                <div className="text-cyan-300 text-sm font-medium mb-2">Avg Workout Duration</div>
                <div className="text-white text-3xl font-bold">{performanceMetrics.avg_workout_duration} min</div>
              </div>
              <div className="bg-emerald-500/20 rounded-xl p-6 border border-emerald-400/30">
                <div className="text-emerald-300 text-sm font-medium mb-2">Total Calories</div>
                <div className="text-white text-3xl font-bold">{performanceMetrics.total_calories_burned}</div>
              </div>
              <div className="bg-violet-500/20 rounded-xl p-6 border border-violet-400/30">
                <div className="text-violet-300 text-sm font-medium mb-2">Peak Day</div>
                <div className="text-white text-2xl font-bold">{performanceMetrics.peak_performance_day}</div>
              </div>
              <div className="bg-fuchsia-500/20 rounded-xl p-6 border border-fuchsia-400/30">
                <div className="text-fuchsia-300 text-sm font-medium mb-2">Consistency</div>
                <div className="text-white text-3xl font-bold">{performanceMetrics.consistency_percentage}%</div>
              </div>
            </div>

            {performanceMetrics.favorite_exercises?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-bold text-white mb-4">Top 3 Exercises</h3>
                <div className="flex gap-4 flex-wrap">
                  {performanceMetrics.favorite_exercises.map((exercise: string, index: number) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-lg px-6 py-3 border border-white/20"
                    >
                      <span className="text-white text-lg font-medium">
                        {index + 1}. {exercise}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
