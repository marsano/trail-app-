import { CalendarView } from '@/components/CalendarView'
import { ClientOnly } from '@/components/ClientOnly'

export default function CalendarPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
          Calendrier
        </h1>
        <p className="mt-2 font-mono text-sm text-zinc-500">
          Avril → juin 2026 · glisse une séance sur un autre jour (courses
          verrouillées).
        </p>
      </header>
      <ClientOnly>
        <CalendarView />
      </ClientOnly>
    </div>
  )
}
