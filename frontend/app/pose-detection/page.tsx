'use client'

import { useEffect, useRef, useState } from 'react'
import TopNav from '../../components/TopNav'
import Footer from '../../components/Footer'
import BottomCTA from '../../components/BottomCTA'
import { getApiUrl, getWsUrl } from '../../utils/api'

type ExerciseKey = 'squat' | 'pushup' | 'plank'

interface ExerciseInfo {
  label: string
  targetMuscles: string
  steps: string[]
}

const EXERCISES: Record<ExerciseKey, ExerciseInfo> = {
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

export default function PoseDetectionPage() {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseKey>('squat')
  const [cameraActive, setCameraActive] = useState(false)
  const [processingActive, setProcessingActive] = useState(false)
  const [repCount, setRepCount] = useState(0)
  const [formScore, setFormScore] = useState(0)
  const [currentFeedback, setCurrentFeedback] = useState<string[]>([])
  const [connectionState, setConnectionState] = useState<
    'idle' | 'live' | 'processing' | 'error'
  >('idle')

  const videoRef = useRef<HTMLVideoElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (wsRef.current) wsRef.current.close()
      const v = videoRef.current
      if (v?.srcObject) {
        const stream = v.srcObject as MediaStream
        stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
      setRepCount(0)
      setFormScore(0)
      setCurrentFeedback([])

      const ws = new WebSocket(getWsUrl('/ws/pose'))
      wsRef.current = ws

      ws.onopen = () => {
        setProcessingActive(true)
        setConnectionState('live')
        startFrameCapture()
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'analysis') {
          setRepCount(data.rep_count || 0)
          setFormScore(data.form_score || 0)
          setCurrentFeedback(data.feedback || [])
          setConnectionState('live')
        } else if (data.error) {
          setConnectionState('error')
        }
      }

      ws.onerror = () => {
        setProcessingActive(false)
        setConnectionState('error')
      }

      ws.onclose = () => {
        setProcessingActive(false)
        setConnectionState((s) => (s === 'error' ? 'error' : 'idle'))
      }
    } catch (err) {
      console.error('Camera error:', err)
      setConnectionState('error')
      alert('Unable to access camera. Please grant camera permission.')
    }
  }

  const startFrameCapture = () => {
    if (intervalRef.current) return
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    intervalRef.current = window.setInterval(() => {
      if (
        videoRef.current &&
        wsRef.current?.readyState === WebSocket.OPEN &&
        tempCtx
      ) {
        const video = videoRef.current
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          tempCanvas.width = video.videoWidth
          tempCanvas.height = video.videoHeight
          tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height)
          const imageData = tempCanvas.toDataURL('image/jpeg', 0.5)
          setConnectionState('processing')
          wsRef.current.send(
            JSON.stringify({
              type: 'frame',
              image: imageData,
              exercise: selectedExercise,
            }),
          )
        }
      }
    }, 300)
  }

  const stopCamera = async () => {
    if (repCount > 0) await saveWorkoutSession()
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setProcessingActive(false)
    setConnectionState('idle')
  }

  const saveWorkoutSession = async () => {
    try {
      const caloriesPerRep =
        selectedExercise === 'squat' ? 8 : selectedExercise === 'pushup' ? 6 : 5
      const workoutData = {
        date: new Date().toISOString().split('T')[0],
        exercise_type: selectedExercise,
        duration_minutes: Math.max(5, repCount * 2),
        calories_burned: repCount * caloriesPerRep,
        intensity: Math.round(formScore / 10),
        reps: repCount,
        sets: Math.max(1, Math.ceil(repCount / 10)),
      }
      const apiUrl = getApiUrl()
      await fetch(`${apiUrl}/api/analytics/log-workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData),
      })
    } catch (err) {
      console.error('Save workout error:', err)
    }
  }

  const resetCounter = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'reset' }))
    }
    setRepCount(0)
    setFormScore(0)
  }

  const changeExercise = (ex: ExerciseKey) => {
    setSelectedExercise(ex)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'change_exercise', exercise: ex }))
    }
  }

  const exerciseInfo = EXERCISES[selectedExercise]

  const statusPill = (() => {
    if (!cameraActive) return { label: '○ CAMERA OFF', color: 'text-on-surface-variant' }
    if (connectionState === 'error') return { label: '● ERROR', color: 'text-signal' }
    if (connectionState === 'processing')
      return { label: '● PROCESSING', color: 'text-signal' }
    return { label: '● LIVE', color: 'text-primary-fixed' }
  })()

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
              Real-time form scoring powered by MediaPipe.
            </p>
          </div>
          <span className={`font-label-caps text-label-caps ${statusPill.color}`}>
            {statusPill.label}
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

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-margin-mobile">
                <span className="font-label-caps text-label-caps text-on-surface-variant mb-4">
                  CAMERA INACTIVE
                </span>
                <p className="font-display-xl text-[40px] md:text-[64px] leading-none text-primary mb-8 uppercase">
                  STAND BACK<br />FULL BODY IN FRAME
                </p>
                <button
                  onClick={startCamera}
                  className="bg-primary-fixed text-on-primary-fixed font-headline-md text-headline-md tracking-widest px-12 py-6 hover:bg-white hover:text-black transition-colors active:scale-95"
                >
                  START SESSION
                </button>
              </div>
            )}

            {/* TOP-LEFT FORM SCORE */}
            <div className="absolute top-0 left-0 p-6 md:p-8 flex flex-col items-start z-10">
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
                  className="absolute bottom-0 left-0 right-0 bg-primary-fixed transition-all duration-300"
                  style={{ height: `${formScore}%` }}
                />
              </div>
            </div>

            {/* TOP-RIGHT REPS */}
            <div className="absolute top-0 right-0 p-6 md:p-8 flex flex-col items-end z-10 text-right">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                REPS
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className="font-data-point text-[80px] md:text-[144px] leading-none text-primary-fixed"
                  style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}
                >
                  {repCount}
                </span>
              </div>
            </div>

            {/* BOTTOM FEEDBACK TOAST */}
            {cameraActive && currentFeedback.length > 0 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-black/90 border-l-4 border-primary-fixed px-6 py-3 max-w-md animate-slide-down">
                <span className="font-label-caps text-label-caps text-white">
                  {currentFeedback[0].toUpperCase()}
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
