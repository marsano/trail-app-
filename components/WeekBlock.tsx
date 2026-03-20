'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SessionCard } from '@/components/SessionCard'
import type { Session } from '@/lib/plan'
import { resolveSessionDate } from '@/lib/plan-helpers'
import { cn } from '@/lib/utils'

function weekHasTodayOrFuture(
  sessions: Session[],
  overrides: Record<string, string>
): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return sessions.some((s) => {
    const d = resolveSessionDate(s, overrides)
    const dt = new Date(d + 'T12:00:00')
    return dt >= today
  })
}

export function WeekBlock({
  weekLabel,
  weekNum,
  sessions,
  dateOverrides,
}: {
  weekLabel?: string
  weekNum: number
  sessions: Session[]
  dateOverrides: Record<string, string>
}) {
  const defaultOpen = useMemo(
    () => weekHasTodayOrFuture(sessions, dateOverrides),
    [sessions, dateOverrides]
  )
  const [open, setOpen] = useState(defaultOpen)

  const title = weekLabel ?? `Semaine ${weekNum}`

  return (
    <section className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-3 flex w-full items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-left font-mono text-sm text-[var(--text)] hover:bg-[var(--surface)]"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 transition-transform',
            open ? 'rotate-180' : ''
          )}
        />
      </button>
      {open ? (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              dateOverrides={dateOverrides}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
