'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePlanStore } from '@/lib/store'
import { getProgramBundle } from '@/lib/registry'
import { resolveSessionDate } from '@/lib/plan-helpers'
import { useProgramId } from '@/components/ProgramContext'
import { shouldSkipGarminSync } from '@/lib/garmin'
import type { GarminTokensPayload } from '@/lib/garmin-types'
import { Watch } from 'lucide-react'
import { TypeBadge } from '@/components/TypeBadge'

type Step = 1 | 2 | 3

type ConnectResponse = {
  success?: boolean
  error?: string
  tokens?: GarminTokensPayload
  synced?: string[]
}

export function GarminSyncModal() {
  const programId = useProgramId()
  const plan = getProgramBundle(programId).plan
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [syncedCount, setSyncedCount] = useState(0)

  const garminTokens = usePlanStore(
    (s) => s.programs[programId]?.garminTokens ?? null
  )
  const garminAccountEmail = usePlanStore(
    (s) => s.programs[programId]?.garminAccountEmail ?? ''
  )
  const dateOverrides = usePlanStore(
    (s) => s.programs[programId]?.dateOverrides ?? {}
  )
  const sessionStates = usePlanStore(
    (s) => s.programs[programId]?.sessionStates ?? {}
  )
  const markGarminSynced = usePlanStore((s) => s.markGarminSynced)
  const setGarminSession = usePlanStore((s) => s.setGarminSession)

  const hasStoredSession = Boolean(garminTokens && garminAccountEmail)

  const unsynced = useMemo(() => {
    return plan.filter((s) => {
      if (shouldSkipGarminSync(s)) return false
      return !sessionStates[s.id]?.garminSynced
    })
  }, [plan, sessionStates])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  useEffect(() => {
    if (open && garminAccountEmail) {
      setEmail(garminAccountEmail)
    }
  }, [open, garminAccountEmail])

  function resetModal() {
    setStep(1)
    setPassword('')
    setSelected({})
    setLoading(false)
    setProgress(0)
    setError(null)
    setSyncedCount(0)
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) resetModal()
  }

  function persistSessionFromResponse(data: ConnectResponse, emailUsed: string) {
    if (data.tokens) {
      setGarminSession(programId, { email: emailUsed, tokens: data.tokens })
    }
  }

  async function connectOnly() {
    setError(null)
    setLoading(true)
    try {
      const emailUsed = (hasStoredSession ? garminAccountEmail : email).trim()
      if (!emailUsed) {
        throw new Error('Indique ton email Garmin.')
      }

      const body: Record<string, unknown> = {
        email: emailUsed,
        dryRun: true,
        programId,
      }
      if (hasStoredSession && garminTokens) {
        body.garminTokens = garminTokens
      } else {
        if (!password) throw new Error('Indique ton mot de passe Garmin.')
        body.password = password
      }

      const res = await fetch('/api/garmin/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as ConnectResponse
      if (!res.ok) {
        throw new Error(data.error ?? 'Connexion impossible')
      }
      persistSessionFromResponse(data, emailUsed)
      setStep(2)
      const init: Record<string, boolean> = {}
      for (const s of unsynced) init[s.id] = false
      setSelected(init)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  function continueWithStoredSession() {
    setError(null)
    void connectOnly()
  }

  function disconnectGarmin() {
    setGarminSession(programId, null)
    setPassword('')
    setError(null)
    setStep(1)
  }

  async function syncSelected() {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k)
    if (ids.length === 0) {
      setError('Sélectionne au moins une séance.')
      return
    }
    setError(null)
    setLoading(true)
    setStep(3)
    setProgress(5)

    try {
      const emailUsed = (hasStoredSession ? garminAccountEmail : email).trim()
      const body: Record<string, unknown> = {
        email: emailUsed,
        sessionIds: ids,
        dateOverrides,
        programId,
      }
      if (hasStoredSession && garminTokens) {
        body.garminTokens = garminTokens
      } else {
        body.password = password
      }

      const res = await fetch('/api/garmin/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as ConnectResponse
      setProgress(95)
      if (!res.ok) {
        throw new Error(data.error ?? 'Synchronisation impossible')
      }
      const synced =
        Array.isArray(data.synced) ? data.synced : []
      markGarminSynced(programId, synced)
      persistSessionFromResponse(data, emailUsed)
      setSyncedCount(synced.length)
      setProgress(100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  function selectAll() {
    const next: Record<string, boolean> = {}
    for (const s of unsynced) next[s.id] = true
    setSelected(next)
  }

  function selectUpcoming() {
    const next: Record<string, boolean> = {}
    for (const s of unsynced) {
      const d = new Date(resolveSessionDate(s, dateOverrides) + 'T12:00:00')
      next[s.id] = d >= today
    }
    setSelected(next)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--green)] px-5 py-3 font-mono text-sm font-semibold text-[#0a0c0b] shadow-lg transition hover:opacity-90"
      >
        <Watch className="h-5 w-5" />
        Sync Garmin
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-lg border-[var(--border)] bg-[var(--surface)]">
          <DialogHeader>
            <DialogTitle>Garmin Connect</DialogTitle>
            <DialogDescription className="font-mono text-xs leading-relaxed text-zinc-500">
              {step === 1 ? (
                <>
                  Connexion à ton compte Garmin Connect : la 1re fois, email + mot de
                  passe. Ensuite l’app enregistre une{' '}
                  <strong className="text-zinc-400">session sécurisée</strong> (jetons
                  OAuth) — plus besoin du mot de passe tant que la session est valide.
                  Pas de bouton « Se connecter avec Garmin » public : Garmin ne propose
                  pas ce flux pour les apps tierces.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-4">
              {hasStoredSession ? (
                <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 font-mono text-sm text-[var(--text)]">
                  <p className="mb-2 text-zinc-400">
                    Session Garmin enregistrée sur cet appareil pour ce programme :
                  </p>
                  <p className="text-[var(--green)]">{garminAccountEmail}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={loading}
                      onClick={() => void continueWithStoredSession()}
                    >
                      {loading ? 'Vérification…' : 'Continuer vers la sync'}
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={disconnectGarmin}
                    >
                      Se déconnecter
                    </Button>
                  </div>
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="gc-email"
                  className="mb-1 block font-mono text-xs text-zinc-500"
                >
                  Email Garmin
                </label>
                <input
                  id="gc-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={Boolean(hasStoredSession)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm disabled:opacity-60"
                />
              </div>
              {!hasStoredSession ? (
                <div>
                  <label
                    htmlFor="gc-pass"
                    className="mb-1 block font-mono text-xs text-zinc-500"
                  >
                    Mot de passe
                  </label>
                  <input
                    id="gc-pass"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm"
                  />
                </div>
              ) : null}
              {error ? (
                <p className="font-mono text-sm text-[var(--red)]">{error}</p>
              ) : null}
              {!hasStoredSession ? (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                  onClick={() => void connectOnly()}
                >
                  {loading ? 'Connexion…' : 'Se connecter'}
                </Button>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="default" onClick={selectAll}>
                  Tout sélectionner
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={selectUpcoming}
                >
                  Seulement à venir
                </Button>
              </div>
              <ScrollArea className="h-[280px] rounded-md border border-[var(--border)] p-2">
                {unsynced.length === 0 ? (
                  <p className="p-4 font-mono text-sm text-zinc-500">
                    Toutes les séances envoyables sont déjà synchronisées.
                  </p>
                ) : null}
                <ul className="space-y-2">
                  {unsynced.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-start gap-2 rounded border border-[var(--border)]/60 p-2"
                    >
                      <Checkbox
                        checked={selected[s.id] ?? false}
                        onCheckedChange={(c) =>
                          setSelected((prev) => ({
                            ...prev,
                            [s.id]: c === true,
                          }))
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <TypeBadge type={s.type} />
                          <span className="font-mono text-[10px] text-zinc-500">
                            {resolveSessionDate(s, dateOverrides)}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-[var(--text)] line-clamp-2">
                          {s.content || '—'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
              {error ? (
                <p className="font-mono text-sm text-[var(--red)]">{error}</p>
              ) : null}
              <Button
                type="button"
                variant="primary"
                className="w-full"
                disabled={loading}
                onClick={() => void syncSelected()}
              >
                {loading ? 'Envoi…' : 'Envoyer sur Garmin'}
              </Button>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <Progress value={progress} />
              {error ? (
                <p className="font-mono text-sm text-[var(--red)]">{error}</p>
              ) : (
                <p className="font-mono text-sm text-[var(--text)]">
                  {loading
                    ? 'Envoi en cours…'
                    : `${syncedCount} séance(s) envoyée(s) sur Garmin Connect ✅`}
                </p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
