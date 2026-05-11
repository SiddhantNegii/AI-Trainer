import type { Metadata } from 'next'
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
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-background text-on-background font-body-md min-h-screen antialiased">
        {children}
        <AIDoctorBot />
      </body>
    </html>
  )
}
