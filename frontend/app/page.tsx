import Link from 'next/link'
import TopNav from '../components/TopNav'
import Footer from '../components/Footer'

const HERO_IMG =
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=80'
const POSE_IMG =
  'https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?auto=format&fit=crop&w=1600&q=80'
const MEAL_IMG =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80'
const LIBRARY_IMG =
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1600&q=80'

export default function LandingPage() {
  return (
    <div className="bg-background text-on-background overflow-x-hidden">
      <TopNav />

      {/* HERO */}
      <main className="relative min-h-screen w-full flex flex-col justify-center pt-16 overflow-hidden">
        <div className="absolute right-0 top-0 w-full md:w-3/4 h-full z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMG}
            alt="Athlete mid-squat with AI pose detection overlay"
            className="w-full h-full object-cover grayscale brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </div>

        <div className="relative z-10 px-margin-mobile lg:px-margin-desktop flex flex-col items-start">
          <h1 className="font-display-xl text-[72px] sm:text-[120px] md:text-[200px] leading-[0.85] text-primary select-none flex flex-col">
            <span>TRAIN.</span>
            <span className="text-primary-fixed">TRACK.</span>
            <span>PROGRESS.</span>
          </h1>

          <div className="mt-12 flex flex-col gap-8 items-start">
            <p className="font-body-lg text-body-lg text-secondary max-w-md border-l-4 border-primary-fixed pl-6">
              REAL-TIME POSE DETECTION. PERSONALIZED MEAL PLANS. 250+ EXERCISES.
              NO GUESSWORK — JUST DATA.
            </p>
            <Link
              href="/dashboard"
              className="bg-primary-fixed text-on-primary-fixed px-8 sm:px-12 py-5 sm:py-6 font-headline-md text-headline-md tracking-widest hover:bg-white hover:text-black transition-all active:scale-95"
            >
              GET STARTED FREE
            </Link>
          </div>
        </div>

        <div className="hidden md:flex absolute bottom-20 right-margin-desktop z-20 flex-col items-end text-right border-r-2 border-primary-fixed pr-4">
          <span className="font-label-caps text-label-caps text-primary-fixed">
            SYSTEM STATUS: ACTIVE
          </span>
          <span className="font-label-caps text-label-caps text-secondary">
            MEDIAPIPE V0.10
          </span>
          <span className="font-label-caps text-label-caps text-secondary">
            33 LANDMARKS
          </span>
        </div>
      </main>

      {/* STATS BAND */}
      <section className="bg-surface-container-highest py-8 px-margin-mobile lg:px-margin-desktop border-y border-outline-variant/30 overflow-hidden relative">
        <div className="flex justify-center items-center">
          <div className="font-headline-md text-headline-md text-primary-fixed flex flex-wrap justify-center gap-4 md:gap-12">
            <span>250+ EXERCISES</span>
            <span className="text-outline-variant">|</span>
            <span>33 BODY LANDMARKS</span>
            <span className="text-outline-variant">|</span>
            <span>7 DIET TYPES</span>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section className="bg-surface py-section-gap">
        <div className="px-margin-mobile lg:px-margin-desktop mb-16 md:mb-24">
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
            CORE CAPABILITIES
          </h2>
        </div>

        <div className="flex flex-col gap-0">
          <CapabilityRow
            title="REAL-TIME POSE DETECTION"
            body="MediaPipe-powered form scoring. 33 body landmarks tracked frame-by-frame. Live rep counting and corrective feedback as you move."
            href="/pose-detection"
            cta="OPEN POSE SESSION"
            image={POSE_IMG}
            imageOnRight
            surface="bg-surface"
          />
          <CapabilityRow
            title="SMART MEAL PLANNING"
            body="Daily and weekly meal plans tailored to your calorie target and dietary style. Powered by Spoonacular."
            href="/diet"
            cta="GENERATE A PLAN"
            image={MEAL_IMG}
            surface="bg-surface-container-low"
          />
          <CapabilityRow
            title="250+ EXERCISE LIBRARY"
            body="Searchable database with target muscles, equipment, and step-by-step instructions. Filter by body part or equipment."
            href="/workout"
            cta="EXPLORE LIBRARY"
            image={LIBRARY_IMG}
            imageOnRight
            surface="bg-surface"
            noBorder
          />
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="bg-primary-fixed py-24 flex flex-col items-center justify-center text-center px-margin-mobile lg:px-margin-desktop">
        <h2 className="font-display-xl text-[64px] md:text-[120px] leading-[0.95] text-on-primary-fixed mb-12">
          READY TO TRAIN?
        </h2>
        <Link
          href="/dashboard"
          className="bg-black text-white px-12 md:px-16 py-6 md:py-8 font-headline-md text-headline-md tracking-widest hover:scale-105 transition-transform"
        >
          START TRAINING
        </Link>
      </section>

      <Footer />
    </div>
  )
}

function CapabilityRow({
  title,
  body,
  href,
  cta,
  image,
  imageOnRight = false,
  surface = 'bg-surface',
  noBorder = false,
}: {
  title: string
  body: string
  href: string
  cta: string
  image: string
  imageOnRight?: boolean
  surface?: string
  noBorder?: boolean
}) {
  const textOrder = imageOnRight ? 'md:order-1' : 'md:order-2'
  const imgOrder = imageOnRight ? 'md:order-2' : 'md:order-1'
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 min-h-[420px] md:min-h-[600px] ${
        noBorder ? '' : 'border-b border-outline-variant/20'
      }`}
    >
      <div
        className={`flex flex-col justify-center p-margin-mobile lg:p-margin-desktop ${surface} ${textOrder} order-2`}
      >
        <h3 className="font-display-xl text-[40px] md:text-[64px] leading-tight text-primary-fixed mb-6 uppercase">
          {title}
        </h3>
        <p className="font-body-lg text-body-lg text-secondary max-w-lg mb-8">
          {body}
        </p>
        <Link
          href={href}
          className="font-label-caps text-label-caps text-primary-fixed flex items-center gap-2 w-fit border-b border-primary-fixed pb-1 hover:text-white hover:border-white transition-colors"
        >
          {cta}
          <span className="material-symbols-outlined text-base">trending_flat</span>
        </Link>
      </div>
      <div className={`h-64 md:h-auto relative overflow-hidden ${imgOrder} order-1`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
        />
      </div>
    </div>
  )
}
