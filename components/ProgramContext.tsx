'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { ProgramId } from '@/lib/registry'

const ProgramContext = createContext<ProgramId | null>(null)

export function ProgramProvider({
  programId,
  children,
}: {
  programId: ProgramId
  children: ReactNode
}) {
  return (
    <ProgramContext.Provider value={programId}>
      {children}
    </ProgramContext.Provider>
  )
}

export function useProgramId(): ProgramId {
  const v = useContext(ProgramContext)
  if (v == null) {
    throw new Error('useProgramId doit être utilisé dans un Programme (layout /[program]).')
  }
  return v
}
