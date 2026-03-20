import Link from 'next/link'
import { getProgramBundle, PROGRAM_LIST } from '@/lib/registry'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
        Trail Plan
      </h1>
      <p className="mt-3 font-mono text-sm text-zinc-500">
        Choisis un espace d’entraînement (Matthieu, Loïc, Thelma). Chaque
        programme a son propre plan, calendrier, stats et tableau imprimable
        (stockés dans ce navigateur).
      </p>

      <ul className="mt-10 flex flex-col gap-4">
        {PROGRAM_LIST.map((id) => {
          const b = getProgramBundle(id)
          return (
            <li key={id}>
              <Link
                href={`/${id}`}
                className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:border-[var(--green)]/40 hover:bg-[var(--bg)]"
              >
                <p className="font-[family-name:var(--font-syne)] text-xl font-bold text-[var(--text)]">
                  {b.athleteName}
                </p>
                <p className="mt-1 font-mono text-sm text-zinc-500">
                  {b.distanceLabel}
                </p>
                <p className="mt-3 font-mono text-xs text-[var(--green)]">
                  Ouvrir le plan →
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
