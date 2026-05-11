'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'DASHBOARD', href: '/dashboard' },
  { label: 'POSE DETECTION', href: '/pose-detection' },
  { label: 'NUTRITION', href: '/diet' },
  { label: 'LIBRARY', href: '/workout' },
]

export default function TopNav() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-margin-mobile lg:px-margin-desktop bg-surface/90 backdrop-blur-md border-b border-outline-variant/20">
      <Link
        href="/"
        className="font-display-xl text-headline-md tracking-tighter text-primary-fixed"
      >
        AI FITNESS TRAINER
      </Link>

      <nav className="hidden lg:flex items-center gap-6">
        {NAV_LINKS.map((link, idx) => {
          const isActive =
            pathname === link.href ||
            (link.href !== '/' && pathname?.startsWith(link.href))
          return (
            <span key={link.href} className="flex items-center gap-6">
              <Link
                href={link.href}
                className={`font-label-caps text-label-caps uppercase transition-colors ${
                  isActive
                    ? 'text-primary-fixed'
                    : 'text-secondary hover:text-primary-fixed'
                }`}
              >
                {link.label}
              </Link>
              {idx < NAV_LINKS.length - 1 && (
                <span className="text-outline-variant">•</span>
              )}
            </span>
          )
        })}
      </nav>

      <div className="flex items-center gap-6">
        <Link
          href="/settings"
          className="font-label-caps text-label-caps uppercase text-secondary hover:text-primary-fixed transition-colors hidden sm:inline-block"
        >
          PROFILE
        </Link>
        <Link
          href="/dashboard"
          className="bg-primary-fixed text-on-primary-fixed px-4 sm:px-6 py-2 font-label-caps text-label-caps rounded-full active:scale-95 transition-transform"
        >
          GET STARTED
        </Link>
      </div>
    </header>
  )
}
