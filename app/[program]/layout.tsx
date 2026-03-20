import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getProgramBundle,
  isProgramSlug,
  type ProgramId,
} from '@/lib/registry'
import { ProgramLayoutClient } from '@/components/ProgramLayoutClient'

type Props = {
  children: React.ReactNode
  params: { program: string }
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isProgramSlug(params.program)) return {}
  const b = getProgramBundle(params.program)
  return {
    title: `${b.athleteName} — ${b.distanceLabel} · Trail Plan`,
    description: `Suivi d’entraînement — ${b.athleteName}`,
  }
}

export default function ProgramLayout({ children, params }: Props) {
  if (!isProgramSlug(params.program)) notFound()
  const programId = params.program as ProgramId
  return <ProgramLayoutClient programId={programId}>{children}</ProgramLayoutClient>
}
