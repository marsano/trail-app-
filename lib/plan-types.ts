export type SessionType =
  | 'EF'
  | 'VMA'
  | 'TEMPO'
  | 'RENFO'
  | 'TRAIL'
  | 'RANDO'
  | 'WC'
  | 'RACE'
  | 'REPOS'

export interface Session {
  id: string
  phase: number
  phaseLabel?: string
  week: number
  weekLabel?: string
  date: string
  day: string
  type: SessionType
  content: string
  km: number | null
  dp: number | null
  note: string
  isEvent?: boolean
}

export interface RaceInfo {
  name: string
  date: string
  distance: string
  elevation: string
}

export interface PlanEvent {
  date: string
  label: string
  emoji: string
  target: string
}
