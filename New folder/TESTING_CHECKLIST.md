# ✅ Testing Checklist - AI Fitness Trainer

## 🚀 Servers Running

✅ **Backend:** http://localhost:8000 (FastAPI)
✅ **Frontend:** http://localhost:3001 (Next.js)
✅ **API Docs:** http://localhost:8000/docs

---

## 🧪 Test Plan

### 1. Workout Page Tests (http://localhost:3001/workout)

**Test 1: Initial Load**
- [ ] Page loads without errors
- [ ] Exercises grid displays (should show 50 exercises)
- [ ] Exercise images load correctly
- [ ] Header shows "Exercise Library"
- [ ] Exercise count shows "50 exercises"

**Test 2: Search Functionality**
- [ ] Type "squat" in search bar
- [ ] Results update automatically (no submit button needed)
- [ ] Shows squat-related exercises
- [ ] Active filter tag appears: "Search: squat"
- [ ] Click "Clear all" removes filter

**Test 3: Body Part Filter**
- [ ] Click "All Body Parts" dropdown
- [ ] Select "CHEST" (or any body part)
- [ ] Grid updates to show only chest exercises
- [ ] Active filter tag appears: "CHEST"
- [ ] Exercise count updates

**Test 4: Equipment Filter**
- [ ] Click "All Equipment" dropdown
- [ ] Select "DUMBBELL"
- [ ] Grid updates to show only dumbbell exercises
- [ ] Active filter tag appears: "DUMBBELL"
- [ ] Exercise count updates

**Test 5: Exercise Detail Modal**
- [ ] Click any exercise card
- [ ] Modal opens with exercise details
- [ ] Shows exercise image
- [ ] Shows body parts (colored tags)
- [ ] Shows equipment needed
- [ ] Shows exercise type
- [ ] "Add to Workout" button visible
- [ ] "Save Favorite" button visible
- [ ] Click X or outside to close modal

**Test 6: Loading States**
- [ ] Initial page load shows spinner
- [ ] Search shows smooth transition
- [ ] No errors in browser console (F12)

---

### 2. Diet Page Tests (http://localhost:3001/diet)

**Test 1: Initial State**
- [ ] Page loads without errors
- [ ] Shows "Generate Your Meal Plan" message
- [ ] Shows 3 diet type icons (🥗 🍖 🥑)
- [ ] Form is visible on left side

**Test 2: Form Interactions**
- [ ] "One Day" button selected by default
- [ ] Click "Full Week" button - highlights
- [ ] Calorie slider works (1200-4000)
- [ ] Slider shows current value
- [ ] Diet dropdown has options (Ketogenic, Vegetarian, etc.)
- [ ] Exclude field accepts text

**Test 3: Generate Daily Meal Plan**
- [ ] Set timeframe: "One Day"
- [ ] Set calories: 2000
- [ ] Select diet: "Vegetarian"
- [ ] Click "Generate Daily Plan"
- [ ] Shows loading spinner
- [ ] Loading message: "Creating Your Meal Plan..."

**Expected Result:**
- [ ] Meal plan appears (3 meals)
- [ ] Nutrition summary shows (Calories, Protein, Carbs, Fat)
- [ ] Each meal has:
  - [ ] Meal type (🌅 Breakfast, ☀️ Lunch, 🌙 Dinner)
  - [ ] Title
  - [ ] Prep time (⏱️ X min)
  - [ ] Servings (🍽️ X servings)
  - [ ] "View Recipe →" link
- [ ] "Generate New" button appears

**Test 4: Generate Weekly Meal Plan**
- [ ] Click "Generate New"
- [ ] Switch to "Full Week"
- [ ] Set calories: 2500
- [ ] Select diet: "Ketogenic"
- [ ] Click "Generate Weekly Plan"
- [ ] Shows loading spinner

**Expected Result:**
- [ ] Weekly meal plan appears (7 days)
- [ ] Each day shows:
  - [ ] Day name (Monday, Tuesday, etc.)
  - [ ] 3 meals per day
  - [ ] Nutrition summary per day
- [ ] Weekly average nutrition shows at top

**Test 5: Error Handling**
- [ ] Stop backend server (Ctrl+C in backend terminal)
- [ ] Try to generate meal plan
- [ ] Should show error: "Error connecting to server..."
- [ ] Restart backend and test again

---

### 3. API Documentation Tests (http://localhost:8000/docs)

**Swagger UI Should Show:**
- [ ] Workout endpoints (5 endpoints)
  - [ ] GET /api/workout/exercises
  - [ ] GET /api/workout/exercises/search
  - [ ] GET /api/workout/exercises/bodypart/{bodypart}
  - [ ] GET /api/workout/exercises/equipment/{equipment}
  - [ ] GET /api/workout/bodyparts
  - [ ] GET /api/workout/equipments

- [ ] Diet endpoints (6 endpoints)
  - [ ] POST /api/diet/meal-plan/generate
  - [ ] GET /api/diet/recipe/{recipe_id}
  - [ ] GET /api/diet/recipe/search
  - [ ] GET /api/diet/diets
  - [ ] GET /api/diet/cuisines

