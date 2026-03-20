import type { Metadata } from 'next'
import { Syne, DM_Mono } from 'next/font/google'
import './globals.css'
import { AppNav } from '@/components/AppNav'
import { GarminSyncModal } from '@/components/GarminSyncModal'

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Trail Plan — 76km / 5000D+',
  description: 'Suivi d’entraînement trail — plan, calendrier, Garmin',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body
        className={`${syne.variable} ${dmMono.variable} min-h-screen bg-[var(--bg)] font-sans antialiased`}
      >
        <AppNav />
        <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">{children}</main>
        <GarminSyncModal />
      </body>
    </html>
  )
}
