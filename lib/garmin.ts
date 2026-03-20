import type { Session, SessionType } from '@/lib/plan'

const sportMap: Record<SessionType, string | null> = {
  EF: 'running',
  VMA: 'running',
  TEMPO: 'running',
  RACE: 'running',
  TRAIL: 'running',
  RANDO: 'other',
  WC: 'other',
  RENFO: 'strength_training',
  REPOS: null,
}

export function sessionSportKey(type: SessionType): string {
  return sportMap[type] ?? 'other'
}

/** Text + distance payload for addRunningWorkout (Garmin). */
export function sessionToGarminRunningPayload(session: Session) {
  const name = `[${session.type}] ${session.content.slice(0, 60)}`
  const parts: string[] = [session.content]
  if (session.note) parts.push(session.note)
  if (session.km != null) parts.push(`${session.km}km`)
  if (session.dp != null) parts.push(`${session.dp}m D+`)
  const description = parts.join('\n')
  const meters =
    session.km != null
      ? Math.max(1000, Math.round(session.km * 1000))
      : 5000
  return { name, description, meters }
}

export function shouldSkipGarminSync(session: Session): boolean {
  return session.type === 'REPOS'
}
