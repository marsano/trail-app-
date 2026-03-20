'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PLAN, RACE_INFO, EVENTS, type SessionType } from '@/lib/plan'
import { usePlanStore, getSessionState, type SessionState } from '@/lib/store'
import { resolveSessionDate, daysBetween, todayISO } from '@/lib/plan-helpers'
const TYPE_ORDER: SessionType[] = [
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

const PIE_COLORS: Record<SessionType, string> = {
  EF: '#6fcf74',
  VMA: '#e8604a',
  TEMPO: '#e8a84a',
  RENFO: '#b48fe8',
  TRAIL: '#4ecdc4',
  RANDO: '#5ab4d4',
  WC: '#5ab4d4',
  RACE: '#ff6b5a',
  REPOS: '#6b7280',
}

function trainingStreak(
  sessionStates: Record<string, SessionState>,
  overrides: Record<string, string>
): number {
  const start = new Date()
  let streak = 0
  for (let i = 0; i < 400; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    const onDay = PLAN.filter((s) => resolveSessionDate(s, overrides) === iso)
    const anyDone = onDay.some((s) => sessionStates[s.id]?.done)
    if (anyDone) streak++
    else break
  }
  return streak
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-extrabold text-[var(--text)]">
        {value}
      </p>
      {sub ? (
        <p className="mt-1 font-mono text-xs text-zinc-500">{sub}</p>
      ) : null}
    </div>
  )
}

export function Dashboard() {
  const sessionStates = usePlanStore((s) => s.sessionStates)
  const dateOverrides = usePlanStore((s) => s.dateOverrides)

  const stats = useMemo(() => {
    const today = todayISO()
    const daysToRace = daysBetween(today, RACE_INFO.date)
    let doneCount = 0
    let kmSum = 0
    let dpSum = 0
    for (const s of PLAN) {
      const st = getSessionState(sessionStates, s.id)
      if (!st.done) continue
      doneCount++
      if (s.km != null) kmSum += s.km
      if (s.dp != null) dpSum += s.dp
    }

    const weekKm = new Map<string, { label: string; km: number }>()
    const weekOrder: string[] = []
    for (const s of PLAN) {
      const key = `${s.phase}-${s.week}`
      if (!weekOrder.includes(key)) weekOrder.push(key)
      if (!getSessionState(sessionStates, s.id).done || s.km == null) continue
      const cur = weekKm.get(key)?.km ?? 0
      const label = s.weekLabel ?? `Semaine ${s.week}`
      weekKm.set(key, { label, km: cur + s.km })
    }

    const barData = weekOrder.map((k) => {
      const v = weekKm.get(k)
      return { name: v?.label ?? k, km: v?.km ?? 0 }
    })

    const typeCount = new Map<SessionType, number>()
    for (const t of TYPE_ORDER) typeCount.set(t, 0)
    for (const s of PLAN) {
      if (!getSessionState(sessionStates, s.id).done) continue
      typeCount.set(s.type, (typeCount.get(s.type) ?? 0) + 1)
    }
    const pieData = TYPE_ORDER.map((type) => ({
      type,
      count: typeCount.get(type) ?? 0,
    })).filter((d) => d.count > 0)

    const streak = trainingStreak(sessionStates, dateOverrides)

    return {
      daysToRace,
      doneCount,
      kmSum,
      dpSum,
      barData,
      pieData,
      streak,
    }
  }, [sessionStates, dateOverrides])

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Jours avant la course"
          value={stats.daysToRace >= 0 ? stats.daysToRace : 0}
          sub={RACE_INFO.date}
        />
        <StatCard label="Séances réalisées" value={stats.doneCount} />
        <StatCard
          label="Km cumulés (validés)"
          value={Math.round(stats.kmSum)}
        />
        <StatCard label="D+ cumulé (validés)" value={stats.dpSum} />
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <h3 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-bold">
          Streak
        </h3>
        <p className="font-mono text-sm text-[var(--text)]">
          <span className="text-2xl font-bold text-[var(--green)]">
            {stats.streak}
          </span>{' '}
          jour(s) consécutif(s) avec au moins une séance cochée (depuis
          aujourd’hui).
        </p>
      </div>

      <div>
        <h3 className="mb-3 font-[family-name:var(--font-syne)] text-lg font-bold">
          Prochains événements
        </h3>
        <ul className="space-y-2">
          {EVENTS.map((ev) => {
            const j = daysBetween(todayISO(), ev.date)
            return (
              <li
                key={ev.date}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm"
              >
                <span>
                  {ev.emoji} {ev.label}
                </span>
                <span className="text-zinc-500">
                  J{j >= 0 ? `-${j}` : `+${Math.abs(j)}`} · {ev.target}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-bold">
            Volume km / semaine (validé)
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.barData}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#8a9e91', fontSize: 10 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tick={{ fill: '#8a9e91', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#111412',
                    border: '1px solid #1e2420',
                    fontFamily: 'var(--font-dm)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="km" fill="#6fcf74" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-bold">
            Répartition par type (validé)
          </h3>
          <div className="h-[280px] w-full">
            {stats.pieData.length === 0 ? (
              <p className="flex h-full items-center justify-center font-mono text-sm text-zinc-500">
                Aucune séance cochée pour l’instant.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {stats.pieData.map((entry) => (
                      <Cell
                        key={entry.type}
                        fill={PIE_COLORS[entry.type]}
                        stroke="#0a0c0b"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#111412',
                      border: '1px solid #1e2420',
                      fontFamily: 'var(--font-dm)',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] text-zinc-500">
            {stats.pieData.map((d) => (
              <li key={d.type} className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: PIE_COLORS[d.type] }}
                />
                {d.type} ({d.count})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
