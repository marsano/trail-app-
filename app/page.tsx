import { groupPlanByPhaseWeek } from '@/lib/plan-helpers'
import { ClientOnly } from '@/components/ClientOnly'
import { PlanPageClient } from '@/components/PlanPageClient'

export default function PlanPage() {
  const grouped = groupPlanByPhaseWeek()

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
          Plan d’entraînement
        </h1>
        <p className="mt-2 max-w-2xl font-mono text-sm text-zinc-500">
          Trail Alpes — 76 km / 5000D+ · coche les séances, note tes sensations,
          synchronise avec Garmin.
        </p>
      </header>

      <ClientOnly>
        <PlanPageClient grouped={grouped} />
      </ClientOnly>
    </div>
  )
}
