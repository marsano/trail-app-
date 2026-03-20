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
import type { Session, SessionType, SessionWorkoutBlock } from '@/lib/plan-types'
import { usePlanStore } from '@/lib/store'
import { useProgramId } from '@/components/ProgramContext'
import { getDisplayBlocks, formatBlocksPlain, BLOCK_UI_LABEL } from '@/lib/workout-blocks'
import {
  estimateSessionDurationMinutes,
  formatDurationLabel,
} from '@/lib/session-duration'

const SESSION_TYPES: SessionType[] = [
  'EF',
  'VMA',
  'TEMPO',
  'RENFO',
  'TRAIL',
  'RANDO',
  'WC',
  'RACE',
  'REPOS',
]

export function SessionEditDialog({
  session,
  open,
  onOpenChange,
}: {
  session: Session
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const programId = useProgramId()
  const setSessionEdit = usePlanStore((s) => s.setSessionEdit)
  const clearSessionEdit = usePlanStore((s) => s.clearSessionEdit)

  const [blocks, setBlocks] = useState<SessionWorkoutBlock[]>(() =>
    getDisplayBlocks(session)
  )
  const [note, setNote] = useState(session.note)
  const [day, setDay] = useState(session.day)
  const [type, setType] = useState<SessionType>(session.type)
  const [kmStr, setKmStr] = useState(
    session.km != null ? String(session.km) : ''
  )
  const [dpStr, setDpStr] = useState(
    session.dp != null ? String(session.dp) : ''
  )

  const previewDuration = useMemo(() => {
    const kmParsed =
      kmStr.trim() === ''
        ? null
        : Number.parseFloat(kmStr.replace(',', '.'))
    const km =
      kmParsed != null && Number.isFinite(kmParsed) ? kmParsed : null
    return estimateSessionDurationMinutes({
      ...session,
      km,
      note,
      blocks,
    })
  }, [session, kmStr, note, blocks])

  useEffect(() => {
    if (open) {
      setBlocks(getDisplayBlocks(session))
      setNote(session.note)
      setDay(session.day)
      setType(session.type)
      setKmStr(session.km != null ? String(session.km) : '')
      setDpStr(session.dp != null ? String(session.dp) : '')
    }
  }, [open, session])

  function patchBlock(
    index: number,
    patch: Partial<Pick<SessionWorkoutBlock, 'content' | 'paceTarget'>>
  ) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...patch } : b))
    )
  }

  function save() {
    const kmParsed =
      kmStr.trim() === ''
        ? null
        : Number.parseFloat(kmStr.replace(',', '.'))
    const dpParsed =
      dpStr.trim() === '' ? null : Number.parseInt(dpStr, 10)
    const plain = formatBlocksPlain(blocks)
    setSessionEdit(programId, session.id, {
      blocks,
      content: plain,
      note,
      day,
      type,
      km: kmParsed != null && Number.isFinite(kmParsed) ? kmParsed : null,
      dp: dpParsed != null && Number.isFinite(dpParsed) ? dpParsed : null,
    })
    onOpenChange(false)
  }

  function resetDefaults() {
    clearSessionEdit(programId, session.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[var(--border)] bg-[var(--surface)] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Modifier la séance</DialogTitle>
          <DialogDescription className="font-mono text-xs text-zinc-500">
            Structure en 3 blocs (échauffement, intervalles, récupération) avec
            allure cible pour chaque partie. Enregistré localement ; la
            description structurée est envoyée à Garmin Connect.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 font-mono text-sm">
          <div>
            <label className="mb-1 block text-xs text-zinc-500" htmlFor="se-type">
              Type
            </label>
            <select
              id="se-type"
              value={type}
              onChange={(e) => setType(e.target.value as SessionType)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
            >
              {SESSION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500" htmlFor="se-day">
              Jour (affichage)
            </label>
            <input
              id="se-day"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-500" htmlFor="se-km">
                km total (indicatif)
              </label>
              <input
                id="se-km"
                inputMode="decimal"
                value={kmStr}
                onChange={(e) => setKmStr(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500" htmlFor="se-dp">
                D+ m
              </label>
              <input
                id="se-dp"
                inputMode="numeric"
                value={dpStr}
                onChange={(e) => setDpStr(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
              />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500">
            Total indicatif :{' '}
            {(() => {
              const k =
                kmStr.trim() === ''
                  ? NaN
                  : Number.parseFloat(kmStr.replace(',', '.'))
              if (!Number.isFinite(k)) return null
              return `${k} km · `
            })()}
            ≈ {formatDurationLabel(previewDuration)}
          </p>

          <div className="space-y-4 border-t border-[var(--border)] pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Structure séance
            </p>
            {blocks.map((b, index) => (
              <div
                key={b.id}
                className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3"
              >
                <p className="mb-2 text-xs font-semibold text-[var(--green)]">
                  {BLOCK_UI_LABEL[b.type]}
                </p>
                <label className="mb-1 block text-[10px] text-zinc-500">
                  Allure cible (@allure)
                </label>
                <input
                  type="text"
                  value={b.paceTarget ?? ''}
                  onChange={(e) =>
                    patchBlock(index, {
                      paceTarget: e.target.value.trim() || null,
                    })
                  }
                  placeholder="ex. 5:00/km, allure 10 km, Z3…"
                  className="mb-2 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs"
                />
                <label className="mb-1 block text-[10px] text-zinc-500">
                  Détail
                </label>
                <textarea
                  rows={b.type === 'intervals' ? 5 : 3}
                  value={b.content}
                  onChange={(e) =>
                    patchBlock(index, { content: e.target.value })
                  }
                  placeholder={
                    b.type === 'intervals'
                      ? 'ex. 3×3 km @allure + 2 min 30 récup'
                      : '…'
                  }
                  className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500" htmlFor="se-note">
              Note plan (rappels coach)
            </label>
            <textarea
              id="se-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="primary" onClick={save}>
              Enregistrer
            </Button>
            <Button type="button" variant="default" onClick={resetDefaults}>
              Réinitialiser (plan d’origine)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
