import { cn } from '@/lib/utils'

export function PhaseHeader({
  phase,
  label,
  className,
}: {
  phase: number
  label?: string
  className?: string
}) {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]/95 py-4 backdrop-blur',
        className
      )}
    >
      <h2 className="font-[family-name:var(--font-syne)] text-xl font-extrabold tracking-tight text-[var(--text)] sm:text-2xl">
        Phase {phase}
        {label ? (
          <span className="block font-mono text-sm font-normal text-[var(--text)]/70 sm:inline sm:pl-3">
            — {label}
          </span>
        ) : null}
      </h2>
    </header>
  )
}
