'use client'

import { useState } from 'react'

export default function DietPage() {
  const [loading, setLoading] = useState(false)
  const [mealPlan, setMealPlan] = useState<any>(null)
  const [error, setError] = useState('')
  const [timeframe, setTimeframe] = useState('day')
  const [targetCalories, setTargetCalories] = useState(2000)
  const [diet, setDiet] = useState('')
  const [exclude, setExclude] = useState('')

  const generateMealPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const response = await fetch(`${apiUrl}/api/diet/meal-plan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframe,
          target_calories: targetCalories,
          diet: diet || undefined,
          exclude: exclude || undefined
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setMealPlan(data)
      } else {
        setError('Failed to generate meal plan')
      }
    } catch (err) {
      setError('Error connecting to server. Make sure backend is running on port 8001.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-indigo-600 hover:text-indigo-700 font-medium">← Dashboard</a>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Meal Planner
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-2xl font-bold mb-6">Generate Meal Plan</h2>
              
              <form onSubmit={generateMealPlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Timeframe</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTimeframe('day')}
                      className={`py-2 rounded-lg font-medium ${timeframe === 'day' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                    >
                      One Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeframe('week')}
                      className={`py-2 rounded-lg font-medium ${timeframe === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                    >
                      Full Week
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Target Calories: {targetCalories}
                  </label>
                  <input
                    type="range"
                    min="1200"
                    max="4000"
                    step="100"
                    value={targetCalories}
                    onChange={(e) => setTargetCalories(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1,200</span>
                    <span>4,000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Diet Type</label>
                  <select value={diet} onChange={(e) => setDiet(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
                    <option value="">No Restriction</option>
                    <option value="ketogenic">Ketogenic</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="paleo">Paleo</option>
                    <option value="glutenfree">Gluten Free</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Exclude</label>
                  <input
                    type="text"
                    value={exclude}
                    onChange={(e) => setExclude(e.target.value)}
                    placeholder="e.g., shellfish, nuts"
                    className="w-full px-4 py-3 border rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold"
                >
                  {loading ? 'Generating...' : `Generate ${timeframe === 'week' ? 'Weekly' : 'Daily'} Plan`}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-2">💡 Tips</h3>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• Adjust calories based on your goals</li>
                  <li>• Select diet type for specific needs</li>
                  <li>• Exclude allergies/preferences</li>
                  <li>• Weekly plans help with meal prep</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!mealPlan && !loading && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-2xl font-bold mb-2">Generate Your Meal Plan</h3>
                <p className="text-gray-600 mb-6">
                  Fill in your preferences and click generate to get a personalized meal plan
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <div className="text-2xl mb-1">🥗</div>
                    <div className="text-xs">Balanced</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl mb-1">🍖</div>
                    <div className="text-xs">High Protein</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl mb-1">🥑</div>
                    <div className="text-xs">Keto</div>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
                <h3 className="text-xl font-semibold mb-2">Creating Your Meal Plan...</h3>
                <p className="text-gray-600">Finding the best recipes for you</p>
              </div>
            )}

            {mealPlan && !loading && (
              <div>
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <div className="flex justify-between mb-4">
                    <h2 className="text-2xl font-bold">
                      Your {timeframe === 'week' ? 'Weekly' : 'Daily'} Meal Plan
                    </h2>
                    <button onClick={() => setMealPlan(null)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">
                      Generate New
                    </button>
                  </div>
                  
                  {mealPlan.data.nutrients && (
                    <div className="grid grid-cols-4 gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{Math.round(mealPlan.data.nutrients.calories)}</div>
                        <div className="text-sm">Calories</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{Math.round(mealPlan.data.nutrients.protein)}g</div>
                        <div className="text-sm">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{Math.round(mealPlan.data.nutrients.carbohydrates)}g</div>
                        <div className="text-sm">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{Math.round(mealPlan.data.nutrients.fat)}g</div>
                        <div className="text-sm">Fat</div>
                      </div>
                    </div>
                  )}
                </div>

                {timeframe === 'day' && mealPlan.data.meals && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mealPlan.data.meals.map((meal: any, i: number) => {
                      const types = ['🌅 Breakfast', '☀️ Lunch', '🌙 Dinner']
                      return (
                        <div key={meal.id} className="bg-white rounded-xl shadow-lg p-4">
                          {meal.image && (
                            <img src={meal.image} alt={meal.title} className="w-full h-32 object-cover rounded-lg mb-3"/>
                          )}
                          <div className="text-xs text-gray-500 mb-1">{types[i]}</div>
                          <h4 className="font-semibold mb-2">{meal.title}</h4>
                          <div className="text-xs text-gray-600 mb-2">
                            ⏱️ {meal.readyInMinutes} min • 🍽️ {meal.servings} servings
                          </div>
                          <a href={meal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600">
                            View Recipe →
                          </a>
                        </div>
                      )
                    })}
                  </div>
                )}

                {timeframe === 'week' && mealPlan.data.week && (
                  <div className="space-y-6">
                    {Object.entries(mealPlan.data.week).map(([day, data]: [string, any]) => (
                      <div key={day} className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-bold mb-4">{day}</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {data.meals.map((meal: any) => (
                            <div key={meal.id} className="border rounded-lg p-3">
                              <h4 className="font-semibold text-sm mb-1">{meal.title}</h4>
                              <p className="text-xs text-gray-600">⏱️ {meal.readyInMinutes} min</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
