'use client'

import { useState, useEffect, useCallback } from 'react'

interface Exercise {
  exerciseId: string
  name: string
  imageUrl: string
  bodyParts: string[]
  equipments: string[]
  exerciseType: string
  keywords: string[]
}

const PAGE_SIZE = 24

function getApiUrl(): string {
  const hostport = process.env.NEXT_PUBLIC_API_HOSTPORT
  if (hostport) return `https://${hostport}`
  const host = process.env.NEXT_PUBLIC_API_HOST
  if (host) return `https://${host}`
  return process.env.NEXT_PUBLIC_API_URL || ''
}

export default function WorkoutPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBodyPart, setSelectedBodyPart] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState('')
  const [bodyParts, setBodyParts] = useState<string[]>([])
  const [equipments, setEquipments] = useState<string[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  // Load body-part and equipment dropdown options once.
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const apiUrl = getApiUrl()
        const [bodyPartsRes, equipmentsRes] = await Promise.all([
          fetch(`${apiUrl}/api/workout/bodyparts`),
          fetch(`${apiUrl}/api/workout/equipments`),
        ])
        const bodyPartsData = await bodyPartsRes.json()
        const equipmentsData = await equipmentsRes.json()
        if (bodyPartsData.success && Array.isArray(bodyPartsData.bodyParts)) {
          setBodyParts(bodyPartsData.bodyParts.filter((s: unknown) => typeof s === 'string'))
        }
        if (equipmentsData.success && Array.isArray(equipmentsData.equipments)) {
          setEquipments(equipmentsData.equipments.filter((s: unknown) => typeof s === 'string'))
        }
      } catch (err) {
        console.error('Error fetching filter options:', err)
      }
    }
    fetchFilters()
  }, [])

  // Unified fetch — handles both initial load and "Load More".
  const fetchExercises = useCallback(
    async (offset: number, append: boolean) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError(null)

      try {
        const apiUrl = getApiUrl()
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
        })
        if (searchQuery.trim()) params.set('search', searchQuery.trim())
        if (selectedBodyPart) params.set('bodypart', selectedBodyPart)
        if (selectedEquipment) params.set('equipment', selectedEquipment)

        const res = await fetch(`${apiUrl}/api/workout/exercises?${params.toString()}`)
        if (!res.ok) throw new Error(`Request failed with ${res.status}`)
        const data = await res.json()

        const list: Exercise[] = Array.isArray(data.exercises) ? data.exercises : []
        setExercises((prev) => (append ? [...prev, ...list] : list))
        setTotal(typeof data.total === 'number' ? data.total : list.length)
        setHasMore(Boolean(data.has_more))
      } catch (err) {
        console.error('Error fetching exercises:', err)
        setError('Could not load exercises. Please try again.')
        if (!append) setExercises([])
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [searchQuery, selectedBodyPart, selectedEquipment],
  )

  // Re-fetch from page 1 whenever filters change. Debounce only for the search input.
  useEffect(() => {
    const delay = searchQuery ? 400 : 0
    const timer = setTimeout(() => fetchExercises(0, false), delay)
    return () => clearTimeout(timer)
  }, [fetchExercises, searchQuery])

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) fetchExercises(exercises.length, true)
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedBodyPart('')
    setSelectedEquipment('')
  }

  const activeFilterCount =
    (searchQuery ? 1 : 0) + (selectedBodyPart ? 1 : 0) + (selectedEquipment ? 1 : 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-indigo-600 hover:text-indigo-700 font-medium">
                ← Dashboard
              </a>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Exercise Library
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              {loading ? (
                'Loading…'
              ) : (
                <>
                  Showing <span className="font-semibold">{exercises.length}</span> of{' '}
                  <span className="font-semibold">{total}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search exercises (e.g., squat, push, curl)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <select
                value={selectedBodyPart}
                onChange={(e) => setSelectedBodyPart(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">All Body Parts</option>
                {bodyParts.map((part) => (
                  <option key={part} value={part}>
                    {part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">All Equipment</option>
                {equipments.map((equipment) => (
                  <option key={equipment} value={equipment}>
                    {equipment.charAt(0).toUpperCase() + equipment.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  Search: {searchQuery}
                </span>
              )}
              {selectedBodyPart && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {selectedBodyPart}
                </span>
              )}
              {selectedEquipment && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {selectedEquipment}
                </span>
              )}
              <button
                onClick={resetFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading exercises...</p>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {exercises.map((exercise) => (
              <div
                key={exercise.exerciseId}
                onClick={() => setSelectedExercise(exercise)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
              >
                <div className="relative h-48 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
                  {exercise.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={exercise.imageUrl}
                      alt={exercise.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-12">
                    {exercise.name}
                  </h3>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {exercise.bodyParts.slice(0, 2).map((part) => (
                      <span
                        key={part}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                      >
                        {part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {exercise.equipments.slice(0, 1).map((equipment) => (
                      <span
                        key={equipment}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {equipment.charAt(0).toUpperCase() + equipment.slice(1).toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <button className="w-full py-2 bg-indigo-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && exercises.length > 0 && hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore ? 'Loading…' : `Load more (${total - exercises.length} remaining)`}
            </button>
          </div>
        )}

        {!loading && exercises.length > 0 && !hasMore && (
          <p className="mt-10 text-center text-sm text-gray-500">
            You&apos;ve reached the end — {total} exercises total.
          </p>
        )}

        {!loading && exercises.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No exercises found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={resetFilters}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>

      {selectedExercise && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{selectedExercise.name}</h2>
              <button
                onClick={() => setSelectedExercise(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="relative h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl overflow-hidden mb-6">
                {selectedExercise.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedExercise.imageUrl}
                    alt={selectedExercise.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Body Parts</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.bodyParts.map((part) => (
                      <span
                        key={part}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium"
                      >
                        {part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Equipment</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.equipments.map((equipment) => (
                      <span
                        key={equipment}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm"
                      >
                        {equipment.charAt(0).toUpperCase() + equipment.slice(1).toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedExercise.exerciseType && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                      Exercise Type
                    </h3>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                      {selectedExercise.exerciseType}
                    </span>
                  </div>
                )}

                {selectedExercise.keywords && selectedExercise.keywords.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.keywords.slice(0, 8).map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">
                  Add to Workout
                </button>
                <button className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
                  Save Favorite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
