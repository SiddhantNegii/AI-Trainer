# ML Models Implementation Guide

**Team Distribution Strategy**
- **Person 1 (Rishabh):** Pose Detection + Progress Analytics
- **Person 2 (Siddhant):** Workout Recommendation + Diet Recommendation

---

## 🎯 PERSON 1: POSE DETECTION & PROGRESS ANALYTICS

### Module 1: Pose Detection (PRIORITY - Most Important!)

**Location:** `ml_models/pose_detection/`

#### What to Build:
1. **Real-time Pose Detection** using MediaPipe
2. **Exercise Form Analyzer** - Detect if squats, pushups, etc. are done correctly
3. **Rep Counter** - Count repetitions automatically
4. **Form Scoring** - Give accuracy percentage (0-100%)

#### Step-by-Step Implementation:

##### Step 1: Setup & Testing
```bash
cd ml_models/pose_detection
pip install -r requirements.txt
jupyter notebook test_pose_detection.ipynb
```

##### Step 2: Implement `pose_detector.py`

**What to Code:**
```python
import cv2
import mediapipe as mp
import numpy as np

class PoseDetector:
    def __init__(self):
        # Initialize MediaPipe Pose
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
    
    def detect_pose(self, image):
        # Convert BGR to RGB
        # Process with MediaPipe
        # Extract 33 landmarks
        # Return landmarks and annotated image
        pass
    
    def calculate_angle(self, point1, point2, point3):
        # Calculate angle between 3 points (for joint angles)
        # Used for exercise analysis
        pass
    
    def draw_landmarks(self, image, landmarks):
        # Draw skeleton on image
        pass
```

**Key Tasks:**
- [ ] Convert image to RGB format
- [ ] Use MediaPipe to detect 33 body landmarks
- [ ] Calculate angles between joints (shoulder-elbow-wrist, hip-knee-ankle)
- [ ] Draw skeleton overlay on video
- [ ] Return landmark coordinates

##### Step 3: Implement `exercise_analyzer.py`

**What to Code:**
```python
class ExerciseAnalyzer:
    def __init__(self):
        self.pose_detector = PoseDetector()
        self.exercise_type = None
        self.rep_count = 0
        self.stage = None  # "up" or "down"
    
    def analyze_squat(self, landmarks):
        # Get knee angle
        # If angle < 90: stage = "down"
        # If angle > 160: stage = "up"
        # Count reps when transitioning
        # Check form (knee over toes, back straight)
        pass
    
    def analyze_pushup(self, landmarks):
        # Similar to squat but for arms
        pass
    
    def analyze_plank(self, landmarks):
        # Check if body is straight (hip-shoulder-ankle alignment)
        pass
    
    def get_form_score(self, landmarks, exercise_type):
        # Return score 0-100 based on form quality
        pass
```

**Key Tasks:**
- [ ] Detect squat form (knee angle 70-90° when down, back straight)
- [ ] Count squat reps automatically
- [ ] Detect pushup form (elbow angle, body alignment)
- [ ] Detect plank form (straight body line)
- [ ] Calculate form score percentage
- [ ] Give feedback ("Knee too forward", "Back not straight")

##### Step 4: Test with Webcam

**Create test script:**
```python
import cv2

detector = PoseDetector()
analyzer = ExerciseAnalyzer()
cap = cv2.VideoCapture(0)  # Webcam

while True:
    ret, frame = cap.read()
    landmarks = detector.detect_pose(frame)
    analyzer.analyze_squat(landmarks)
    
    # Display rep count, form score on screen
    cv2.imshow('Pose Detection', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
```

**Deliverables:**
✅ Working pose detection with webcam
✅ Rep counter for squats
✅ Form feedback (good/bad form detection)
✅ Visual skeleton overlay
✅ Form score percentage

---

### Module 2: Progress Analytics

**Location:** `ml_models/progress_analytics/`

#### What to Build:
1. **Track user progress over time**
2. **Predict goal achievement dates**
3. **Generate charts and insights**

#### Step-by-Step Implementation:

##### Step 1: Implement `analytics_engine.py`

**What to Code:**
```python
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt

class ProgressAnalytics:
    def __init__(self):
        self.user_data = None
    
    def load_user_data(self, user_id):
        # Load workout history from database/CSV
        # Columns: date, workout_type, reps, weight, duration, calories
        pass
    
    def calculate_weekly_stats(self):
        # Group by week
        # Calculate: total workouts, total calories, avg duration
        pass
    
    def predict_goal_date(self, current_weight, target_weight):
        # Use linear regression on weight history
        # Predict when user will reach target
        pass
    
    def get_strength_progression(self, exercise_name):
        # Track weight/reps progression for an exercise
        pass
    
    def generate_insights(self):
        # "You're working out 20% more than last month"
        # "You're on track to reach your goal by March 2026"
        pass
    
    def plot_progress(self):
        # Create matplotlib charts
        pass
```

