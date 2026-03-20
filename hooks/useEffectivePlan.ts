'use client'

import { useMemo } from 'react'
import { getProgramBundle } from '@/lib/registry'
import type { ProgramId } from '@/lib/registry'
import { usePlanStore } from '@/lib/store'
import { applySessionCustomizations } from '@/lib/session-customization'
import type { Session } from '@/lib/plan-types'

export function useEffectivePlan(programId: ProgramId): Session[] {
  const sessionEdits = usePlanStore(
    (s) => s.programs[programId]?.sessionEdits ?? {}
  )
  const deletedSessionIds = usePlanStore(
    (s) => s.programs[programId]?.deletedSessionIds ?? []
  )

  return useMemo(() => {
    const plan = getProgramBundle(programId).plan
    return applySessionCustomizations(plan, sessionEdits, deletedSessionIds)
  }, [programId, sessionEdits, deletedSessionIds])
}
