'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const MIN_INTERVAL_MS = 4000 // global throttle: at most one speech every 4s
const REPEAT_COOLDOWN_MS = 8000 // same exact message can't repeat within 8s
const STABILITY_MS = 1500 // a feedback message must persist for 1.5s before being voiced

interface SpokenRecord {
  text: string
  at: number
}

interface Candidate {
  text: string
  firstSeen: number
}

export function useSpeech(initialEnabled: boolean = true) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const lastSpokeRef = useRef<SpokenRecord | null>(null)
  const candidateRef = useRef<Candidate | null>(null)
  const lastRepSpokenRef = useRef<number>(0)

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const cancel = useCallback(() => {
    if (isSupported) window.speechSynthesis.cancel()
  }, [isSupported])

  const speak = useCallback(
    (text: string, opts: { force?: boolean; rate?: number } = {}) => {
      if (!enabled || !isSupported || !text) return false
      const now = Date.now()
      const last = lastSpokeRef.current
      if (!opts.force) {
        if (last && now - last.at < MIN_INTERVAL_MS) return false
        if (last && last.text === text && now - last.at < REPEAT_COOLDOWN_MS) return false
      }
      try {
        window.speechSynthesis.cancel() // stop anything in-progress
        const utter = new SpeechSynthesisUtterance(text)
        utter.rate = opts.rate ?? 1.05
        utter.pitch = 1
        utter.volume = 0.9
        window.speechSynthesis.speak(utter)
        lastSpokeRef.current = { text, at: now }
        return true
      } catch {
        return false
      }
    },
    [enabled, isSupported],
  )

  /**
   * Considers a candidate feedback message. Only speaks it once it has been
   * the candidate for at least STABILITY_MS, satisfying the global throttle
   * and repeat cooldown. Call this on every analyzed frame.
   */
  const considerFeedback = useCallback(
    (text: string | null | undefined) => {
      if (!enabled) return
      const now = Date.now()
      if (!text) {
        candidateRef.current = null
        return
      }
      if (!candidateRef.current || candidateRef.current.text !== text) {
        candidateRef.current = { text, firstSeen: now }
        return
      }
      if (now - candidateRef.current.firstSeen >= STABILITY_MS) {
        if (speak(text)) {
          // Reset the candidate so we wait for stability again before re-speaking.
          candidateRef.current = null
        }
      }
    },
    [enabled, speak],
  )

  /**
   * Speak rep count milestones (every 5 reps by default). Pass current rep
   * count on every analyzed frame; we only speak when a new milestone is hit.
   */
  const considerRepMilestone = useCallback(
    (reps: number, every: number = 5) => {
      if (!enabled || reps <= 0) return
      if (reps % every !== 0) return
      if (reps === lastRepSpokenRef.current) return
      lastRepSpokenRef.current = reps
      speak(String(reps), { force: true, rate: 1.15 })
    },
    [enabled, speak],
  )

  const reset = useCallback(() => {
    candidateRef.current = null
    lastSpokeRef.current = null
    lastRepSpokenRef.current = 0
    cancel()
  }, [cancel])

  // Cancel speech if disabled or unmounted.
  useEffect(() => {
    if (!enabled) cancel()
  }, [enabled, cancel])

  useEffect(() => {
    return () => cancel()
  }, [cancel])

  return {
    enabled,
    setEnabled,
    isSupported,
    speak,
    considerFeedback,
    considerRepMilestone,
    reset,
    cancel,
  }
}