**Key Tasks:**
- [ ] Load workout history (use sample CSV data for testing)
- [ ] Calculate weekly/monthly statistics
- [ ] Use Linear Regression to predict goal achievement
- [ ] Compare current month vs last month
- [ ] Generate motivational insights
- [ ] Create progress charts (matplotlib/seaborn)

##### Step 2: Create Sample Data

**Create CSV file: `sample_data.csv`**
```csv
date,workout_type,reps,duration_min,calories,form_score
2024-11-01,squats,30,15,150,85
2024-11-02,pushups,25,10,100,90
2024-11-03,plank,60,5,50,95
...
```

##### Step 3: Test Analytics

**In notebook:**
```python
analytics = ProgressAnalytics()
analytics.load_user_data("user_123")
stats = analytics.calculate_weekly_stats()
insights = analytics.generate_insights()
analytics.plot_progress()
```

**Deliverables:**
✅ Weekly/monthly progress statistics
✅ Goal prediction algorithm
✅ Strength progression tracking
✅ Automated insights generation
✅ Progress visualization charts

---

## 🎯 PERSON 2: WORKOUT & DIET RECOMMENDATION

### Module 3: Workout Recommendation

**Location:** `ml_models/workout_recommendation/`

#### What to Build:
1. **Generate personalized workout plans**
2. **Adjust difficulty based on user level**
3. **Create weekly schedules**

#### Step-by-Step Implementation:

##### Step 1: Implement `user_profile.py`

**What to Code:**
```python
class UserProfile:
    def __init__(self, user_id):
        self.user_id = user_id
        self.age = None
        self.weight = None
        self.height = None
        self.fitness_level = None  # beginner, intermediate, advanced
        self.goals = []  # weight_loss, muscle_gain, endurance
        self.available_time = None  # minutes per day
        self.health_conditions = []
    
    def calculate_bmi(self):
        # BMI = weight / (height^2)
        pass
    
    def calculate_bmr(self):
        # Basal Metabolic Rate
        # Men: 10 * weight + 6.25 * height - 5 * age + 5
        # Women: 10 * weight + 6.25 * height - 5 * age - 161
        pass
    
    def get_fitness_level_score(self):
        # Convert beginner/intermediate/advanced to numerical score
        pass
```

**Key Tasks:**
- [ ] Store user information
- [ ] Calculate BMI
- [ ] Calculate BMR (calories burned at rest)
- [ ] Categorize fitness level

##### Step 2: Implement `recommender.py`

**What to Code:**
```python
class WorkoutRecommender:
    def __init__(self):
        # Exercise database
        self.exercises = {
            'beginner': {
                'strength': ['bodyweight_squats', 'wall_pushups', 'assisted_pullups'],
                'cardio': ['walking', 'light_jogging', 'cycling'],
                'flexibility': ['basic_stretches', 'yoga_beginner']
            },
            'intermediate': {
                'strength': ['squats', 'pushups', 'lunges', 'planks'],
                'cardio': ['running', 'jump_rope', 'HIIT'],
                'flexibility': ['yoga_intermediate', 'dynamic_stretches']
            },
            'advanced': {
                'strength': ['weighted_squats', 'pistol_squats', 'muscle_ups'],
                'cardio': ['sprints', 'burpees', 'mountain_climbers'],
                'flexibility': ['yoga_advanced', 'flexibility_drills']
            }
        }
    
    def generate_workout_plan(self, user_profile, days_per_week=5):
        # Based on user level and goals
        # Create weekly schedule
        pass
    
    def create_daily_workout(self, focus_area, fitness_level, duration_min):
        # Select exercises
        # Determine sets and reps
        # Return structured workout
        pass
    
    def adjust_difficulty(self, user_performance):
        # If user completes easily: increase difficulty
        # If user struggles: decrease difficulty
        pass
    
    def calculate_estimated_calories(self, workout):
        # Estimate calories burned
        pass
```

**Key Tasks:**
- [ ] Create exercise database (name, difficulty, muscle group, duration)
- [ ] Generate personalized weekly plans
- [ ] Adjust based on fitness level
- [ ] Calculate estimated calories burned
- [ ] Balance workout types (strength, cardio, flexibility)
- [ ] Progressive overload (increase difficulty over time)

##### Step 3: Create Exercise Database

