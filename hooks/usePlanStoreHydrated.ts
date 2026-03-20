'use client'

import { useLayoutEffect, useState } from 'react'
import { usePlanStore } from '@/lib/store'

/**
 * true une fois le store persisté rechargé depuis localStorage.
 * Évite d’afficher le plan « brut » avant les éditions / déplacements calendrier.
 */
export function usePlanStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => {
    if (typeof window === 'undefined') return false
    return usePlanStore.persist.hasHydrated()
  })

  useLayoutEffect(() => {
    if (usePlanStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    const unsub = usePlanStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
    return unsub
  }, [])

  return hydrated
}
