'use client'

import { useState } from 'react'
import TopNav from '../../components/TopNav'
import Footer from '../../components/Footer'

type Goal = 'lose-fat' | 'build-muscle' | 'athletic' | 'general'
type Units = 'imperial' | 'metric'

const GOALS: { id: Goal; label: string; description: string }[] = [
  { id: 'lose-fat', label: 'LOSE FAT', description: 'Cut weight while preserving muscle.' },
  { id: 'build-muscle', label: 'BUILD MUSCLE', description: 'Hypertrophy-focused programming.' },
  { id: 'athletic', label: 'ATHLETIC PERFORMANCE', description: 'Speed, power, conditioning.' },
  { id: 'general', label: 'GENERAL FITNESS', description: 'Stay strong, stay consistent.' },
]

export default function SettingsPage() {
  const [name] = useState('ATHLETE')
  const [email] = useState('athlete@example.com')
  const [height, setHeight] = useState(180)
  const [weight, setWeight] = useState(75)
  const [heightUnit, setHeightUnit] = useState<'cm' | 'in'>('cm')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg')
  const [goal, setGoal] = useState<Goal>('build-muscle')
  const [units, setUnits] = useState<Units>('metric')

  return (
    <div className="bg-background text-on-background min-h-screen">
      <TopNav />

      <main className="pt-24 pb-0">
        <section className="px-margin-mobile lg:px-margin-desktop py-12 border-b border-outline-variant/20">
          <h1 className="font-display-xl text-[48px] md:text-[64px] leading-none text-primary uppercase">
            PROFILE
          </h1>
        </section>

        <section className="px-margin-mobile lg:px-margin-desktop py-section-gap grid grid-cols-1 md:grid-cols-10 gap-12">
          {/* LEFT */}
          <div className="md:col-span-3 flex flex-col">
            <div className="w-full max-w-[280px] aspect-square bg-surface-container overflow-hidden mb-6 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[140px] text-on-surface-variant"
                style={{ fontVariationSettings: '"wght" 100' }}
              >
                account_circle
              </span>
            </div>
            <h2 className="font-display-xl text-[36px] md:text-[48px] leading-none text-primary uppercase">
              {name}
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-3">{email}</p>
            <button className="mt-4 font-label-caps text-label-caps text-primary-fixed border-b border-primary-fixed/40 pb-1 hover:text-white hover:border-white transition-colors w-fit">
              CHANGE PHOTO →
            </button>
          </div>

          {/* RIGHT */}
          <div className="md:col-span-7 flex flex-col">
            {/* PERSONAL */}
            <SectionLabel>PERSONAL</SectionLabel>
            <StatRow label="HEIGHT">
              <InlineNumberInput
                value={height}
                onChange={setHeight}
                unitToggle={
                  <UnitToggle
                    value={heightUnit}
                    options={['cm', 'in']}
                    onChange={(v) => setHeightUnit(v as 'cm' | 'in')}
                  />
                }
              />
            </StatRow>
            <StatRow label="WEIGHT" last>
              <InlineNumberInput
                value={weight}
                onChange={setWeight}
                unitToggle={
                  <UnitToggle
                    value={weightUnit}
                    options={['kg', 'lb']}
                    onChange={(v) => setWeightUnit(v as 'kg' | 'lb')}
                  />
                }
              />
            </StatRow>

            {/* GOAL */}
            <SectionLabel>GOAL</SectionLabel>
            <p className="font-body-md text-body-md text-secondary mb-6">
              What are you training for?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {GOALS.map((g) => {
                const active = goal === g.id
                return (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`text-left p-6 border-2 transition-colors ${
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

            {/* UNITS */}
            <SectionLabel>UNITS</SectionLabel>
            <div className="flex items-center justify-between py-5 border-b border-outline-variant/20 mb-12">
              <span className="font-body-md text-body-md text-secondary">
                MEASUREMENT SYSTEM
              </span>
              <div className="flex">
                <button
                  onClick={() => setUnits('imperial')}
                  className={`font-label-caps text-label-caps px-5 py-2 border ${
                    units === 'imperial'
                      ? 'bg-primary-fixed text-on-primary-fixed border-primary-fixed'
                      : 'text-secondary border-outline-variant/40'
                  }`}
                >
                  IMPERIAL
                </button>
                <button
                  onClick={() => setUnits('metric')}
                  className={`font-label-caps text-label-caps px-5 py-2 border ${
                    units === 'metric'
                      ? 'bg-primary-fixed text-on-primary-fixed border-primary-fixed'
                      : 'text-secondary border-outline-variant/40'
                  }`}
                >
                  METRIC
                </button>
              </div>
            </div>

            {/* ACCOUNT */}
            <SectionLabel muted>ACCOUNT</SectionLabel>
            <div className="flex flex-col">
              <button className="flex items-center justify-between py-5 border-b border-outline-variant/20 group">
                <span className="font-headline-md text-headline-md text-signal group-hover:text-white transition-colors">
                  SIGN OUT
                </span>
                <span className="font-headline-md text-headline-md text-signal group-hover:text-white transition-colors">
                  →
                </span>
              </button>
              <button className="flex items-center justify-between py-5 group">
                <span className="font-label-caps text-label-caps text-on-surface-variant group-hover:text-signal transition-colors">
                  DELETE ACCOUNT
                </span>
                <span className="font-label-caps text-label-caps text-on-surface-variant group-hover:text-signal transition-colors">
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

function SectionLabel({
  children,
  muted,
}: {
  children: React.ReactNode
  muted?: boolean
}) {
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
  unitToggle,
}: {
  value: number
  onChange: (v: number) => void
  unitToggle: React.ReactNode
}) {
  return (
    <div className="flex items-baseline gap-4">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 md:w-28 bg-transparent border-b border-transparent focus:border-primary-fixed text-right font-display-xl text-[32px] md:text-[48px] leading-none text-primary outline-none"
      />
      {unitToggle}
    </div>
  )
}

function UnitToggle({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex font-label-caps text-label-caps">
      {options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2 py-1 ${
            value === opt ? 'text-primary-fixed' : 'text-on-surface-variant'
          }`}
        >
          {opt.toUpperCase()}
          {i < options.length - 1 && <span className="ml-2 text-outline-variant">|</span>}
        </button>
      ))}
    </div>
  )
}
