'use client'

import { useState } from 'react'
import TopNav from '../../components/TopNav'
import Footer from '../../components/Footer'
import BottomCTA from '../../components/BottomCTA'
import { getApiUrl } from '../../utils/api'

interface Meal {
  id: number
  title: string
  image?: string
  imageType?: string
  readyInMinutes?: number
  servings?: number
  sourceUrl?: string
}

function mealImageUrl(meal: Meal): string | null {
  if (meal.image && meal.image.startsWith('http')) return meal.image
  if (meal.id && meal.imageType) {
    return `https://img.spoonacular.com/recipes/${meal.id}-556x370.${meal.imageType}`
  }
  if (meal.id) {
    return `https://img.spoonacular.com/recipes/${meal.id}-556x370.jpg`
  }
  return null
}

interface Nutrients {
  calories: number
  protein: number
  carbohydrates: number
  fat: number
}

interface MealPlanData {
  meals?: Meal[]
  nutrients?: Nutrients
  week?: Record<string, { meals: Meal[]; nutrients?: Nutrients }>
}

interface MealPlanResponse {
  success: boolean
  data: MealPlanData
}

const DIET_TYPES = [
  { value: '', label: 'NONE' },
  { value: 'balanced', label: 'BALANCED' },
  { value: 'high-protein', label: 'HIGH-PROTEIN' },
  { value: 'ketogenic', label: 'KETO' },
  { value: 'vegetarian', label: 'VEGETARIAN' },
  { value: 'vegan', label: 'VEGAN' },
  { value: 'paleo', label: 'PALEO' },
]

const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER']

