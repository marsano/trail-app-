import type { SessionType } from '@/lib/plan-types'
import { cn } from '@/lib/utils'

const STYLES: Record<SessionType, string> = {
  EF: 'border-emerald-500/40 bg-emerald-500/15 text-[#6fcf74]',
  VMA: 'border-red-500/50 bg-red-500/15 text-[#e8604a]',
  TEMPO: 'border-amber-500/50 bg-amber-500/15 text-[#e8a84a]',
  RENFO: 'border-violet-500/50 bg-violet-500/15 text-[#b48fe8]',
  TRAIL: 'border-teal-500/50 bg-teal-500/15 text-[#4ecdc4]',
  RANDO: 'border-sky-500/50 bg-sky-500/15 text-[#5ab4d4]',
  WC: 'border-sky-500/50 bg-sky-500/15 text-[#5ab4d4]',
  RACE: 'border-red-600/60 bg-red-600/25 text-[#ff6b5a]',
  REPOS: 'border-zinc-600/50 bg-zinc-700/30 text-zinc-400',
}

export function TypeBadge({
  type,
  className,
}: {
  type: SessionType
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide sm:text-xs',
        STYLES[type],
        className
      )}
    >
      {type}
    </span>
  )
}
