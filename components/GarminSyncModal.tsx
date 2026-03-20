'use client'

import { useMemo, useState } from 'react'
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
import { PLAN } from '@/lib/plan'
import { resolveSessionDate } from '@/lib/plan-helpers'
import { shouldSkipGarminSync } from '@/lib/garmin'
import { Watch } from 'lucide-react'
import { TypeBadge } from '@/components/TypeBadge'

type Step = 1 | 2 | 3

export function GarminSyncModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [syncedCount, setSyncedCount] = useState(0)

  const dateOverrides = usePlanStore((s) => s.dateOverrides)
  const sessionStates = usePlanStore((s) => s.sessionStates)
  const markGarminSynced = usePlanStore((s) => s.markGarminSynced)
  const setGarminConnected = usePlanStore((s) => s.setGarminConnected)

  const unsynced = useMemo(() => {
    return PLAN.filter((s) => {
      if (shouldSkipGarminSync(s)) return false
      return !sessionStates[s.id]?.garminSynced
    })
  }, [sessionStates])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function resetModal() {
    setStep(1)
    setEmail('')
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

  async function connectOnly() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/garmin/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          dryRun: true,
        }),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const err =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Connexion impossible'
        throw new Error(err)
      }
      setGarminConnected(true)
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
      const res = await fetch('/api/garmin/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          sessionIds: ids,
          dateOverrides,
        }),
      })
      const data: unknown = await res.json()
      setProgress(95)
      if (!res.ok) {
        const err =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Synchronisation impossible'
        throw new Error(err)
      }
      const synced =
        typeof data === 'object' &&
        data !== null &&
        'synced' in data &&
        Array.isArray((data as { synced: unknown }).synced)
          ? ((data as { synced: string[] }).synced)
          : []
      markGarminSynced(synced)
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
            <DialogDescription className="font-mono text-xs">
              {step === 1
                ? 'Tes identifiants ne sont jamais stockés. Ils sont envoyés une seule fois à l’API pour générer les workouts.'
                : null}
            </DialogDescription>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-4">
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
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm"
                />
              </div>
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
              {error ? (
                <p className="font-mono text-sm text-[var(--red)]">{error}</p>
              ) : null}
              <Button
                type="button"
                variant="primary"
                className="w-full"
                disabled={loading}
                onClick={() => void connectOnly()}
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </Button>
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
