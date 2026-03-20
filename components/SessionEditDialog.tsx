'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Session, SessionType } from '@/lib/plan-types'
import { usePlanStore } from '@/lib/store'
import { useProgramId } from '@/components/ProgramContext'

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

  const [content, setContent] = useState(session.content)
  const [note, setNote] = useState(session.note)
  const [day, setDay] = useState(session.day)
  const [type, setType] = useState<SessionType>(session.type)
  const [kmStr, setKmStr] = useState(
    session.km != null ? String(session.km) : ''
  )
  const [dpStr, setDpStr] = useState(
    session.dp != null ? String(session.dp) : ''
  )

  useEffect(() => {
    if (open) {
      setContent(session.content)
      setNote(session.note)
      setDay(session.day)
      setType(session.type)
      setKmStr(session.km != null ? String(session.km) : '')
      setDpStr(session.dp != null ? String(session.dp) : '')
    }
  }, [open, session])

  function save() {
    const kmParsed =
      kmStr.trim() === ''
        ? null
        : Number.parseFloat(kmStr.replace(',', '.'))
    const dpParsed =
      dpStr.trim() === '' ? null : Number.parseInt(dpStr, 10)
    setSessionEdit(programId, session.id, {
      content,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[var(--border)] bg-[var(--surface)]">
        <DialogHeader>
          <DialogTitle>Modifier la séance</DialogTitle>
          <DialogDescription className="font-mono text-xs text-zinc-500">
            Les changements sont enregistrés localement sur cet appareil (pas dans
            le fichier source du plan).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 font-mono text-sm">
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
          <div>
            <label className="mb-1 block text-xs text-zinc-500" htmlFor="se-km">
              km (vide = aucun)
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
              D+ m (vide = aucun)
            </label>
            <input
              id="se-dp"
              inputMode="numeric"
              value={dpStr}
              onChange={(e) => setDpStr(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500" htmlFor="se-content">
              Contenu (séance, répétitions…)
            </label>
            <textarea
              id="se-content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
            />
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
