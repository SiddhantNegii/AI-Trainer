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

/**
 * American-male voices ranked from best to acceptable. We pick the first one
 * the user's browser/OS exposes. The "Online (Natural)" voices in Edge are
 * neural and sound essentially human. Alex on macOS is also excellent.
 */
const VOICE_PREFERENCES = [
  // Microsoft Edge premium neural voices (best — sound nearly human)
  'Microsoft Guy Online (Natural) - English (United States)',
  'Microsoft Davis Online (Natural) - English (United States)',
  'Microsoft Tony Online (Natural) - English (United States)',
  'Microsoft Jason Online (Natural) - English (United States)',
  'Microsoft Brandon Online (Natural) - English (United States)',
  'Microsoft Christopher Online (Natural) - English (United States)',
  'Microsoft Eric Online (Natural) - English (United States)',
  // macOS Sonoma+ neural voices
  'Aaron',
  // macOS classic — high quality American male
  'Alex',
  // Windows built-in (offline)
  'Microsoft David Desktop - English (United States)',
  'Microsoft David - English (United States)',
  'Microsoft Mark - English (United States)',
  // Chrome built-in
  'Google US English',
  // Older fallbacks
  'Tom',
  'Fred',
]

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null

  // 1. Try exact-name matches in priority order.
  for (const name of VOICE_PREFERENCES) {
    const exact = voices.find((v) => v.name === name)
    if (exact) return exact
  }

  // 2. Try partial-name match (handles "Microsoft David" vs full label).
  for (const name of VOICE_PREFERENCES) {
    const partial = voices.find((v) => v.name.includes(name))
    if (partial) return partial
  }

  // 3. Any US-English voice whose name suggests a male identity.
  const maleHints = ['guy', 'david', 'mark', 'alex', 'aaron', 'tom', 'eric', 'jason', 'brandon', 'christopher', 'davis', 'tony', 'fred']
  const enUSMale = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith('en-us') &&
      maleHints.some((h) => v.name.toLowerCase().includes(h)),
  )
  if (enUSMale) return enUSMale

  // 4. Any US-English voice.
  const enUS = voices.find((v) => v.lang.toLowerCase().startsWith('en-us'))
  if (enUS) return enUS

  // 5. Any English voice.
  const en = voices.find((v) => v.lang.toLowerCase().startsWith('en'))
  if (en) return en

  // 6. First available.
  return voices[0]
}

export function useSpeech(initialEnabled: boolean = true) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const lastSpokeRef = useRef<SpokenRecord | null>(null)
  const candidateRef = useRef<Candidate | null>(null)
  const lastRepSpokenRef = useRef<number>(0)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Load the preferred voice. Some browsers populate voices asynchronously.
  useEffect(() => {
    if (!isSupported) return
    const synth = window.speechSynthesis
    const loadVoice = () => {
      const voice = pickVoice(synth.getVoices())
      if (voice) {
        voiceRef.current = voice
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.info('[useSpeech] selected voice:', voice.name, voice.lang)
        }
      }
    }
    loadVoice()
    synth.addEventListener('voiceschanged', loadVoice)
    return () => synth.removeEventListener('voiceschanged', loadVoice)
  }, [isSupported])

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
        if (voiceRef.current) {
          utter.voice = voiceRef.current
          utter.lang = voiceRef.current.lang
        } else {
          utter.lang = 'en-US'
        }
        // Slightly slower than default + slightly lower pitch reads as a more
        // confident, athletic-coach delivery.
        utter.rate = opts.rate ?? 1.0
        utter.pitch = 0.95
        utter.volume = 1.0
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
      speak(String(reps), { force: true, rate: 1.1 })
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
