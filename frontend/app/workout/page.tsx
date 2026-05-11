'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Exercise {
  exerciseId: string
  name: string
  imageUrl: string
  bodyParts: string[]
  equipments: string[]
  exerciseType: string
  keywords: string[]
}

export default function WorkoutPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBodyPart, setSelectedBodyPart] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState('')
  const [bodyParts, setBodyParts] = useState<string[]>([])
  const [equipments, setEquipments] = useState<string[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  // Fetch available body parts and equipments
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const apiUrl = (() => {
          const hostport = process.env.NEXT_PUBLIC_API_HOSTPORT
          if (hostport) return `https://${hostport}`
          const host = process.env.NEXT_PUBLIC_API_HOST
          if (host) return `https://${host}`
          return process.env.NEXT_PUBLIC_API_URL || ''
        })()
        const [bodyPartsRes, equipmentsRes] = await Promise.all([
          fetch(`${apiUrl}/api/workout/bodyparts`),
          fetch(`${apiUrl}/api/workout/equipments`)
        ])
        
        const bodyPartsData = await bodyPartsRes.json()
        const equipmentsData = await equipmentsRes.json()
        
        if (bodyPartsData.success) {
          const bp = bodyPartsData.bodyParts ?? bodyPartsData.data ?? []
          // Ensure we have an array of strings
          const bodyPartsArray = Array.isArray(bp) 
            ? bp.map(item => typeof item === 'string' ? item : String(item)).filter(Boolean)
            : []
          setBodyParts(bodyPartsArray)
        }
        if (equipmentsData.success) {
          const eq = equipmentsData.equipments ?? equipmentsData.data ?? []
          // Ensure we have an array of strings
          const equipmentsArray = Array.isArray(eq)
            ? eq.map(item => typeof item === 'string' ? item : String(item)).filter(Boolean)
            : []
          setEquipments(equipmentsArray)
        }
      } catch (error) {
        console.error('Error fetching filters:', error)
      }
    }
    
    fetchFilters()
  }, [])

  // Fetch exercises based on filters
  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true)
      try {
        const apiUrl = (() => {
          const hostport = process.env.NEXT_PUBLIC_API_HOSTPORT
          if (hostport) return `https://${hostport}`
          const host = process.env.NEXT_PUBLIC_API_HOST
          if (host) return `https://${host}`
          return process.env.NEXT_PUBLIC_API_URL || ''
        })()
        let url = `${apiUrl}/api/workout/exercises?limit=50`
        
        if (searchQuery) {
          url = `${apiUrl}/api/workout/exercises/search?query=${encodeURIComponent(searchQuery)}&limit=50`
        } else if (selectedBodyPart) {
          url = `${apiUrl}/api/workout/exercises/bodypart/${encodeURIComponent(selectedBodyPart)}?limit=50`
        } else if (selectedEquipment) {
          url = `${apiUrl}/api/workout/exercises/equipment/${encodeURIComponent(selectedEquipment)}?limit=50`
        }
        
        const response = await fetch(url)
        const data = await response.json()
        if (typeof window !== 'undefined') {
          console.log('Workout fetch URL:', url)
          console.log('Workout raw response:', data)
        }
        
        if (data.success) {
          let list: any[] = []
          if (Array.isArray(data.exercises)) list = data.exercises
          else if (Array.isArray(data.data)) list = data.data
          else if (data.data && Array.isArray(data.data.exercises)) list = data.data.exercises
          
          if (!Array.isArray(list)) list = []
          setExercises(list)
        } else {
          setExercises([])
        }
      } catch (error) {
        console.error('Error fetching exercises:', error)
        setExercises([])
      } finally {
        setLoading(false)
      }
    }
    
    // Debounce search queries
    const timeoutId = setTimeout(() => {
      fetchExercises()
    }, searchQuery ? 500 : 0) // 500ms debounce for search, immediate for filters
    
    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedBodyPart, selectedEquipment])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled by useEffect
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedBodyPart('')
    setSelectedEquipment('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
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
              {exercises.length} exercises
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Search exercises (e.g., squat, push, curl)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </form>
            </div>

            {/* Body Part Filter */}
            <div>
              <select
                value={selectedBodyPart}
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedBodyPart(value)
                  if (value) {
                    setSelectedEquipment('')
                    setSearchQuery('')
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Body Parts</option>
                {bodyParts.map((part) => (
                  <option key={part} value={part}>
                    {part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Equipment Filter */}
            <div>
              <select
                value={selectedEquipment}
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedEquipment(value)
                  if (value) {
                    setSelectedBodyPart('')
                    setSearchQuery('')
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

          {/* Active Filters */}
          {(searchQuery || selectedBodyPart || selectedEquipment) && (
            <div className="mt-4 flex items-center gap-2">
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

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading exercises...</p>
          </div>
        )}

        {/* Exercise Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {exercises.map((exercise) => (
              <div
                key={exercise.exerciseId}
                onClick={() => setSelectedExercise(exercise)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
              >
                {/* Exercise Image */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
                  {exercise.imageUrl && (
                    <img
                      src={exercise.imageUrl}
                      alt={exercise.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  )}
                </div>

                {/* Exercise Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-12">
                    {exercise.name}
                  </h3>
                  
                  {/* Body Parts Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {exercise.bodyParts.slice(0, 2).map((part) => (
                      <span
                        key={part}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                      >
                        {part.charAt(0) + part.slice(1).toLowerCase()}
                      </span>
                    ))}
                  </div>

                  {/* Equipment Tags */}
                  <div className="flex flex-wrap gap-1">
                    {exercise.equipments.slice(0, 1).map((equipment) => (
                      <span
                        key={equipment}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {equipment.charAt(0) + equipment.slice(1).toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="px-4 pb-4">
                  <button className="w-full py-2 bg-indigo-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && exercises.length === 0 && (
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

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{selectedExercise.name}</h2>
              <button
                onClick={() => setSelectedExercise(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Exercise Image */}
              <div className="relative h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl overflow-hidden mb-6">
                {selectedExercise.imageUrl && (
                  <img
                    src={selectedExercise.imageUrl}
                    alt={selectedExercise.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Exercise Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Body Parts</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.bodyParts.map((part) => (
                      <span
                        key={part}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium"
                      >
                        {part.charAt(0) + part.slice(1).toLowerCase()}
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
                        {equipment.charAt(0) + equipment.slice(1).toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Exercise Type</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    {selectedExercise.exerciseType}
                  </span>
                </div>

                {selectedExercise.keywords && selectedExercise.keywords.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.keywords.slice(0, 5).map((keyword, index) => (
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

              {/* Action Buttons */}
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
