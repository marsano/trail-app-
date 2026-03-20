'use client'

import { useRef, useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { TypeBadge } from '@/components/TypeBadge'
import { FeedbackPanel } from '@/components/FeedbackPanel'
import { SessionEditDialog } from '@/components/SessionEditDialog'
import { usePlanStore, getSessionState } from '@/lib/store'
import type { Session } from '@/lib/plan-types'
import { resolveSessionDate, todayISO } from '@/lib/plan-helpers'
import { useProgramId } from '@/components/ProgramContext'
import { MessageSquare, Watch, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SessionCard({
  session,
  dateOverrides,
}: {
  session: Session
  dateOverrides: Record<string, string>
}) {
  const programId = useProgramId()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const sessionStates = usePlanStore(
    (s) => s.programs[programId]?.sessionStates ?? {}
  )
  const deleteSession = usePlanStore((s) => s.deleteSession)
  const toggleDone = usePlanStore((s) => s.toggleDone)
  const st = getSessionState(sessionStates, session.id)
  const effectiveDate = resolveSessionDate(session, dateOverrides)
  const today = todayISO()
  const isToday = effectiveDate === today
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isToday && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isToday])

  function handleDelete() {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        'Retirer cette séance du plan sur cet appareil ? (Tu peux réimporter le plan en vidant les données du site si besoin.)'
      )
    ) {
      return
    }
    deleteSession(programId, session.id)
  }

  return (
    <>
      <div
        ref={rowRef}
        id={`session-${session.id}`}
        className={cn(
          'rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4',
          isToday && 'ring-1 ring-[var(--green)]/50'
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 gap-3">
            <div className="flex shrink-0 items-start pt-0.5">
              <Checkbox
                checked={st.done}
                onCheckedChange={() => toggleDone(programId, session.id)}
                aria-label="Séance réalisée"
                className="mt-0.5"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={session.type} />
                <span className="font-mono text-xs text-zinc-500">
                  {session.day} · {effectiveDate}
                </span>
              </div>
              {session.content ? (
                <p className="font-mono text-sm leading-relaxed text-[var(--text)] whitespace-pre-wrap">
                  {session.content}
                </p>
              ) : null}
              {session.note ? (
                <p className="font-mono text-xs text-zinc-500 whitespace-pre-wrap">
                  {session.note}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
            <div className="hidden text-right font-mono text-sm text-zinc-400 sm:block">
              {session.km != null ? <span>{session.km} km</span> : null}
              {session.km != null && session.dp != null ? (
                <span className="text-zinc-600"> · </span>
              ) : null}
              {session.dp != null ? <span>{session.dp} D+</span> : null}
              {session.km == null && session.dp == null ? (
                <span className="text-zinc-600">—</span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="font-mono"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="mr-1 h-4 w-4" />
                Modifier
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="font-mono text-[var(--red)] hover:text-[var(--red)]"
                onClick={handleDelete}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Supprimer
              </Button>
              {st.garminSynced ? (
                <CheckCircle2
                  className="h-5 w-5 text-[var(--green)]"
                  aria-label="Synchronisé Garmin"
                />
              ) : (
                <Watch
                  className="h-5 w-5 text-zinc-600"
                  aria-label="Pas encore sur Garmin"
                />
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="font-mono"
                onClick={() => setFeedbackOpen((o) => !o)}
              >
                <MessageSquare className="mr-1 h-4 w-4" />
                Avis
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex font-mono text-xs text-zinc-500 sm:hidden">
          {session.km != null ? <span>{session.km} km</span> : null}
          {session.km != null && session.dp != null ? <span> · </span> : null}
          {session.dp != null ? <span>{session.dp} D+</span> : null}
        </div>

        {feedbackOpen ? <FeedbackPanel sessionId={session.id} /> : null}
      </div>

      <SessionEditDialog
        session={session}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
