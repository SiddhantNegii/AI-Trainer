/**
 * Client-side exercise form analyzer.
 * Ported from backend/ml_models/pose_detection/exercise_analyzer.py.
 * Operates on MediaPipe pose landmarks (33 keypoints).
 */

export interface Point {
  x: number
  y: number
  z?: number
  visibility?: number
}

export type ExerciseKey = 'squat' | 'pushup' | 'plank'

export interface AnalysisResult {
  feedback: string[]
  score: number
  reps: number
  stage: 'up' | 'down' | null
}

// MediaPipe Pose landmark indices.
export const LM = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const

const THRESHOLDS = {
  squat: { kneeDown: 90, kneeUp: 160, backMin: 160, backMax: 200 },
  pushup: { elbowDown: 90, elbowUp: 160, bodyMin: 160, bodyMax: 200 },
  plank: { bodyMin: 165, bodyMax: 195 },
}

/**
 * Returns the angle (in degrees) at vertex b formed by points a-b-c.
 * 0 = collinear in same direction, 180 = straight line, 360 = full turn.
 */
export function angle(a: Point, b: Point, c: Point): number {
  const ab = { x: a.x - b.x, y: a.y - b.y }
  const cb = { x: c.x - b.x, y: c.y - b.y }
  const dot = ab.x * cb.x + ab.y * cb.y
  const magA = Math.hypot(ab.x, ab.y)
  const magC = Math.hypot(cb.x, cb.y)
  if (magA === 0 || magC === 0) return 0
  const cos = Math.max(-1, Math.min(1, dot / (magA * magC)))
  return (Math.acos(cos) * 180) / Math.PI
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, n) => s + n, 0) / arr.length
}

function getLm(landmarks: Point[] | null | undefined, idx: number): Point | null {
  if (!landmarks || !landmarks[idx]) return null
  return landmarks[idx]
}

export class ExerciseAnalyzer {
  private repCount = 0
  private stage: 'up' | 'down' | null = null
  private exercise: ExerciseKey = 'squat'

  setExercise(ex: ExerciseKey) {
    if (ex !== this.exercise) {
      this.exercise = ex
      this.reset()
    }
  }

  reset() {
    this.repCount = 0
    this.stage = null
  }

  getRepCount() {
    return this.repCount
  }

  analyze(landmarks: Point[] | null): AnalysisResult {
    if (this.exercise === 'squat') return this.analyzeSquat(landmarks)
    if (this.exercise === 'pushup') return this.analyzePushup(landmarks)
    return this.analyzePlank(landmarks)
  }

  private empty(): AnalysisResult {
    return { feedback: ['NO POSE DETECTED'], score: 0, reps: this.repCount, stage: this.stage }
  }

  private analyzeSquat(landmarks: Point[] | null): AnalysisResult {
    const hip = getLm(landmarks, LM.LEFT_HIP)
    const knee = getLm(landmarks, LM.LEFT_KNEE)
    const ankle = getLm(landmarks, LM.LEFT_ANKLE)
    const shoulder = getLm(landmarks, LM.LEFT_SHOULDER)
    if (!hip || !knee || !ankle || !shoulder) return this.empty()

    const kneeAngle = angle(hip, knee, ankle)
    const backAngle = angle(shoulder, hip, knee)

    const feedback: string[] = []
    const components: number[] = []

    if (kneeAngle < THRESHOLDS.squat.kneeDown) {
      if (this.stage !== 'down') this.stage = 'down'
      components.push(100)
    } else if (kneeAngle < 120) {
      components.push(70)
      feedback.push('GO DEEPER')
    } else {
      if (this.stage === 'down') {
        this.stage = 'up'
        this.repCount += 1
      }
      components.push(50)
    }

    if (backAngle > THRESHOLDS.squat.backMin && backAngle < THRESHOLDS.squat.backMax) {
      components.push(100)
    } else {
      components.push(50)
      feedback.push('KEEP BACK STRAIGHT')
    }

    if (Math.abs(knee.x - ankle.x) < 0.1) {
      components.push(100)
    } else {
      components.push(60)
      if (knee.x > ankle.x) feedback.push('KNEES TOO FORWARD')
    }

    return {
      feedback,
      score: Math.round(mean(components)),
      reps: this.repCount,
      stage: this.stage,
    }
  }

  private analyzePushup(landmarks: Point[] | null): AnalysisResult {
    const shoulder = getLm(landmarks, LM.LEFT_SHOULDER)
    const elbow = getLm(landmarks, LM.LEFT_ELBOW)
    const wrist = getLm(landmarks, LM.LEFT_WRIST)
    const hip = getLm(landmarks, LM.LEFT_HIP)
    const knee = getLm(landmarks, LM.LEFT_KNEE)
    if (!shoulder || !elbow || !wrist || !hip || !knee) return this.empty()

    const elbowAngle = angle(shoulder, elbow, wrist)
    const bodyAngle = angle(shoulder, hip, knee)

    const feedback: string[] = []
    const components: number[] = []

    if (elbowAngle < THRESHOLDS.pushup.elbowDown) {
      if (this.stage !== 'down') this.stage = 'down'
      components.push(100)
    } else if (elbowAngle < 120) {
      components.push(70)
      feedback.push('GO LOWER')
    } else {
      if (this.stage === 'down') {
        this.stage = 'up'
        this.repCount += 1
      }
      components.push(50)
    }

    if (bodyAngle > THRESHOLDS.pushup.bodyMin && bodyAngle < THRESHOLDS.pushup.bodyMax) {
      components.push(100)
    } else {
      components.push(50)
      if (bodyAngle < THRESHOLDS.pushup.bodyMin) feedback.push('HIPS TOO LOW')
      else feedback.push('HIPS TOO HIGH')
    }

    return {
      feedback,
      score: Math.round(mean(components)),
      reps: this.repCount,
      stage: this.stage,
    }
  }

  private analyzePlank(landmarks: Point[] | null): AnalysisResult {
    const shoulder = getLm(landmarks, LM.LEFT_SHOULDER)
    const hip = getLm(landmarks, LM.LEFT_HIP)
    const ankle = getLm(landmarks, LM.LEFT_ANKLE)
    if (!shoulder || !hip || !ankle) return this.empty()

    const bodyAngle = angle(shoulder, hip, ankle)
    const feedback: string[] = []
    const components: number[] = []

    if (bodyAngle > THRESHOLDS.plank.bodyMin && bodyAngle < THRESHOLDS.plank.bodyMax) {
      components.push(100)
    } else {
      components.push(50)
      if (bodyAngle < THRESHOLDS.plank.bodyMin) feedback.push('HIPS TOO LOW')
      else feedback.push('HIPS TOO HIGH')
    }

    return {
      feedback,
      score: Math.round(mean(components)),
      reps: this.repCount,
      stage: null,
    }
  }
}

/**
 * MediaPipe pose connections — edges between landmark indices used to draw the skeleton.
 */
export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], // shoulders
  [11, 13],
  [13, 15], // left arm
  [12, 14],
  [14, 16], // right arm
  [11, 23],
  [12, 24], // shoulder to hip
  [23, 24], // hips
  [23, 25],
  [25, 27], // left leg
  [24, 26],
  [26, 28], // right leg
]