**Test Direct API Call:**
- [ ] Click "GET /api/workout/exercises"
- [ ] Click "Try it out"
- [ ] Set limit: 10
- [ ] Click "Execute"
- [ ] Should return 10 exercises
- [ ] Response code: 200

---

### 4. Navigation Tests

**Test 1: Dashboard Links**
- [ ] Go to http://localhost:3001/dashboard
- [ ] Click "Workout Plan" or similar link
- [ ] Should navigate to workout page

**Test 2: Back Navigation**
- [ ] On workout page, click "← Dashboard"
- [ ] Should navigate back to dashboard
- [ ] On diet page, click "← Dashboard"
- [ ] Should navigate back to dashboard

---

### 5. Browser Console Tests

**Open Developer Tools (F12):**

**Console Tab:**
- [ ] No red errors
- [ ] API calls show successful responses
- [ ] Check Network tab:
  - [ ] Workout page makes call to `/api/workout/exercises`
  - [ ] Status: 200 OK
  - [ ] Diet page makes POST to `/api/diet/meal-plan/generate`
  - [ ] Status: 200 OK

---

## 🐛 Common Issues & Fixes

### Issue 1: No Exercises Showing
**Symptoms:** Workout page loads but grid is empty
**Fix:**
1. Check backend is running: http://localhost:8000
2. Check browser console for errors (F12)
3. Verify API call: http://localhost:8000/api/workout/exercises?limit=10
4. Check CORS - backend should allow localhost:3001

### Issue 2: Meal Plan Not Generating
**Symptoms:** Click generate, nothing happens or error appears
**Fix:**
1. Check backend is running
2. Check Spoonacular API key in backend/.env
3. Check browser console for network errors
4. Try with lower calorie value (2000)
5. Try without diet type (leave as "No Restriction")

### Issue 3: Images Not Loading
**Symptoms:** Exercise/meal cards show placeholder or broken images
**Fix:**
1. Check internet connection (images from CDN)
2. Check API response has imageUrl field
3. Try different exercise/meal

### Issue 4: Tailwind Styles Not Applying
**Symptoms:** Page looks plain, no colors or styling
**Fix:**
1. Stop frontend server (Ctrl+C)
2. Delete .next folder: `Remove-Item -Recurse -Force .next`
3. Restart: `npm run dev`
4. Hard refresh browser: Ctrl+Shift+R

### Issue 5: Port Already in Use
**Symptoms:** "Port 3000 is in use"
**Fix:**
1. Next.js auto-switches to 3001 (this is fine)
2. Or kill process on port 3000:
   ```powershell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
   ```

---

## 📊 Expected Results Summary

### Workout Page:
- ✅ 50+ exercises displayed in grid
- ✅ Search works instantly
- ✅ Filters work correctly
- ✅ Modal shows full exercise details
- ✅ Images load from ExerciseDB CDN

### Diet Page:
- ✅ Form controls work smoothly
- ✅ Daily plan shows 3 meals
- ✅ Weekly plan shows 7 days × 3 meals
- ✅ Nutrition breakdown accurate
- ✅ Recipe links work

### Performance:
- ✅ Page loads in < 3 seconds
- ✅ Search updates in < 500ms
- ✅ Meal plan generates in < 5 seconds
- ✅ No console errors

---

## 🎬 Demo Recording Checklist

If recording for evaluation:

1. **Start Recording**
2. **Open http://localhost:3001**
3. **Show Landing Page** (30 sec)
4. **Navigate to Workout Page** (2 min)
   - Show grid of exercises
   - Demo search: "squat"
   - Demo filter: "CHEST"
   - Click exercise, show modal
5. **Navigate to Diet Page** (2 min)
   - Set preferences (2000 cal, Vegetarian)
   - Generate daily plan
   - Show meals and nutrition
6. **Open API Docs** (1 min)
   - Show http://localhost:8000/docs
   - Expand a few endpoints
7. **Explain Architecture** (1 min)
   - "FastAPI backend"
   - "Next.js frontend"
   - "ExerciseDB + Spoonacular APIs"
   - "ML models ready for implementation"

**Total Demo Time:** ~6-7 minutes

---

## ✅ Sign-Off Checklist

Before submitting/presenting:

- [ ] Both servers start without errors
- [ ] Workout page loads and works
- [ ] Diet page loads and works
- [ ] Search functionality works
- [ ] Filters work correctly
- [ ] Meal plan generation works
- [ ] No console errors
- [ ] Images load correctly
- [ ] Navigation works
- [ ] API documentation accessible
- [ ] Code committed to GitHub
- [ ] PROGRESS.md updated
- [ ] Demo script practiced

---

**Testing Started:** ___________  
**Testing Completed:** ___________  
**All Tests Passed:** ☐ Yes ☐ No  
**Issues Found:** ___________  
**Ready for Demo:** ☐ Yes ☐ No

---

**Servers:**
- Backend: http://localhost:8000
- Frontend: http://localhost:3001
- API Docs: http://localhost:8000/docs

**Quick Test URLs:**
- Workout: http://localhost:3001/workout
- Diet: http://localhost:3001/diet
- Dashboard: http://localhost:3001/dashboard
- Landing: http://localhost:3001
