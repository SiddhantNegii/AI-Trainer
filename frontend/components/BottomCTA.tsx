import Link from 'next/link'

interface BottomCTAProps {
  headline: string
  buttonLabel: string
  href: string
}

export default function BottomCTA({ headline, buttonLabel, href }: BottomCTAProps) {
  return (
    <section className="bg-primary-fixed py-24 flex flex-col items-center justify-center text-center px-margin-mobile lg:px-margin-desktop">
      <h2 className="font-display-xl text-[64px] md:text-[120px] leading-[0.95] text-on-primary-fixed mb-12">
        {headline}
      </h2>
      <Link
        href={href}
        className="bg-black text-white px-12 md:px-16 py-6 md:py-8 font-headline-md text-headline-md tracking-widest hover:scale-105 transition-transform"
      >
        {buttonLabel}
      </Link>
    </section>
  )
}
