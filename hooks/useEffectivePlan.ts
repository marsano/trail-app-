'use client'

import { useMemo } from 'react'
import { getProgramBundle } from '@/lib/registry'
import type { ProgramId } from '@/lib/registry'
import { usePlanStore } from '@/lib/store'
import { applySessionCustomizations } from '@/lib/session-customization'
import type { Session } from '@/lib/plan-types'

export function useEffectivePlan(programId: ProgramId): Session[] {
  const slice = usePlanStore((s) => s.programs[programId])

  return useMemo(() => {
    const plan = getProgramBundle(programId).plan
    return applySessionCustomizations(
      plan,
      slice?.sessionEdits ?? {},
      slice?.deletedSessionIds ?? []
    )
  }, [programId, slice])
}
