'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePlanStoreHydrated } from '@/hooks/usePlanStoreHydrated'

export function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const hydrated = usePlanStoreHydrated()

  useEffect(() => setMounted(true), [])

  if (!mounted || !hydrated) {
    return (
      <p className="font-mono text-sm text-zinc-500">
        Chargement de tes données locales…
      </p>
    )
  }
  return <>{children}</>
}
