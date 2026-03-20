'use client'

import type { ReactNode } from 'react'
import type { ProgramId } from '@/lib/registry'
import { ProgramProvider } from '@/components/ProgramContext'
import { AppNav } from '@/components/AppNav'
import { GarminSyncModal } from '@/components/GarminSyncModal'

export function ProgramLayoutClient({
  programId,
  children,
}: {
  programId: ProgramId
  children: ReactNode
}) {
  return (
    <ProgramProvider programId={programId}>
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">{children}</main>
      <GarminSyncModal />
    </ProgramProvider>
  )
}
