'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { ProgramId } from '@/lib/registry'
import { ProgramProvider } from '@/components/ProgramContext'
import { AppNav } from '@/components/AppNav'
import { GarminSyncModal } from '@/components/GarminSyncModal'
import { cn } from '@/lib/utils'

export function ProgramLayoutClient({
  programId,
  children,
}: {
  programId: ProgramId
  children: ReactNode
}) {
  const pathname = usePathname()
  const isPrint = pathname?.includes('/print') ?? false

  return (
    <ProgramProvider programId={programId}>
      {!isPrint ? <AppNav /> : null}
      <main
        className={cn(
          'mx-auto px-4',
          isPrint
            ? 'max-w-[210mm] py-4 print:py-0'
            : 'max-w-5xl py-6 sm:py-10'
        )}
      >
        {children}
      </main>
      {!isPrint ? <GarminSyncModal /> : null}
    </ProgramProvider>
  )
}
