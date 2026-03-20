'use client'

import { createContext, useContext, type ReactNode } from 'react'

export type OpenGarminModalOptions = {
  /** Pré-sélectionner cette séance à l’étape « envoi » (après connexion). */
  focusSessionId?: string
}

const GarminSyncOpenContext = createContext<
  ((opts?: OpenGarminModalOptions) => void) | null
>(null)

export function GarminSyncOpenProvider({
  children,
  openModal,
}: {
  children: ReactNode
  openModal: (opts?: OpenGarminModalOptions) => void
}) {
  return (
    <GarminSyncOpenContext.Provider value={openModal}>
      {children}
    </GarminSyncOpenContext.Provider>
  )
}

export function useOpenGarminModal(): (opts?: OpenGarminModalOptions) => void {
  const fn = useContext(GarminSyncOpenContext)
  if (!fn) {
    return () => {
      /* hors layout programme */
    }
  }
  return fn
}
