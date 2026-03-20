'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowLeft, FileDown, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProgramId } from '@/components/ProgramContext'
import { useEffectivePlan } from '@/hooks/useEffectivePlan'
import { getProgramBundle } from '@/lib/registry'
import { resolveSessionDate } from '@/lib/plan-helpers'
import { usePlanStore } from '@/lib/store'
import type { Session } from '@/lib/plan-types'
import { formatBlocksPlain, getDisplayBlocks } from '@/lib/workout-blocks'
import { cn } from '@/lib/utils'

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function sessionDetailText(session: Session): string {
  const plain = formatBlocksPlain(getDisplayBlocks(session)).trim()
  if (plain) return plain
  return session.content?.trim() ?? ''
}

export function PlanPrintView() {
  const programId = useProgramId()
  const dateOverrides = usePlanStore(
    (s) => s.programs[programId]?.dateOverrides ?? {}
  )
  const plan = useEffectivePlan(programId)
  const bundle = getProgramBundle(programId)

  const sorted = useMemo(() => {
    return [...plan].sort((a, b) => {
      const da = resolveSessionDate(a, dateOverrides)
      const db = resolveSessionDate(b, dateOverrides)
      return da.localeCompare(db)
    })
  }, [plan, dateOverrides])

  function handlePrint() {
    window.print()
  }

  function handleCsv() {
    const headers = [
      'Date',
      'Jour',
      'Type',
      'km',
      'D+',
      'Séance',
      'Note',
    ]
    const rows = sorted.map((s) => {
      const d = resolveSessionDate(s, dateOverrides)
      return [
        d,
        s.day,
        s.type,
        s.km != null ? String(s.km) : '',
        s.dp != null ? String(s.dp) : '',
        sessionDetailText(s),
        s.note ?? '',
      ]
    })
    const lines = [headers, ...rows].map((r) =>
      r.map((c) => escapeCsvCell(String(c))).join(';')
    )
    const csv = '\ufeff' + lines.join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plan-${programId}-${bundle.raceInfo.date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={cn(
        'print:bg-white print:text-black',
        'text-[var(--text)]'
      )}
    >
      <div className="no-print mb-8 flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href={`/${programId}`} className="font-mono">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Plan
          </Link>
        </Button>
        <Button
          type="button"
          variant="primary"
          className="font-mono"
          onClick={handlePrint}
        >
          <Printer className="mr-1 h-4 w-4" />
          Imprimer
        </Button>
        <Button
          type="button"
          variant="default"
          className="font-mono"
          onClick={handleCsv}
        >
          <FileDown className="mr-1 h-4 w-4" />
          Télécharger CSV
        </Button>
      </div>

      <header className="print:border-b print:border-zinc-300 print:pb-4">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight print:text-black sm:text-3xl">
          Plan — {bundle.athleteName}
        </h1>
        <p className="mt-2 font-mono text-sm text-zinc-500 print:text-zinc-700">
          {bundle.distanceLabel} · {bundle.raceInfo.name} (
          {bundle.raceInfo.date})
        </p>
        <p className="mt-1 font-mono text-xs text-zinc-600 print:text-zinc-600">
          Dates effectives (calendrier) · contenu = plan + tes modifications
          locales
        </p>
      </header>

      {sorted.length === 0 ? (
        <p className="mt-8 font-mono text-sm text-zinc-500">
          Aucune séance dans le plan pour l’instant.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto print:overflow-visible">
          <table className="w-full min-w-[720px] border-collapse border border-[var(--border)] text-left text-xs print:min-w-0 print:border-zinc-400 print:text-[10px]">
            <thead>
              <tr className="bg-[var(--surface)] print:bg-zinc-100">
                <th className="border border-[var(--border)] px-2 py-2 font-mono print:border-zinc-400">
                  Date
                </th>
                <th className="border border-[var(--border)] px-2 py-2 font-mono print:border-zinc-400">
                  Jour
                </th>
                <th className="border border-[var(--border)] px-2 py-2 font-mono print:border-zinc-400">
                  Type
                </th>
                <th className="border border-[var(--border)] px-2 py-2 font-mono print:border-zinc-400">
                  km
                </th>
                <th className="border border-[var(--border)] px-2 py-2 font-mono print:border-zinc-400">
                  D+
                </th>
                <th className="border border-[var(--border)] px-2 py-2 font-mono print:border-zinc-400">
                  Séance
                </th>
                <th className="border border-[var(--border)] px-2 py-2 font-mono print:border-zinc-400">
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const d = resolveSessionDate(s, dateOverrides)
                const moved = dateOverrides[s.id] != null
                return (
                  <tr key={s.id} className="align-top">
                    <td className="border border-[var(--border)] px-2 py-2 font-mono whitespace-nowrap print:border-zinc-400">
                      {d}
                      {moved ? (
                        <span className="block text-[10px] text-zinc-500 print:text-zinc-600">
                          (plan {s.date})
                        </span>
                      ) : null}
                    </td>
                    <td className="border border-[var(--border)] px-2 py-2 font-mono print:border-zinc-400">
                      {s.day}
                    </td>
                    <td className="border border-[var(--border)] px-2 py-2 font-mono print:border-zinc-400">
                      {s.type}
                    </td>
                    <td className="border border-[var(--border)] px-2 py-2 font-mono print:border-zinc-400">
                      {s.km != null ? s.km : '—'}
                    </td>
                    <td className="border border-[var(--border)] px-2 py-2 font-mono print:border-zinc-400">
                      {s.dp != null ? s.dp : '—'}
                    </td>
                    <td className="border border-[var(--border)] px-2 py-2 font-mono text-[11px] leading-snug whitespace-pre-wrap print:border-zinc-400 print:text-[9px]">
                      {sessionDetailText(s) || '—'}
                    </td>
                    <td className="border border-[var(--border)] px-2 py-2 font-mono text-[11px] leading-snug whitespace-pre-wrap print:border-zinc-400 print:text-[9px]">
                      {s.note?.trim() || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
