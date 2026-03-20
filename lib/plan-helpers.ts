import type { Session } from '@/lib/plan-types'

export function resolveSessionDate(
  session: Session,
  overrides: Record<string, string>
): string {
  return overrides[session.id] ?? session.date
}

export function sessionsOnDate(
  plan: Session[],
  date: string,
  overrides: Record<string, string>
): Session[] {
  return plan.filter((s) => resolveSessionDate(s, overrides) === date)
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

/** Lundi de la semaine locale (pour regrouper les séances après déplacement). */
export function mondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d.setDate(diff))
  const y = mon.getFullYear()
  const m = String(mon.getMonth() + 1).padStart(2, '0')
  const da = String(mon.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}

function formatWeekRangeLabel(
  sessions: Session[],
  overrides: Record<string, string>
): string {
  if (sessions.length === 0) return ''
  const dates = sessions
    .map((s) => resolveSessionDate(s, overrides))
    .sort()
  const a = dates[0]
  const b = dates[dates.length - 1]
  const fmt = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
  if (a === b) return fmt(a)
  return `${fmt(a)} – ${fmt(b)}`
}

/**
 * Regroupe le plan par phase puis par semaine calendaire (lundi) des **dates effectives**
 * (avec décalages calendrier). Les séances sont triées par date dans chaque bloc.
 */
export function groupPlanByEffectiveWeeks(
  plan: Session[],
  overrides: Record<string, string>
): PhaseWeekGroup[] {
  const phases = Array.from(new Set(plan.map((s) => s.phase))).sort(
    (a, b) => a - b
  )
  const out: PhaseWeekGroup[] = []

  for (const ph of phases) {
    const inPhase = plan
      .filter((s) => s.phase === ph)
      .sort((a, b) => {
        const da = resolveSessionDate(a, overrides)
        const db = resolveSessionDate(b, overrides)
        return da.localeCompare(db)
      })
    if (inPhase.length === 0) continue

    const phaseLabel = inPhase.find((s) => s.phaseLabel)?.phaseLabel

    const weeks: PhaseWeekGroup['weeks'] = []
    let bucket: Session[] = []
    let weekKey: string | null = null
    let wk = 1

    for (const s of inPhase) {
      const eff = resolveSessionDate(s, overrides)
      const mk = mondayOfWeek(eff)
      if (weekKey === null || mk !== weekKey) {
        if (bucket.length > 0) {
          weeks.push({
            week: wk++,
            weekLabel: formatWeekRangeLabel(bucket, overrides),
            sessions: [...bucket],
          })
        }
        bucket = [s]
        weekKey = mk
      } else {
        bucket.push(s)
      }
    }
    if (bucket.length > 0) {
      weeks.push({
        week: wk,
        weekLabel: formatWeekRangeLabel(bucket, overrides),
        sessions: bucket,
      })
    }

    out.push({ phase: ph, phaseLabel, weeks })
  }
  return out
}

export function groupPlanByPhaseWeek(plan: Session[]): PhaseWeekGroup[] {
  const phaseMap = new Map<number, PhaseWeekGroup>()

  for (const s of plan) {
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
