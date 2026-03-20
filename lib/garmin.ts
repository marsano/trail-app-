import type { Session, SessionType } from '@/lib/plan-types'
import {
  formatBlocksForGarminDescription,
  garminWorkoutTitleSnippet,
} from '@/lib/workout-blocks'

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
  const snippet = garminWorkoutTitleSnippet(session)
  const name = `[${session.type}] ${snippet}`
  const description = formatBlocksForGarminDescription(session)
  const meters =
    session.km != null
      ? Math.max(1000, Math.round(session.km * 1000))
      : 5000
  return { name, description, meters }
}

export function shouldSkipGarminSync(session: Session): boolean {
  return session.type === 'REPOS'
}
