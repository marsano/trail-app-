'use client'

import { useCallback, useState } from 'react'
import { useProgramId } from '@/components/ProgramContext'
import { usePlanStore } from '@/lib/store'
import {
  buildGarminSyncBody,
  postGarminConnect,
  type GarminConnectResponse,
} from '@/lib/garmin-sync-client'

export function useGarminQuickSync() {
  const programId = useProgramId()
  const garminTokens = usePlanStore(
    (s) => s.programs[programId]?.garminTokens ?? null
  )
  const garminAccountEmail = usePlanStore(
    (s) => s.programs[programId]?.garminAccountEmail ?? ''
  )
  const sessionEdits = usePlanStore(
    (s) => s.programs[programId]?.sessionEdits ?? {}
  )
  const dateOverrides = usePlanStore(
    (s) => s.programs[programId]?.dateOverrides ?? {}
  )
  const markGarminSynced = usePlanStore((s) => s.markGarminSynced)
  const setGarminSession = usePlanStore((s) => s.setGarminSession)

  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isGarminReady = Boolean(garminTokens && garminAccountEmail.trim())

  const syncSessionIds = useCallback(
    async (sessionIds: string[]): Promise<GarminConnectResponse | null> => {
      const email = garminAccountEmail.trim()
      if (!email || !garminTokens) {
        setError('Connecte-toi à Garmin via Sync Garmin en bas à droite.')
        return null
      }
      if (sessionIds.length === 0) return null
      setError(null)
      setSyncing(true)
      try {
        const body = buildGarminSyncBody({
          email,
          garminTokens,
          programId,
          sessionIds,
          dateOverrides,
          sessionEdits,
        })
        const { ok, data } = await postGarminConnect(body)
        if (!ok) {
          setError(data.error ?? 'Synchronisation impossible')
          return data
        }
        const synced = Array.isArray(data.synced) ? data.synced : []
        markGarminSynced(programId, synced)
        if (data.tokens) {
          setGarminSession(programId, { email, tokens: data.tokens })
        }
        return data
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erreur')
        return null
      } finally {
        setSyncing(false)
      }
    },
    [
      garminAccountEmail,
      garminTokens,
      programId,
      dateOverrides,
      sessionEdits,
      markGarminSynced,
      setGarminSession,
    ]
  )

  return {
    syncSessionIds,
    syncing,
    error,
    setError,
    isGarminReady,
  }
}
