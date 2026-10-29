'use client'

import { useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import TopNav from '../../components/TopNav'
import Footer from '../../components/Footer'
import { useAuthFetch } from '../../utils/authFetch'

type Goal = 'lose-fat' | 'build-muscle' | 'athletic' | 'general'
type Units = 'metric' | 'imperial'

interface Profile {
  user_id: string
  email: string | null
  name: string | null
  height_cm: number | null
  weight_kg: number | null
  goal: Goal | null
  unit_system: Units
}

const GOALS: { id: Goal; label: string; description: string }[] = [
  { id: 'lose-fat', label: 'LOSE FAT', description: 'Cut weight while preserving muscle.' },
  { id: 'build-muscle', label: 'BUILD MUSCLE', description: 'Hypertrophy-focused programming.' },
  { id: 'athletic', label: 'ATHLETIC PERFORMANCE', description: 'Speed, power, conditioning.' },
  { id: 'general', label: 'GENERAL FITNESS', description: 'Stay strong, stay consistent.' },
]

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const authFetch = useAuthFetch()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    let cancelled = false
    const load = async () => {
      try {
        const res = await authFetch('/api/profile')
        if (res.ok) {
          const p = await res.json()
          if (!cancelled) setProfile(p)
        }
      } catch (err) {
        console.error('Profile load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isLoaded, authFetch])

  const save = async (updates: Partial<Profile>) => {
    if (!profile) return
    setSaving(true)
    setStatusMsg(null)
    const next = { ...profile, ...updates }
    setProfile(next)
    try {
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const updated = await res.json()
        setProfile(updated)
        setStatusMsg('SAVED')
        setTimeout(() => setStatusMsg(null), 1800)
      } else {
        setStatusMsg('SAVE FAILED')
      }
    } catch (err) {
      console.error('Profile save error:', err)
      setStatusMsg('SAVE FAILED')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="bg-background text-on-background min-h-screen">
        <TopNav />
        <main className="pt-24 px-margin-mobile lg:px-margin-desktop py-24 text-center">
          <p className="font-label-caps text-label-caps text-on-surface-variant">
            LOADING PROFILE…
          </p>
        </main>
        <Footer />
      </div>
    )
  }

  const name = profile.name || user?.fullName || user?.firstName || 'ATHLETE'
  const email = profile.email || user?.emailAddresses?.[0]?.emailAddress || '—'
  const photoUrl = user?.imageUrl

  return (
    <div className="bg-background text-on-background min-h-screen">
      <TopNav />

      <main className="pt-24 pb-0">
        <section className="px-margin-mobile lg:px-margin-desktop py-12 border-b border-outline-variant/20 flex items-end justify-between">
          <h1 className="font-display-xl text-[48px] md:text-[64px] leading-none text-primary uppercase">
            PROFILE
          </h1>
          {statusMsg && (
            <span
              className={`font-label-caps text-label-caps uppercase ${
                statusMsg === 'SAVED' ? 'text-primary-fixed' : 'text-signal'
              }`}
            >
              {statusMsg}
            </span>
          )}
        </section>

        <section className="px-margin-mobile lg:px-margin-desktop py-section-gap grid grid-cols-1 md:grid-cols-10 gap-12">
          {/* LEFT */}
          <div className="md:col-span-3 flex flex-col">
            <div className="w-full max-w-[280px] aspect-square bg-surface-container overflow-hidden mb-6 flex items-center justify-center">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={name}
                  className="w-full h-full object-cover grayscale"
                />
              ) : (
                <span
                  className="material-symbols-outlined text-[140px] text-on-surface-variant"
                  style={{ fontVariationSettings: '"wght" 100' }}
                >
                  account_circle
                </span>
              )}
            </div>
            <h2 className="font-display-xl text-[36px] md:text-[48px] leading-none text-primary uppercase">
              {name}
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-3">{email}</p>
            <p className="font-label-caps text-label-caps text-on-surface-variant mt-4">
              MANAGED BY CLERK · CHANGE PHOTO IN ACCOUNT MENU
            </p>
          </div>

          {/* RIGHT */}
          <div className="md:col-span-7 flex flex-col">
            <SectionLabel>PERSONAL</SectionLabel>
            <StatRow label="HEIGHT">
              <InlineNumberInput
                value={profile.height_cm ?? 0}
                onChange={(v) => save({ height_cm: v })}
                disabled={saving}
                unit={profile.unit_system === 'imperial' ? 'IN' : 'CM'}
              />
            </StatRow>
            <StatRow label="WEIGHT" last>
              <InlineNumberInput
                value={profile.weight_kg ?? 0}
                onChange={(v) => save({ weight_kg: v })}
                disabled={saving}
                unit={profile.unit_system === 'imperial' ? 'LB' : 'KG'}
              />
            </StatRow>

            <SectionLabel>GOAL</SectionLabel>
            <p className="font-body-md text-body-md text-secondary mb-6">
              What are you training for?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {GOALS.map((g) => {
                const active = profile.goal === g.id
                return (
                  <button
                    key={g.id}
                    onClick={() => save({ goal: g.id })}
                    disabled={saving}
                    className={`text-left p-6 border-2 transition-colors disabled:opacity-60 ${
                      active
                        ? 'border-primary-fixed bg-primary-fixed/5'
                        : 'border-outline-variant/40 hover:border-primary-fixed/60'
                    }`}
                  >
                    <span className="font-display-xl text-[28px] md:text-[40px] leading-tight text-primary uppercase block">
                      {g.label}
                    </span>
                    <span className="font-body-md text-body-md text-secondary mt-2 block">
                      {g.description}
                    </span>
                  </button>
                )
              })}
            </div>

            <SectionLabel>UNITS</SectionLabel>
            <div className="flex items-center justify-between py-5 border-b border-outline-variant/20 mb-12">
              <span className="font-body-md text-body-md text-secondary">
                MEASUREMENT SYSTEM
              </span>
              <div className="flex">
                {(['imperial', 'metric'] as Units[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => save({ unit_system: u })}
                    disabled={saving}
                    className={`font-label-caps text-label-caps px-5 py-2 border ${
                      profile.unit_system === u
                        ? 'bg-primary-fixed text-on-primary-fixed border-primary-fixed'
                        : 'text-secondary border-outline-variant/40'
                    }`}
                  >
                    {u.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <SectionLabel muted>ACCOUNT</SectionLabel>
            <div className="flex flex-col">
              <button
                onClick={() => signOut({ redirectUrl: '/' })}
                className="flex items-center justify-between py-5 border-b border-outline-variant/20 group"
              >
                <span className="font-headline-md text-headline-md text-signal group-hover:text-white transition-colors">
                  SIGN OUT
                </span>
                <span className="font-headline-md text-headline-md text-signal group-hover:text-white transition-colors">
                  →
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function SectionLabel({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`font-label-caps text-label-caps uppercase mb-4 ${
        muted ? 'text-on-surface-variant' : 'text-primary-fixed'
      }`}
    >
      {children}
    </span>
  )
}

function StatRow({
  label,
  children,
  last,
}: {
  label: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between py-5 border-b border-outline-variant/20 ${
        last ? 'mb-12' : ''
      }`}
    >
      <span className="font-body-md text-body-md text-secondary">{label}</span>
      {children}
    </div>
  )
}

function InlineNumberInput({
  value,
  onChange,
  disabled,
  unit,
}: {
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  unit: string
}) {
  const [local, setLocal] = useState(value > 0 ? String(value) : '')

  useEffect(() => {
    setLocal(value > 0 ? String(value) : '')
  }, [value])

  return (
    <div className="flex items-baseline gap-4">
      <input
        type="number"
        value={local}
        placeholder="—"
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const n = Number(local)
          if (!Number.isNaN(n) && n > 0 && n !== value) onChange(n)
        }}
        disabled={disabled}
        className="w-20 md:w-28 bg-transparent border-b border-transparent focus:border-primary-fixed text-right font-display-xl text-[32px] md:text-[48px] leading-none text-primary outline-none disabled:opacity-60"
      />
      <span className="font-label-caps text-label-caps text-primary-fixed">{unit}</span>
    </div>
  )
}
