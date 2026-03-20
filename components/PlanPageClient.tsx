'use client'

import { useMemo } from 'react'
import { groupPlanByEffectiveWeeks } from '@/lib/plan-helpers'
import { PhaseHeader } from '@/components/PhaseHeader'
import { WeekBlock } from '@/components/WeekBlock'
import { useProgramId } from '@/components/ProgramContext'
import { usePlanStore } from '@/lib/store'
import { useEffectivePlan } from '@/hooks/useEffectivePlan'

export function PlanPageClient() {
  const programId = useProgramId()
  const dateOverrides = usePlanStore(
    (s) => s.programs[programId]?.dateOverrides ?? {}
  )
  const plan = useEffectivePlan(programId)

  const grouped = useMemo(
    () => groupPlanByEffectiveWeeks(plan, dateOverrides),
    [plan, dateOverrides]
  )

  return (
    <div className="space-y-12">
      {grouped.map((phase) => (
        <section key={phase.phase}>
          <PhaseHeader phase={phase.phase} label={phase.phaseLabel} />
          <div className="mt-6 space-y-8">
            {phase.weeks.map((w) => (
              <WeekBlock
                key={`${phase.phase}-${w.week}-${w.weekLabel ?? ''}`}
                weekNum={w.week}
                weekLabel={w.weekLabel}
                sessions={w.sessions}
                dateOverrides={dateOverrides}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
