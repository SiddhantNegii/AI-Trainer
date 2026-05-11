'use client'

import { useEffect, useRef, useState } from 'react'
import TopNav from '../../components/TopNav'
import Footer from '../../components/Footer'
import BottomCTA from '../../components/BottomCTA'
import { useAuthFetch } from '../../utils/authFetch'
import {
  ExerciseAnalyzer,
  POSE_CONNECTIONS,
  type ExerciseKey,
  type AnalysisResult,
  type Point,
} from '../../utils/exerciseAnalyzer'

const EXERCISES: Record<ExerciseKey, { label: string; targetMuscles: string; steps: string[] }> = {
  squat: {
    label: 'SQUAT',
    targetMuscles: 'QUADS · GLUTES · HAMSTRINGS',
    steps: [
      'STAND WITH FEET SHOULDER-WIDTH APART',
      'LOWER HIPS BACK AND DOWN',
      'KEEP CHEST UP, BACK STRAIGHT',
      'DESCEND UNTIL THIGHS PARALLEL TO FLOOR',
      'DRIVE THROUGH HEELS TO STAND',
    ],
  },
  pushup: {
    label: 'PUSH-UP',
    targetMuscles: 'CHEST · TRICEPS · SHOULDERS',
    steps: [
      'PLANK POSITION, HANDS UNDER SHOULDERS',
      'BRACE CORE, BACK FLAT',
      'LOWER UNTIL CHEST NEARS FLOOR',
      'KEEP ELBOWS AT 45° FROM TORSO',
      'PRESS UP TO STARTING POSITION',
    ],
  },
  plank: {
    label: 'PLANK',
    targetMuscles: 'CORE · SHOULDERS · GLUTES',
    steps: [
      'FOREARMS ON GROUND, ELBOWS UNDER SHOULDERS',
      'EXTEND LEGS BACK, TOES ON GROUND',
      'BODY FORMS A STRAIGHT LINE HEAD TO HEELS',
      'BRACE CORE, BREATHE STEADILY',
      'HOLD POSITION FOR THE TARGET DURATION',
    ],
  },
}

type ConnectionState = 'idle' | 'loading' | 'live' | 'error'

