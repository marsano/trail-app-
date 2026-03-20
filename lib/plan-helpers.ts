import { PLAN, type Session } from '@/lib/plan'

export function resolveSessionDate(
  session: Session,
  overrides: Record<string, string>
): string {
  return overrides[session.id] ?? session.date
}

export function sessionsOnDate(
  date: string,
  overrides: Record<string, string>
): Session[] {
  return PLAN.filter((s) => resolveSessionDate(s, overrides) === date)
}

export type PhaseWeekGroup = {
  phase: number
  phaseLabel?: string
  weeks: {
    week: number
    weekLabel?: string
    sessions: Session[]
  }[]
}

export function groupPlanByPhaseWeek(): PhaseWeekGroup[] {
  const phaseMap = new Map<number, PhaseWeekGroup>()

  for (const s of PLAN) {
    if (!phaseMap.has(s.phase)) {
      phaseMap.set(s.phase, {
        phase: s.phase,
        phaseLabel: s.phaseLabel,
        weeks: [],
      })
    }
    const pg = phaseMap.get(s.phase)
    if (!pg) continue
    if (!pg.phaseLabel && s.phaseLabel) pg.phaseLabel = s.phaseLabel

    let wk = pg.weeks.find((w) => w.week === s.week)
    if (!wk) {
      wk = {
        week: s.week,
        weekLabel: s.weekLabel,
        sessions: [],
      }
      pg.weeks.push(wk)
    }
    if (!wk.weekLabel && s.weekLabel) wk.weekLabel = s.weekLabel
    wk.sessions.push(s)
  }

  return Array.from(phaseMap.values()).sort((a, b) => a.phase - b.phase)
}

export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T12:00:00')
  const db = new Date(b + 'T12:00:00')
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24))
}