**Create JSON file: `exercises.json`**
```json
{
  "squats": {
    "name": "Bodyweight Squats",
    "difficulty": "beginner",
    "muscle_group": "legs",
    "duration_per_rep": 3,
    "calories_per_rep": 0.5,
    "instructions": ["Stand with feet shoulder-width apart", "Lower down until thighs parallel to ground", "Push back up"]
  },
  "pushups": {
    "name": "Push-ups",
    "difficulty": "intermediate",
    "muscle_group": "chest",
    "duration_per_rep": 2,
    "calories_per_rep": 0.3
  }
}
```

**Deliverables:**
✅ User profile system with BMI/BMR calculation
✅ Exercise database (at least 20 exercises)
✅ Workout plan generator (weekly schedules)
✅ Difficulty adjustment algorithm
✅ Calorie estimation

---

### Module 4: Diet Recommendation

**Location:** `ml_models/diet_recommendation/`

#### What to Build:
1. **Generate meal plans based on calorie goals**
2. **Calculate macros (protein, carbs, fats)**
3. **Suggest healthy recipes**

#### Step-by-Step Implementation:

##### Step 1: Implement `nutrition_analyzer.py`

**What to Code:**
```python
class NutritionAnalyzer:
    def __init__(self):
        pass
    
    def calculate_daily_calories(self, bmr, activity_level, goal):
        # TDEE = BMR * activity_multiplier
        # Weight loss: TDEE - 500
        # Muscle gain: TDEE + 300
        # Maintenance: TDEE
        pass
    
    def calculate_macros(self, total_calories, goal):
        # Protein: 30% (muscle gain: 40%)
        # Carbs: 40% (weight loss: 30%)
        # Fats: 30%
        pass
    
    def analyze_meal(self, food_items):
        # Sum up calories, protein, carbs, fats
        # Check if meets daily goals
        pass
```

**Key Tasks:**
- [ ] Calculate TDEE (Total Daily Energy Expenditure)
- [ ] Adjust calories based on goal (lose/gain/maintain)
- [ ] Calculate macro distribution
- [ ] Analyze if meal meets requirements

##### Step 2: Implement `diet_planner.py`

**What to Code:**
```python
class DietPlanner:
    def __init__(self):
        # Food database
        self.foods = {
            'chicken_breast': {'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'serving': '100g'},
            'brown_rice': {'calories': 111, 'protein': 2.6, 'carbs': 23, 'fat': 0.9, 'serving': '100g'},
            'broccoli': {'calories': 34, 'protein': 2.8, 'carbs': 7, 'fat': 0.4, 'serving': '100g'},
            # Add more foods
        }
    
    def generate_meal_plan(self, daily_calories, macros, preferences):
        # Create breakfast, lunch, dinner, snacks
        # Meet calorie and macro targets
        pass
    
    def create_meal(self, meal_type, calorie_target, macros):
        # Select foods that fit requirements
        # Return meal with portions
        pass
    
    def suggest_alternatives(self, food_item, dietary_restrictions):
        # Suggest substitutes (vegan, gluten-free, etc.)
        pass
    
    def generate_shopping_list(self, weekly_meal_plan):
        # Create grocery list
        pass
```

**Key Tasks:**
- [ ] Create food database (at least 50 foods)
- [ ] Generate daily meal plans (breakfast, lunch, dinner, 2 snacks)
- [ ] Match meals to calorie/macro targets
- [ ] Handle dietary restrictions (vegan, vegetarian, gluten-free)
- [ ] Create weekly meal plans
- [ ] Generate shopping lists

##### Step 3: Create Food Database

**Create JSON file: `foods.json`**
```json
{
  "chicken_breast": {
    "name": "Chicken Breast",
    "calories": 165,
    "protein": 31,
    "carbs": 0,
    "fat": 3.6,
    "serving_size": "100g",
    "category": "protein",
    "vegan": false,
    "gluten_free": true
  },
  "oatmeal": {
    "name": "Oatmeal",
    "calories": 389,
    "protein": 16.9,
    "carbs": 66.3,
    "fat": 6.9,
    "serving_size": "100g",
    "category": "carbs",
    "vegan": true,
    "gluten_free": true
  }
}
```

##### Step 4: Test Meal Generation

**In notebook:**
```python
analyzer = NutritionAnalyzer()
planner = DietPlanner()

# Calculate requirements
bmr = 1800
daily_calories = analyzer.calculate_daily_calories(bmr, 'moderate', 'weight_loss')
macros = analyzer.calculate_macros(daily_calories, 'weight_loss')

# Generate meal plan
meal_plan = planner.generate_meal_plan(daily_calories, macros, preferences=['vegetarian'])
print(meal_plan)
```

