'use client'

import { useEffect } from 'react'
import type { ProgramId } from '@/lib/registry'
import { useEffectivePlan } from '@/hooks/useEffectivePlan'
import { usePlanStore, getSessionState } from '@/lib/store'
import { resolveSessionDate, todayISO, tomorrowISO } from '@/lib/plan-helpers'
import { shouldSkipGarminSync } from '@/lib/garmin'

const STORAGE_PREFIX = 'trail-reminder-sent:'

function storageKey(
  programId: ProgramId,
  sessionId: string,
  effectiveDate: string,
  kind: 'today' | 'tomorrow'
): string {
  return `${STORAGE_PREFIX}${programId}:${sessionId}:${effectiveDate}:${kind}`
}

function alreadySent(key: string): boolean {
  if (typeof sessionStorage === 'undefined') return true
  return sessionStorage.getItem(key) === '1'
}

function markSent(key: string) {
  try {
    sessionStorage.setItem(key, '1')
  } catch {
    /* quota */
  }
}

/**
 * Rappels navigateur (pas de push serveur) : une fois par séance / jour pour
 * « demain » et « aujourd’hui ». Fiable surtout quand l’app est ouverte.
 */
export function SessionReminderRunner({ programId }: { programId: ProgramId }) {
  const plan = useEffectivePlan(programId)
  const dateOverrides = usePlanStore(
    (s) => s.programs[programId]?.dateOverrides ?? {}
  )
  const sessionStates = usePlanStore(
    (s) => s.programs[programId]?.sessionStates ?? {}
  )
  const enabled = usePlanStore(
    (s) => s.programs[programId]?.reminderBrowserEnabled ?? false
  )

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    function run() {
      const today = todayISO()
      const tomorrow = tomorrowISO()

      for (const s of plan) {
        if (shouldSkipGarminSync(s)) continue
        const st = getSessionState(sessionStates, s.id)
        if (st.done) continue

        const eff = resolveSessionDate(s, dateOverrides)

        if (eff === tomorrow) {
          const k = storageKey(programId, s.id, eff, 'tomorrow')
          if (alreadySent(k)) continue
          markSent(k)
          new Notification('Séance demain', {
            body: `${s.type} · ${eff} — ${(s.content || '').slice(0, 120) || 'Voir le plan'}`,
            tag: k,
          })
        }

        if (eff === today) {
          const k = storageKey(programId, s.id, eff, 'today')
          if (alreadySent(k)) continue
          markSent(k)
          new Notification('Séance aujourd’hui', {
            body: `${s.type} — ${(s.content || '').slice(0, 120) || 'Voir le plan'}`,
            tag: k,
          })
        }
      }
    }

    run()
    const id = window.setInterval(run, 5 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [enabled, plan, dateOverrides, sessionStates, programId])

  return null
}
