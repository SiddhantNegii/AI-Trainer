# AI-Powered Virtual Fitness Trainer 🏋️‍♂️

An intelligent, AI-powered fitness platform that acts as a personal fitness trainer, nutritionist, and wellness coach.

## Project Team
- **Rishabh Baloni** (University Roll No: 2219420, Section: A1)
- **Siddhant Negi** (University Roll No: 2219715, Section: L2)
- **Supervisor**: Ms. Priyanshi Aggarwal

---

## 🎯 Project Overview

This platform provides:
- ✅ **Real-time Pose Detection** - Exercise form correction using computer vision
- ✅ **Personalized Workout Plans** - AI-generated routines based on user goals
- ✅ **Diet Recommendations** - Smart meal planning and nutrition tracking
- ✅ **Progress Analytics** - Track improvements and predict goal achievement

---

## 📁 Project Structure

```
AI-Fitness-Trainer/
├── ml_models/                      # Machine Learning modules
│   ├── pose_detection/            # Real-time exercise form detection
│   ├── workout_recommendation/    # Personalized workout generation
│   ├── diet_recommendation/       # Meal planning & nutrition
│   └── progress_analytics/        # Progress tracking & predictions
│
├── backend/                        # FastAPI backend server
│   ├── app.py                     # Main application
│   ├── routes/                    # API endpoints
│   ├── models/                    # Database models
│   └── requirements.txt
│
├── frontend/                       # Next.js frontend
│   ├── app/                       # App router pages
│   ├── components/                # React components
│   ├── public/                    # Static assets
│   └── package.json
│
├── datasets/                       # Training and testing data
├── trained_models/                 # Saved ML models
└── PROJECT_PLAN.txt               # Complete project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- pip package manager
- Webcam (for pose detection testing)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd AI-Fitness-Trainer
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run backend server
python app.py
```

3. **Frontend Setup**
```bash
cd frontend
npm install

# Copy environment file
cp .env.local.example .env.local

# Run development server
npm run dev
```

4. **ML Models Setup**
```bash
# Install dependencies for each ML module
cd ml_models/pose_detection
pip install -r requirements.txt

# Repeat for other modules as needed
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🧠 ML Modules

### 1. Pose Detection
- **Technology**: MediaPipe, OpenCV
- **Purpose**: Real-time exercise form analysis
- **Features**: Squat, pushup, plank detection with form feedback

### 2. Workout Recommendation
- **Technology**: Scikit-learn, NumPy
- **Purpose**: Generate personalized workout plans
- **Features**: Adaptive difficulty, progressive overload

### 3. Diet Recommendation
- **Technology**: Pandas, Scikit-learn
- **Purpose**: Meal planning and nutrition tracking
- **Features**: Calorie calculation, macro distribution, meal alternatives

### 4. Progress Analytics
- **Technology**: Pandas, Matplotlib, Scikit-learn
- **Purpose**: Track and predict user progress
- **Features**: Trend analysis, goal predictions, plateau detection

---

## 📊 Development Status

- [x] Project structure created
- [x] Backend API structure (FastAPI)
- [x] Frontend structure (Next.js + TailwindCSS)
- [x] Database models defined
- [ ] Pose detection implementation
- [ ] Workout recommendation algorithm
- [ ] Diet planning system
- [ ] Progress analytics dashboard
- [ ] Model training and optimization
- [ ] ML model integration with backend
- [ ] Frontend pages and components

---

## 🛠️ Tech Stack

**Machine Learning**:
- MediaPipe (Pose Detection)
- TensorFlow/PyTorch (Deep Learning)
- Scikit-learn (ML Algorithms)
- OpenCV (Computer Vision)

**Development**:
- Python 3.8+
- Jupyter Notebooks (Testing)
- NumPy, Pandas (Data Processing)
- Matplotlib, Seaborn (Visualization)

**Future Integration**:
- FastAPI/Flask (Backend API)
- React/Next.js (Frontend)
- PostgreSQL (Database)

---

## 📝 Next Steps

1. **Week 1-2**: Implement pose detection with MediaPipe
2. **Week 3-4**: Build workout recommendation system
3. **Week 5-6**: Develop diet planning module
4. **Week 7-8**: Create progress analytics
5. **Week 9-10**: Integrate modules and create API
6. **Week 11-12**: Build frontend interface
7. **Week 13-14**: Testing and optimization
8. **Week 15**: Deployment

---

## 📖 Documentation

See [PROJECT_PLAN.txt](PROJECT_PLAN.txt) for complete project documentation including:
- Detailed feature specifications
- Technical architecture
- Development methodology
- Timeline and milestones

---

## 🤝 Contributing

This is an academic project. Contributions and suggestions are welcome!

---

## 📧 Contact

- **Rishabh Baloni**: [University Roll No: 2219420]
- **Siddhant Negi**: [University Roll No: 2219715]

---

## 📄 License

This project is for academic purposes.