export default function PoseDetectionPage() {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseKey>('squat')
  const [cameraActive, setCameraActive] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult>({
    feedback: [],
    score: 0,
    reps: 0,
    stage: null,
  })

  const authFetch = useAuthFetch()

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyzerRef = useRef<ExerciseAnalyzer>(new ExerciseAnalyzer())
  const landmarkerRef = useRef<unknown | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastVideoTimeRef = useRef<number>(-1)
  const streamRef = useRef<MediaStream | null>(null)
  const sessionStartRef = useRef<number | null>(null)
  const formScoreSumRef = useRef<number>(0)
  const formScoreSamplesRef = useRef<number>(0)
  const [savedToast, setSavedToast] = useState<string | null>(null)

  useEffect(() => {
    analyzerRef.current.setExercise(selectedExercise)
  }, [selectedExercise])

  useEffect(() => {
    // Cleanup on unmount.
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  const initLandmarker = async () => {
    if (landmarkerRef.current) return landmarkerRef.current
    const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.10/wasm',
    )
    const landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
    })
    landmarkerRef.current = landmarker
    return landmarker
  }

  const startCamera = async () => {
    setErrorMsg(null)
    setConnectionState('loading')
    try {
      const landmarker = (await initLandmarker()) as {
        detectForVideo: (
          video: HTMLVideoElement,
          ts: number,
        ) => { landmarks: Point[][] }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      analyzerRef.current.reset()
      setAnalysis({ feedback: [], score: 0, reps: 0, stage: null })
      setCameraActive(true)
      setConnectionState('live')
      sessionStartRef.current = Date.now()
      formScoreSumRef.current = 0
      formScoreSamplesRef.current = 0
      loop(landmarker)
    } catch (err) {
      console.error('Camera/landmarker error:', err)
      setErrorMsg('Could not start camera. Grant permission and reload.')
      setConnectionState('error')
    }
  }

  const loop = (landmarker: {
    detectForVideo: (video: HTMLVideoElement, ts: number) => { landmarks: Point[][] }
  }) => {
    const tick = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      const ts = performance.now()
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime
        try {
          const result = landmarker.detectForVideo(video, ts)
          const landmarks = result.landmarks?.[0] ?? null
          if (landmarks) {
            const a = analyzerRef.current.analyze(landmarks)
            setAnalysis(a)
            if (a.score > 0) {
              formScoreSumRef.current += a.score
              formScoreSamplesRef.current += 1
            }
            drawSkeleton(canvas, video, landmarks)
          } else {
            drawSkeleton(canvas, video, null)
          }
        } catch (err) {
          console.error('detectForVideo error:', err)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const drawSkeleton = (
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    landmarks: Point[] | null,
  ) => {
    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    if (canvas.width !== w) canvas.width = w
    if (canvas.height !== h) canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    if (!landmarks) return

    ctx.strokeStyle = '#cbf22b'
    ctx.lineWidth = 3
    ctx.fillStyle = '#cbf22b'

    POSE_CONNECTIONS.forEach(([a, b]) => {
      const pa = landmarks[a]
      const pb = landmarks[b]
      if (!pa || !pb) return
      ctx.beginPath()
      ctx.moveTo(pa.x * w, pa.y * h)
      ctx.lineTo(pb.x * w, pb.y * h)
      ctx.stroke()
    })

    landmarks.forEach((lm, i) => {
      // only draw upper-body + leg landmarks for clarity (skip face details)
      if (i < 11) return
      ctx.beginPath()
      ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const stopCamera = async () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    setCameraActive(false)
    setConnectionState('idle')

    const reps = analyzerRef.current.getRepCount()
    const avgScore =
      formScoreSamplesRef.current > 0
        ? Math.round(formScoreSumRef.current / formScoreSamplesRef.current)
        : 0
    const duration = sessionStartRef.current
      ? Math.round((Date.now() - sessionStartRef.current) / 1000)
      : 0

    const shouldLog =
      duration >= 5 && (reps > 0 || (selectedExercise === 'plank' && duration >= 10))
    if (!shouldLog) return

    try {
      const res = await authFetch('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          exercise: selectedExercise,
          reps,
          form_score: avgScore,
          duration_seconds: duration,
        }),
      })
      if (res.ok) {
        setSavedToast('SESSION SAVED →')
        setTimeout(() => setSavedToast(null), 2500)
      }
    } catch (err) {
      console.error('Save session error:', err)
    }
  }

  const resetCounter = () => {
    analyzerRef.current.reset()
    setAnalysis({ feedback: [], score: 0, reps: 0, stage: null })
  }

  const changeExercise = (ex: ExerciseKey) => {
    setSelectedExercise(ex)
  }

  const exerciseInfo = EXERCISES[selectedExercise]

  const statusPill = (() => {
    if (errorMsg) return { label: '● ERROR', color: 'text-signal' }
    if (connectionState === 'loading')
      return { label: '● LOADING MODEL', color: 'text-on-surface-variant' }
    if (!cameraActive) return { label: '○ CAMERA OFF', color: 'text-on-surface-variant' }
    return { label: '● LIVE', color: 'text-primary-fixed' }
  })()

  const formScore = analysis.score
  const repCount = analysis.reps

  return (
    <div className="bg-background text-on-background min-h-screen">
      <TopNav />

      <main className="pt-24 pb-0">
        {/* HEADER */}
        <section className="px-margin-mobile lg:px-margin-desktop py-12 bg-surface border-b border-outline-variant/20 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <h1 className="font-display-xl text-[48px] md:text-[64px] leading-none text-primary uppercase">
              POSE DETECTION
            </h1>
            <p className="font-body-lg text-body-lg text-secondary mt-3">
              Real-time form scoring powered by MediaPipe — running on-device.
            </p>
          </div>
          <span className={`font-label-caps text-label-caps ${statusPill.color}`}>
            {savedToast ?? statusPill.label}
          </span>
        </section>

        {/* MAIN STAGE */}
        <section className="relative w-full bg-black overflow-hidden">
          <div className="relative aspect-video max-h-[78vh] w-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-black"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-margin-mobile bg-black/40 backdrop-blur-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant mb-4">
                  CAMERA INACTIVE
                </span>
                <p className="font-display-xl text-[40px] md:text-[64px] leading-none text-primary mb-8 uppercase">
                  STAND BACK<br />FULL BODY IN FRAME
                </p>
                <button
                  onClick={startCamera}
                  disabled={connectionState === 'loading'}
                  className="bg-primary-fixed text-on-primary-fixed font-headline-md text-headline-md tracking-widest px-12 py-6 hover:bg-white hover:text-black transition-colors active:scale-95 disabled:opacity-60"
                >
                  {connectionState === 'loading' ? 'LOADING MODEL…' : 'START SESSION'}
                </button>
                {errorMsg && (
                  <p className="mt-6 font-label-caps text-label-caps text-signal max-w-md">
                    {errorMsg}
                  </p>
                )}
              </div>
            )}

            {/* TOP-LEFT FORM SCORE */}
            <div className="absolute top-0 left-0 p-6 md:p-8 flex flex-col items-start z-10 pointer-events-none">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                FORM
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-data-point text-[64px] md:text-[96px] leading-none ${
                    formScore >= 85
                      ? 'text-primary-fixed'
                      : formScore >= 60
                      ? 'text-primary'
                      : 'text-signal'
                  }`}
                  style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}
                >
                  {formScore}
                </span>
                <span className="font-headline-md text-[20px] md:text-[32px] text-on-surface-variant">
                  /100
                </span>
              </div>
              <div className="mt-3 w-1 h-24 md:h-32 bg-white/20 relative">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-primary-fixed transition-all duration-150"
                  style={{ height: `${formScore}%` }}
                />
              </div>
            </div>

            {/* TOP-RIGHT REPS */}
            <div className="absolute top-0 right-0 p-6 md:p-8 flex flex-col items-end z-10 text-right pointer-events-none">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                REPS
              </span>
              <span
                className="font-data-point text-[80px] md:text-[144px] leading-none text-primary-fixed"
                style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}
              >
                {repCount}
              </span>
            </div>

            {/* FEEDBACK TOAST */}
            {cameraActive && analysis.feedback.length > 0 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-black/90 border-l-4 border-primary-fixed px-6 py-3 max-w-md pointer-events-none">
                <span className="font-label-caps text-label-caps text-white">
                  {analysis.feedback[0]}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* TAB BAR + CONTROLS */}
        <section className="bg-surface-container border-b border-outline-variant/20 py-6">
          <div className="px-margin-mobile lg:px-margin-desktop flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
            <div className="flex justify-center md:justify-start gap-8 md:gap-16">
              {(Object.keys(EXERCISES) as ExerciseKey[]).map((key) => {
                const isActive = selectedExercise === key
                return (
                  <button
                    key={key}
                    onClick={() => changeExercise(key)}
                    className={`font-headline-md text-[20px] md:text-headline-md transition-colors pb-2 ${
                      isActive
                        ? 'text-primary-fixed border-b-4 border-primary-fixed'
                        : 'text-secondary hover:text-primary-fixed'
                    }`}
                  >
                    {EXERCISES[key].label}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-3 justify-end">
              {cameraActive && (
                <>
                  <button
                    onClick={resetCounter}
                    className="font-label-caps text-label-caps text-secondary border border-outline-variant px-6 py-3 hover:text-primary-fixed hover:border-primary-fixed transition-colors"
                  >
                    RESET REPS
                  </button>
                  <button
                    onClick={stopCamera}
                    className="font-label-caps text-label-caps text-signal px-6 py-3 hover:text-white transition-colors"
                  >
                    END SESSION →
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* HOW TO */}
        <section className="px-margin-mobile lg:px-margin-desktop py-section-gap grid grid-cols-1 md:grid-cols-5 gap-12">
          <div className="md:col-span-2">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              HOW TO
            </span>
            <h2 className="font-display-xl text-[56px] md:text-[80px] leading-none text-primary-fixed mt-4">
              {exerciseInfo.label}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-4 uppercase tracking-wide">
              {exerciseInfo.targetMuscles}
            </p>
          </div>
          <div className="md:col-span-3 flex flex-col">
            {exerciseInfo.steps.map((step, i) => (
              <div
                key={i}
                className="flex items-baseline gap-6 py-5 border-b border-outline-variant/20"
              >
                <span className="font-display-xl text-[36px] md:text-[48px] leading-none text-primary-fixed w-12 flex-shrink-0">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <span className="font-body-lg text-body-lg text-primary">{step}</span>
              </div>
            ))}
          </div>
        </section>

        <BottomCTA
          headline="KEEP TRAINING."
          buttonLabel="VIEW PROGRESS"
          href="/dashboard"
        />
      </main>

      <Footer />
    </div>
  )
}