**Deliverables:**
✅ Food database (50+ items with nutrition info)
✅ Daily calorie calculator
✅ Macro calculator
✅ Meal plan generator (full day)
✅ Dietary restriction support
✅ Shopping list generator

---

## 📊 Testing Each Module

### How to Test:

1. **Use Jupyter Notebooks** (already created in each folder)
2. **Create sample data** (CSV files, JSON databases)
3. **Test with real webcam** (for pose detection)
4. **Print outputs** to verify logic

### Example Test Cases:

**Pose Detection:**
- [ ] Can detect person in frame
- [ ] Counts squats accurately (do 10, check if it counts 10)
- [ ] Detects bad form (intentionally do wrong squat)
- [ ] Works in different lighting conditions

**Workout Recommendation:**
- [ ] Beginner gets easier exercises
- [ ] Advanced user gets harder exercises
- [ ] Weekly plan has variety (not same exercise every day)
- [ ] Meets user's available time constraint

**Diet Recommendation:**
- [ ] Total calories match target (within 100 calories)
- [ ] Macros are balanced
- [ ] Vegan plan has no animal products
- [ ] Meals are realistic and diverse

**Progress Analytics:**
- [ ] Can load sample workout history
- [ ] Calculates weekly stats correctly
- [ ] Predictions make sense (not predicting 100kg weight loss in 1 week)
- [ ] Charts display properly

---

## 🎯 Timeline Suggestion

### Week 1 (Before Evaluation):
- **Person 1:** Basic pose detection working (detect landmarks, count reps for 1 exercise)
- **Person 2:** Basic workout generator (create simple weekly plan)
- **Both:** Show progress in notebooks, explain approach

### Week 2:
- **Person 1:** Complete all exercises (squat, pushup, plank), form scoring
- **Person 2:** Complete diet planner with food database

### Week 3:
- **Person 1:** Progress analytics with predictions and charts
- **Person 2:** Refine recommendations, add more exercises/foods

### Week 4:
- **Both:** Integration testing, create APIs to connect to backend

---

## 📝 Resources to Help You

### Pose Detection:
- MediaPipe Pose Documentation: https://google.github.io/mediapipe/solutions/pose
- Tutorial: Search "MediaPipe Pose Detection Tutorial Python"
- Example: "Exercise Rep Counter with MediaPipe"

### Machine Learning Basics:
- Scikit-learn docs: https://scikit-learn.org/
- Linear Regression tutorial for predictions
- Pandas for data manipulation

### Food/Nutrition Data:
- USDA Food Database: https://fdc.nal.usda.gov/
- Or use simple JSON file with common foods

---

## 🤝 How to Divide Work

### Clear Separation:

**Person 1 Works On:**
- `ml_models/pose_detection/` folder ONLY
- `ml_models/progress_analytics/` folder ONLY
- No need to touch workout or diet code

**Person 2 Works On:**
- `ml_models/workout_recommendation/` folder ONLY
- `ml_models/diet_recommendation/` folder ONLY
- No need to touch pose detection code

**No Conflicts:** You can both work simultaneously without merge conflicts!

### Collaboration Points:
- Share user_id format (how to identify users)
- Share data storage approach (CSV vs JSON vs Database)
- Weekly sync to show progress

---

## ✅ Checklist for Each Person

### Person 1 (Pose + Analytics):
- [ ] Install MediaPipe, OpenCV
- [ ] Get webcam working with OpenCV
- [ ] Detect pose landmarks (33 points)
- [ ] Calculate joint angles
- [ ] Count reps for squats
- [ ] Detect good vs bad form
- [ ] Create sample workout history CSV
- [ ] Calculate weekly statistics
- [ ] Implement goal prediction
- [ ] Create progress charts

### Person 2 (Workout + Diet):
- [ ] Create exercise database JSON (20+ exercises)
- [ ] Implement BMI/BMR calculations
- [ ] Generate weekly workout plan
- [ ] Adjust difficulty based on level
- [ ] Create food database JSON (50+ foods)
- [ ] Calculate daily calorie needs
- [ ] Calculate macro distribution
- [ ] Generate daily meal plans
- [ ] Handle dietary restrictions
- [ ] Create shopping list generator

---

## 🚀 Quick Start Commands

**Person 1:**
```bash
cd ml_models/pose_detection
pip install -r requirements.txt
jupyter notebook test_pose_detection.ipynb
```

**Person 2:**
```bash
cd ml_models/workout_recommendation
pip install -r requirements.txt
jupyter notebook test_recommender.ipynb
```

---

## 📞 Questions?

Refer back to this guide! Each section has:
- What to build
- How to code it
- What to test
- What to deliver

Work independently, test thoroughly, and you'll have a complete AI Fitness Trainer ML system!

**Good luck! 🎯**
