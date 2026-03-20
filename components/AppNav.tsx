'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Plan' },
  { href: '/calendar', label: 'Calendrier' },
  { href: '/dashboard', label: 'Dashboard' },
]

export function AppNav() {
  const pathname = usePathname()
  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3 sm:gap-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-[var(--text)]"
        >
          Trail Plan
        </Link>
        <div className="flex flex-1 flex-wrap gap-1 sm:justify-end">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href
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