export default function DietPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mealPlan, setMealPlan] = useState<MealPlanResponse | null>(null)

  const [timeframe, setTimeframe] = useState<'day' | 'week'>('day')
  const [targetCalories, setTargetCalories] = useState(2000)
  const [diet, setDiet] = useState('')
  const [exclude, setExclude] = useState('')

  const [activeDay, setActiveDay] = useState<string>('')

  const generateMealPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMealPlan(null)
    try {
      const apiUrl = getApiUrl()
      const res = await fetch(`${apiUrl}/api/diet/meal-plan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframe,
          target_calories: targetCalories,
          diet: diet || undefined,
          exclude: exclude || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMealPlan(data)
        if (data.data.week) {
          setActiveDay(Object.keys(data.data.week)[0] ?? '')
        }
      } else {
        setError('Failed to generate meal plan. Try different settings.')
      }
    } catch {
      setError('Could not reach the meal-planning service. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  const currentMeals: Meal[] = (() => {
    if (!mealPlan) return []
    if (timeframe === 'day') return mealPlan.data.meals ?? []
    if (timeframe === 'week' && mealPlan.data.week && activeDay) {
      return mealPlan.data.week[activeDay]?.meals ?? []
    }
    return []
  })()

  const currentNutrients = (() => {
    if (!mealPlan) return null
    if (timeframe === 'day') return mealPlan.data.nutrients ?? null
    if (timeframe === 'week' && mealPlan.data.week && activeDay) {
      return mealPlan.data.week[activeDay]?.nutrients ?? mealPlan.data.nutrients ?? null
    }
    return null
  })()

  return (
    <div className="bg-background text-on-background min-h-screen">
      <TopNav />

      <main className="pt-24 pb-0">
        <section className="px-margin-mobile lg:px-margin-desktop py-12 border-b border-outline-variant/20">
          <h1 className="font-display-xl text-[48px] md:text-[64px] leading-none text-primary uppercase">
            MEAL PLANNER
          </h1>
          <p className="font-body-lg text-body-lg text-secondary mt-3">
            Personalized daily and weekly plans powered by Spoonacular.
          </p>
        </section>

        <section className="px-margin-mobile lg:px-margin-desktop py-section-gap grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* LEFT: INPUTS */}
          <form
            onSubmit={generateMealPlan}
            className="md:col-span-2 flex flex-col gap-8 md:sticky md:top-24 md:self-start"
          >
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-3 block">
                TIMEFRAME
              </span>
              <div className="grid grid-cols-2 gap-3">
                <ToggleButton
                  active={timeframe === 'day'}
                  onClick={() => setTimeframe('day')}
                >
                  1 DAY
                </ToggleButton>
                <ToggleButton
                  active={timeframe === 'week'}
                  onClick={() => setTimeframe('week')}
                >
                  7 DAYS
                </ToggleButton>
              </div>
            </div>

            <div className="border-t border-outline-variant/20 pt-8">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-3 block">
                TARGET CALORIES
              </span>
              <div className="font-display-xl text-[64px] md:text-[96px] leading-none text-primary-fixed mb-2">
                {targetCalories.toLocaleString()}
              </div>
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-4">
                KCAL / DAY
              </span>
              <input
                type="range"
                min={1200}
                max={4000}
                step={100}
                value={targetCalories}
                onChange={(e) => setTargetCalories(Number(e.target.value))}
                className="lime-slider"
              />
              <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant mt-2">
                <span>1,200</span>
                <span>4,000</span>
              </div>
            </div>

            <div className="border-t border-outline-variant/20 pt-8">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-3 block">
                DIET TYPE
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DIET_TYPES.map((d) => (
                  <ToggleButton
                    key={d.value}
                    small
                    active={diet === d.value}
                    onClick={() => setDiet(d.value)}
                  >
                    {d.label}
                  </ToggleButton>
                ))}
              </div>
            </div>

            <div className="border-t border-outline-variant/20 pt-8">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-3 block">
                EXCLUSIONS
              </span>
              <input
                type="text"
                value={exclude}
                onChange={(e) => setExclude(e.target.value)}
                placeholder="e.g. shellfish, peanuts"
                className="w-full bg-transparent border-b border-outline-variant/40 focus:border-primary-fixed text-primary placeholder-on-surface-variant font-body-md py-3 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-primary-fixed text-on-primary-fixed font-headline-md text-headline-md tracking-widest py-5 hover:bg-white hover:text-black transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'GENERATING…' : 'GENERATE PLAN'}
            </button>

            {error && (
              <div className="border-l-4 border-signal p-4 bg-surface-container">
                <p className="font-label-caps text-label-caps text-signal">{error}</p>
              </div>
            )}
          </form>

          {/* RIGHT: RESULTS */}
          <div className="md:col-span-3 flex flex-col gap-8">
            {!mealPlan && !loading && (
              <div className="flex flex-col items-center justify-center text-center py-24 border border-outline-variant/30">
                <span
                  className="material-symbols-outlined text-on-surface-variant text-[80px] mb-6"
                  style={{ fontVariationSettings: '"wght" 100' }}
                >
                  restaurant
                </span>
                <p className="font-display-xl text-[40px] md:text-[64px] leading-none text-primary uppercase mb-4">
                  NO PLAN YET
                </p>
                <p className="font-body-lg text-body-lg text-secondary">
                  Set your targets and tap Generate.
                </p>
              </div>
            )}

            {loading && (
              <div className="py-24 text-center">
                <p className="font-label-caps text-label-caps text-on-surface-variant">
                  COOKING UP YOUR PLAN…
                </p>
              </div>
            )}

            {mealPlan && !loading && (
              <>
                {timeframe === 'week' && mealPlan.data.week && (
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-6 border-b border-outline-variant/20">
                      {Object.keys(mealPlan.data.week).map((day) => {
                        const isActive = activeDay === day
                        return (
                          <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            className={`pb-3 font-label-caps text-label-caps uppercase transition-colors ${
                              isActive
                                ? 'text-primary-fixed border-b-2 border-primary-fixed'
                                : 'text-secondary hover:text-primary-fixed'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {currentNutrients && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-outline-variant/20">
                    <NutrientCell
                      value={Math.round(currentNutrients.calories)}
                      label="KCAL"
                      highlight
                    />
                    <NutrientCell
                      value={`${Math.round(currentNutrients.protein)}G`}
                      label="PROTEIN"
                    />
                    <NutrientCell
                      value={`${Math.round(currentNutrients.carbohydrates)}G`}
                      label="CARBS"
                    />
                    <NutrientCell
                      value={`${Math.round(currentNutrients.fat)}G`}
                      label="FAT"
                    />
                  </div>
                )}

                <div className="flex flex-col">
                  {currentMeals.length === 0 && (
                    <p className="font-label-caps text-label-caps text-on-surface-variant py-12 text-center">
                      NO MEALS RETURNED — TRY DIFFERENT SETTINGS
                    </p>
                  )}
                  {currentMeals.map((meal, i) => (
                    <MealBlock
                      key={`${meal.id}-${i}`}
                      slot={MEAL_SLOTS[i] || `MEAL ${i + 1}`}
                      meal={meal}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setMealPlan(null)}
                  className="font-label-caps text-label-caps text-secondary border-b border-outline-variant/40 pb-1 hover:text-primary-fixed hover:border-primary-fixed transition-colors w-fit"
                >
                  GENERATE NEW PLAN →
                </button>
              </>
            )}
          </div>
        </section>

        <BottomCTA
          headline="FUEL THE PROGRESS."
          buttonLabel="EXPLORE EXERCISES"
          href="/workout"
        />
      </main>

      <Footer />
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  small,
  children,
}: {
  active: boolean
  onClick: () => void
  small?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${
        small ? 'py-2 px-3 text-label-caps' : 'py-4 px-4 text-headline-md font-headline-md'
      } font-label-caps tracking-widest border transition-colors ${
        active
          ? 'bg-primary-fixed text-on-primary-fixed border-primary-fixed'
          : 'bg-transparent text-secondary border-outline-variant/40 hover:text-primary-fixed hover:border-primary-fixed'
      }`}
    >
      {children}
    </button>
  )
}

function NutrientCell({
  value,
  label,
  highlight,
}: {
  value: string | number
  label: string
  highlight?: boolean
}) {
  return (
    <div className="py-6 px-2 md:px-4 border-r last:border-r-0 border-outline-variant/20 flex flex-col items-start">
      <span
        className={`font-data-point text-[40px] md:text-[56px] leading-none ${
          highlight ? 'text-primary-fixed' : 'text-primary'
        }`}
      >
        {value}
      </span>
      <span className="font-label-caps text-label-caps text-on-surface-variant mt-2">
        {label}
      </span>
    </div>
  )
}

function MealBlock({ slot, meal }: { slot: string; meal: Meal }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 py-8 border-b border-outline-variant/20">
      <div className="md:col-span-3 flex flex-col justify-between">
        <div>
          <span className="font-label-caps text-label-caps text-primary-fixed uppercase">
            {slot}
          </span>
          <h3 className="font-display-xl text-[28px] md:text-[40px] leading-tight text-primary uppercase mt-2">
            {meal.title}
          </h3>
        </div>
        <div className="mt-4 flex items-center gap-6 font-label-caps text-label-caps text-on-surface-variant">
          {meal.readyInMinutes && <span>⏱ {meal.readyInMinutes} MIN</span>}
          {meal.servings && <span>SERVES {meal.servings}</span>}
        </div>
        {meal.sourceUrl && (
          <a
            href={meal.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 font-label-caps text-label-caps text-primary-fixed border-b border-primary-fixed/40 pb-1 hover:text-white hover:border-white transition-colors w-fit"
          >
            VIEW RECIPE →
          </a>
        )}
      </div>
      <div className="md:col-span-2 aspect-square md:aspect-auto md:h-40 overflow-hidden bg-surface-container">
        {mealImageUrl(meal) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mealImageUrl(meal) as string}
            alt={meal.title}
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
          />
        )}
      </div>
    </div>
  )
}
