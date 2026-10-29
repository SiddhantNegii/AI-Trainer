'use client'

import { useCallback, useEffect, useState } from 'react'
import TopNav from '../../components/TopNav'
import Footer from '../../components/Footer'
import BottomCTA from '../../components/BottomCTA'
import { getApiUrl } from '../../utils/api'

interface Exercise {
  exerciseId: string
  name: string
  imageUrl: string
  gifUrl?: string
  bodyParts: string[]
  equipments: string[]
  exerciseType?: string
  targetMuscles?: string[]
  secondaryMuscles?: string[]
  keywords?: string[]
  instructions?: string[]
}

const PAGE_SIZE = 24

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

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const apiUrl = getApiUrl()
        const [bp, eq] = await Promise.all([
          fetch(`${apiUrl}/api/workout/bodyparts`),
          fetch(`${apiUrl}/api/workout/equipments`),
        ])
        const bpData = await bp.json()
        const eqData = await eq.json()
        if (bpData.success && Array.isArray(bpData.bodyParts)) {
          setBodyParts(bpData.bodyParts.filter((s: unknown) => typeof s === 'string'))
        }
        if (eqData.success && Array.isArray(eqData.equipments)) {
          setEquipments(eqData.equipments.filter((s: unknown) => typeof s === 'string'))
        }
      } catch (err) {
        console.error('Filter options error:', err)
      }
    }
    fetchFilters()
  }, [])

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
        console.error('Fetch exercises error:', err)
        setError('Could not load exercises. Please try again.')
        if (!append) setExercises([])
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [searchQuery, selectedBodyPart, selectedEquipment],
  )

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
    <div className="bg-background text-on-background min-h-screen">
      <TopNav />

      <main className="pt-24 pb-0">
        {/* HEADER */}
        <section className="px-margin-mobile lg:px-margin-desktop py-12 border-b border-outline-variant/20 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-display-xl text-[48px] md:text-[64px] leading-none text-primary uppercase">
              EXERCISE LIBRARY
            </h1>
            <p className="font-body-lg text-body-lg text-secondary mt-3">
              250+ exercises. Filter, search, learn.
            </p>
          </div>
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">
            {loading
              ? 'LOADING…'
              : `SHOWING ${exercises.length} OF ${total}`}
          </p>
        </section>

        {/* SEARCH + FILTERS */}
        <section className="bg-surface-container-low px-margin-mobile lg:px-margin-desktop py-8 border-b border-outline-variant/20 flex flex-col gap-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH EXERCISES..."
              className="w-full bg-black border border-outline-variant/40 focus:border-primary-fixed text-primary placeholder-on-surface-variant font-label-caps text-label-caps tracking-widest pl-14 pr-4 py-4 outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-4">
            <FilterChipRow
              label="BODY PART"
              options={bodyParts}
              value={selectedBodyPart}
              onChange={setSelectedBodyPart}
            />
            <FilterChipRow
              label="EQUIPMENT"
              options={equipments}
              value={selectedEquipment}
              onChange={setSelectedEquipment}
            />
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-center gap-3 flex-wrap pt-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                ACTIVE FILTERS:
              </span>
              {searchQuery && (
                <span className="bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps px-3 py-1">
                  SEARCH: {searchQuery.toUpperCase()}
                </span>
              )}
              {selectedBodyPart && (
                <span className="bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps px-3 py-1">
                  {selectedBodyPart.toUpperCase()}
                </span>
              )}
              {selectedEquipment && (
                <span className="bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps px-3 py-1">
                  {selectedEquipment.toUpperCase()}
                </span>
              )}
              <button
                onClick={resetFilters}
                className="font-label-caps text-label-caps text-signal hover:text-white transition-colors"
              >
                CLEAR ALL ×
              </button>
            </div>
          )}
        </section>

        {/* RESULTS */}
        <section className="px-margin-mobile lg:px-margin-desktop py-12">
          {error && (
            <div className="mb-8 border-l-4 border-signal bg-surface-container p-6">
              <p className="font-label-caps text-label-caps text-signal">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="py-24 text-center">
              <p className="font-label-caps text-label-caps text-on-surface-variant">
                LOADING EXERCISES…
              </p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="py-24 text-center border border-outline-variant/30">
              <p className="font-display-xl text-[40px] text-primary uppercase mb-4">
                NO RESULTS
              </p>
              <p className="font-body-lg text-body-lg text-secondary mb-6">
                Try a broader filter or clear all filters.
              </p>
              <button
                onClick={resetFilters}
                className="bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps px-8 py-4 active:scale-95 transition-transform"
              >
                CLEAR FILTERS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {exercises.map((ex) => (
                <ExerciseTile
                  key={ex.exerciseId}
                  exercise={ex}
                  onClick={() => setSelectedExercise(ex)}
                />
              ))}
            </div>
          )}

          {!loading && exercises.length > 0 && hasMore && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="font-label-caps text-label-caps text-primary-fixed border-b border-primary-fixed pb-1 hover:text-white hover:border-white transition-colors disabled:opacity-50"
              >
                {loadingMore
                  ? 'LOADING…'
                  : `LOAD MORE (${total - exercises.length} REMAINING) →`}
              </button>
            </div>
          )}

          {!loading && exercises.length > 0 && !hasMore && (
            <p className="mt-12 text-center font-label-caps text-label-caps text-on-surface-variant">
              END OF LIBRARY — {total} EXERCISES TOTAL
            </p>
          )}
        </section>

        <BottomCTA
          headline="READY TO TRAIN?"
          buttonLabel="START POSE SESSION"
          href="/pose-detection"
        />
      </main>

      <Footer />

      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  )
}

function FilterChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase md:w-32 flex-shrink-0">
        {label}
      </span>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <FilterChip active={value === ''} onClick={() => onChange('')}>
          ALL
        </FilterChip>
        {options.map((opt) => (
          <FilterChip
            key={opt}
            active={value === opt}
            onClick={() => onChange(value === opt ? '' : opt)}
          >
            {opt.toUpperCase()}
          </FilterChip>
        ))}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`font-label-caps text-label-caps px-4 py-2 border whitespace-nowrap transition-colors ${
        active
          ? 'bg-primary-fixed text-on-primary-fixed border-primary-fixed'
          : 'text-secondary border-outline-variant/40 hover:text-primary-fixed hover:border-primary-fixed'
      }`}
    >
      {children}
    </button>
  )
}

function ExerciseTile({
  exercise,
  onClick,
}: {
  exercise: Exercise
  onClick: () => void
}) {
  const img = exercise.imageUrl || exercise.gifUrl || ''
  const primaryBody = exercise.bodyParts?.[0] ?? ''
  return (
    <button
      onClick={onClick}
      className="group relative aspect-square overflow-hidden bg-surface-container text-left"
    >
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={exercise.name}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
        />
      )}
      {primaryBody && (
        <span className="absolute top-3 left-3 font-label-caps text-label-caps text-primary-fixed bg-black/80 px-2 py-1">
          {primaryBody.toUpperCase()}
        </span>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/90 border-t border-primary-fixed/60 px-4 py-3">
        <span className="font-body-lg text-body-lg text-primary uppercase line-clamp-1">
          {exercise.name}
        </span>
      </div>
    </button>
  )
}

function ExerciseDetailModal({
  exercise,
  onClose,
}: {
  exercise: Exercise
  onClose: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const img = exercise.imageUrl || exercise.gifUrl
  const target = exercise.targetMuscles?.[0] ?? '—'
  const equipment = exercise.equipments?.[0] ?? '—'

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-margin-mobile lg:p-margin-desktop"
      onClick={onClose}
    >
      <div
        className="bg-surface max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-outline-variant/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-surface border-b border-outline-variant/30 px-8 py-5 flex items-center justify-between">
          <h2 className="font-display-xl text-[32px] md:text-[48px] leading-none text-primary-fixed uppercase">
            {exercise.name}
          </h2>
          <button
            onClick={onClose}
            className="font-label-caps text-label-caps text-secondary hover:text-primary-fixed transition-colors"
          >
            CLOSE ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="aspect-square bg-black overflow-hidden">
            {img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={exercise.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="p-8 flex flex-col gap-6">
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                TARGET MUSCLE
              </span>
              <p className="font-headline-md text-headline-md text-primary uppercase mt-2">
                {target}
              </p>
            </div>
            <div className="border-t border-outline-variant/20 pt-6">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                EQUIPMENT
              </span>
              <p className="font-headline-md text-headline-md text-primary uppercase mt-2">
                {equipment}
              </p>
            </div>
            <div className="border-t border-outline-variant/20 pt-6">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                BODY PARTS
              </span>
              <div className="flex flex-wrap gap-2 mt-3">
                {exercise.bodyParts?.map((bp) => (
                  <span
                    key={bp}
                    className="font-label-caps text-label-caps text-primary-fixed border border-primary-fixed/40 px-3 py-1"
                  >
                    {bp.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {exercise.instructions && exercise.instructions.length > 0 && (
          <div className="p-8 border-t border-outline-variant/20">
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              HOW TO
            </span>
            <div className="mt-6 flex flex-col">
              {exercise.instructions.map((step, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-6 py-4 border-b border-outline-variant/20"
                >
                  <span className="font-display-xl text-[36px] leading-none text-primary-fixed w-12 flex-shrink-0">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="font-body-md text-body-md text-primary">
                    {step.replace(/^Step:?\d*\s*/i, '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
