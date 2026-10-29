# AI Fitness Trainer

A web app that uses real-time pose detection to count reps, score exercise form, and recommend workouts and meals. Built with FastAPI, Next.js, and MediaPipe.

**Live demo:** _coming soon_

## Features

- Real-time pose detection over webcam via MediaPipe (squat, push-up, plank)
- Automatic rep counting and form scoring with corrective feedback
- Exercise database powered by ExerciseDB API with offline cache
- Meal plans and nutrition tracking via Spoonacular API
- Workout history and progress analytics

## Tech stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Uvicorn, SQLAlchemy, PostgreSQL
- **ML:** MediaPipe, OpenCV, NumPy
- **Deployment:** Render (Blueprint via `render.yaml`)

## Local setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL (optional locally; defaults work without it for read-only browsing)

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # then fill in your API keys
python run_server.py
```
Backend runs on `http://localhost:8002`.

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```
Frontend runs on `http://localhost:3000`.

## Environment variables

### Backend (`backend/.env`)
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `SECRET_KEY` | JWT signing secret |
| `FRONTEND_URL` or `FRONTEND_HOST` | CORS allowlist |
| `EXERCISEDB_API_KEY` | RapidAPI key for ExerciseDB |
| `EXERCISEDB_API_HOST` | `exercisedb-api1.p.rapidapi.com` |
| `SPOONACULAR_API_KEY` | Spoonacular meal API key |
| `PORT` | Server port (Render sets this automatically) |

### Frontend (`frontend/.env.local`)
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL, e.g. `http://localhost:8002` |

## Deployment

Render Blueprint config lives in [`render.yaml`](render.yaml). Connect this repo to Render as a Blueprint and Render will provision the backend, frontend, and Postgres database automatically. Set `EXERCISEDB_API_KEY` and `SPOONACULAR_API_KEY` manually in the Render dashboard.

## Project structure

```
backend/      FastAPI app, routes, ML integration
frontend/     Next.js app
ml_models/    Pose detection and exercise analyzer modules
datasets/     Dataset references (data not committed)
trained_models/  Trained model artifacts (placeholder)
```

## Status

This project is under active development. See `synopsis.txt` in `backend/` for the original technical synopsis.
