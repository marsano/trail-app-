import { notFound } from 'next/navigation'
import { getProgramBundle, isProgramSlug } from '@/lib/registry'
import { ClientOnly } from '@/components/ClientOnly'
import { PlanPageClient } from '@/components/PlanPageClient'

export default function PlanPage({
  params,
}: {
  params: { program: string }
}) {
  if (!isProgramSlug(params.program)) notFound()
  const bundle = getProgramBundle(params.program)

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
          Plan — {bundle.athleteName}
        </h1>
        <p className="mt-2 max-w-2xl font-mono text-sm text-zinc-500">
          {bundle.distanceLabel} · coche les séances, note tes sensations,
          synchronise avec Garmin. Déplacements calendrier et éditions sont
          enregistrés localement.
        </p>
      </header>

      <ClientOnly>
        <PlanPageClient />
      </ClientOnly>
    </div>
  )
}
