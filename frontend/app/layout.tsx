import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import './globals.css'
import AIDoctorBot from '../components/AIDoctorBot'

export const metadata: Metadata = {
  title: 'AI Fitness Trainer — Train. Track. Progress.',
  description:
    'AI-powered fitness coach with real-time pose detection, personalized meal plans, and a 250+ exercise library.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#cbf22b',
          colorBackground: '#121409',
          colorInputBackground: '#0d0f05',
          colorInputText: '#e3e4d0',
          colorText: '#e3e4d0',
          colorTextSecondary: '#c9c6c0',
          borderRadius: '0',
          fontFamily: 'Geist, sans-serif',
        },
        elements: {
          formButtonPrimary:
            'bg-primary-fixed text-on-primary-fixed hover:bg-white hover:text-black rounded-none font-label-caps tracking-widest',
          card: 'bg-surface border border-outline-variant/30 rounded-none',
          headerTitle: 'font-display-xl uppercase',
        },
      }}
    >
      <html lang="en" className="dark scroll-smooth">
        <body className="bg-background text-on-background font-body-md min-h-screen antialiased">
          {children}
          <AIDoctorBot />
        </body>
      </html>
    </ClerkProvider>
  )
}
