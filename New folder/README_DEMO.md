# 🏋️ AI Fitness Trainer - Quick Start

## 🚀 For Presentation Demo

### Fastest Way to Start (Windows)
```batch
# Just double-click this file:
START_DEMO.bat

# Then select option 3 (Start Both)
```

That's it! The application will:
- ✅ Start backend on port 8002
- ✅ Start frontend on port 3000  
- ✅ Auto-open browser to http://localhost:3000

---

## 📋 Pre-Demo Checklist

Run before your presentation:

```batch
python test_demo.py
```

This will verify:
- ✅ Backend server is running
- ✅ Frontend server is running
- ✅ API is returning data
- ✅ All endpoints are working

---

## 🎯 Demo Features to Showcase

### 1. Exercise Library (★ Main Feature)
- **1,500+ exercises** from ExerciseDB API
- Search by name (e.g., "squat", "press", "curl")
- Filter by 19 body parts
- Filter by 26 equipment types
- Animated GIF demonstrations
- Detailed step-by-step instructions

**Demo Path:** http://localhost:3000/workout

### 2. AI-Powered Features
- Real-time pose detection with MediaPipe
- Exercise rep counting
- Form correction feedback
- Personalized workout recommendations

### 3. Diet Planning
- AI-powered meal planning
- Nutrition tracking
- Calorie calculations

### 4. Progress Analytics
- Workout history tracking
- Performance visualization
- Goal achievement metrics

---

## 🛠️ Manual Startup (if needed)

### Backend:
```batch
cd backend
start_backend.bat
```
Wait for: `Uvicorn running on http://0.0.0.0:8002`

### Frontend:
```batch
cd frontend
start_frontend.bat
```
Wait for: `Ready - started server on 0.0.0.0:3000`

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://127.0.0.1:8002 |
| API Documentation | http://127.0.0.1:8002/docs |
| Exercise Library | http://localhost:3000/workout |
| Dashboard | http://localhost:3000/dashboard |

---

## ⚡ Quick Fixes

### If ports are already in use:

**Backend (port 8002):**
```batch
netstat -ano | findstr :8002
taskkill /PID <PID> /F
```

**Frontend (port 3000):**
```batch
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### If dependencies are missing:

**Backend:**
```batch
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```batch
cd frontend
npm install
```

---

## 💡 Presentation Tips

1. **Pre-cache data:** Visit /workout page before demo to load exercises
2. **Keep terminals open:** Don't close the server windows
3. **Test API first:** Run `python test_demo.py` before presenting
4. **Have backup:** Take screenshots of key features
5. **Practice navigation:** Know the routes between pages

---

## 🎬 Demo Script (5 minutes)

**0:00-0:30** - Introduction & Overview
- Open homepage
- Explain AI fitness concept

**0:30-2:00** - Exercise Library (Main Feature)
- Show 1,500+ exercises
- Demonstrate search
- Filter by body parts
- Filter by equipment
- Click on exercise for details

**2:00-3:30** - AI Features
- Show pose detection
- Demonstrate real-time feedback
- Explain ML integration

**3:30-4:30** - Additional Features
- Diet planning
- Progress analytics
- Dashboard overview

**4:30-5:00** - Technical Highlights & Q&A
- Mention tech stack
- API integration
- Scalability

---

## 📞 Emergency Recovery

If something breaks during demo:

1. **Kill everything:**
   ```batch
   taskkill /F /IM python.exe
   taskkill /F /IM node.exe
   ```

2. **Restart:**
   ```batch
   START_DEMO.bat → Option 3
   ```

3. **Wait 15 seconds** for both servers to start

---

## ✅ System Requirements

- **Python:** 3.8 or higher ✓
- **Node.js:** 16.x or higher ✓
- **RAM:** 4GB minimum ✓
- **Ports:** 3000 and 8002 available ✓

---

## 📊 Tech Stack Highlights

- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS
- **Backend:** FastAPI (Python), async/await
- **AI/ML:** MediaPipe, Custom recommendation engine
- **APIs:** ExerciseDB (exercises), Spoonacular (nutrition)
- **Real-time:** WebSocket connections
- **Database:** PostgreSQL ready

---

**Good luck with your presentation!** 🎓✨

For detailed demo guide, see: `DEMO_GUIDE.md`
