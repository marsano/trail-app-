'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useProgramId } from '@/components/ProgramContext'
import { PROGRAM_LIST, getProgramBundle } from '@/lib/registry'
import type { ProgramId } from '@/lib/registry'

export function AppNav() {
  const pathname = usePathname()
  const programId = useProgramId()
  const base = `/${programId}`

  const routeSuffix =
    pathname.replace(/^\/(matthieu|loic)/, '') || ''

  const LINKS = [
    { href: base, label: 'Plan' },
    { href: `${base}/calendar`, label: 'Calendrier' },
    { href: `${base}/dashboard`, label: 'Dashboard' },
  ]

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3 sm:gap-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-[var(--text)]"
        >
          Trail Plan
        </Link>
        <div className="flex flex-wrap gap-1 rounded-md border border-[var(--border)]/80 bg-[var(--surface)]/50 p-0.5">
          {PROGRAM_LIST.map((id: ProgramId) => {
            const active = id === programId
            const label = getProgramBundle(id).athleteName
            return (
              <Link
                key={id}
                href={`/${id}${routeSuffix}`}
                className={cn(
                  'rounded px-2.5 py-1 font-mono text-xs transition-colors',
                  active
                    ? 'bg-[var(--green)]/20 text-[var(--green)]'
                    : 'text-zinc-500 hover:text-[var(--text)]'
                )}
              >
                {label}
              </Link>
            )
          })}
        </div>
        <div className="flex flex-1 flex-wrap gap-1 sm:justify-end">
          {LINKS.map(({ href, label }) => {
            const active =
              href === base
                ? pathname === base || pathname === `${base}/`
                : pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-md px-3 py-2 font-mono text-sm transition-colors',
                  active
                    ? 'bg-[var(--surface)] text-[var(--green)]'
                    : 'text-zinc-400 hover:bg-[var(--surface)] hover:text-[var(--text)]'
                )}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
