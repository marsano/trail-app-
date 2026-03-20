'use client'

import { useCallback, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { ProgramId } from '@/lib/registry'
import { ProgramProvider } from '@/components/ProgramContext'
import { AppNav } from '@/components/AppNav'
import { GarminSyncModal } from '@/components/GarminSyncModal'
import { GarminSyncOpenProvider } from '@/components/GarminSyncOpenContext'
import { SessionReminderRunner } from '@/components/SessionReminderRunner'
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

  const [garminOpen, setGarminOpen] = useState(false)
  const [focusSessionId, setFocusSessionId] = useState<string | null>(null)

  const openGarminModal = useCallback(
    (opts?: { focusSessionId?: string }) => {
      setFocusSessionId(opts?.focusSessionId ?? null)
      setGarminOpen(true)
    },
    []
  )

  const handleGarminOpenChange = useCallback((v: boolean) => {
    if (!v) setFocusSessionId(null)
    setGarminOpen(v)
  }, [])

  return (
    <ProgramProvider programId={programId}>
      <GarminSyncOpenProvider openModal={openGarminModal}>
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
        {!isPrint ? (
          <>
            <SessionReminderRunner programId={programId} />
            <GarminSyncModal
              open={garminOpen}
              onOpenChange={handleGarminOpenChange}
              focusSessionId={focusSessionId}
              onFocusConsumed={() => setFocusSessionId(null)}
            />
          </>
        ) : null}
      </GarminSyncOpenProvider>
    </ProgramProvider>
  )
}
