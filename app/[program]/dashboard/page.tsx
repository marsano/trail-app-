import { Dashboard } from '@/components/Dashboard'
import { ClientOnly } from '@/components/ClientOnly'

export default function DashboardPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 font-mono text-sm text-zinc-500">
          Stats, volume hebdo et répartition des séances cochées.
        </p>
      </header>
      <ClientOnly>
        <Dashboard />
      </ClientOnly>
    </div>
  )
}
