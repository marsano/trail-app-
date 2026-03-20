import type { Session } from './plan-types'
import type { PlanEvent } from './plan-types'
import type { RaceInfo } from './plan-types'
import * as Matthieu from './plans/matthieu'
import * as Loic from './plans/loic'

export type ProgramId = 'matthieu' | 'loic'

export interface ProgramBundle {
  id: ProgramId
  athleteName: string
  slug: string
  distanceLabel: string
  plan: Session[]
  raceInfo: RaceInfo
  events: PlanEvent[]
}

const REGISTRY: Record<ProgramId, ProgramBundle> = {
  matthieu: {
    id: 'matthieu',
    athleteName: 'Matthieu',
    slug: 'matthieu',
    distanceLabel: '76 km / 5000 D+',
    plan: Matthieu.PLAN,
    raceInfo: Matthieu.RACE_INFO,
    events: Matthieu.EVENTS,
  },
  loic: {
    id: 'loic',
    athleteName: 'Loïc',
    slug: 'loic',
    distanceLabel: '33 km / 2130 D+',
    plan: Loic.PLAN,
    raceInfo: Loic.RACE_INFO,
    events: Loic.EVENTS,
  },
}

export const PROGRAM_LIST: ProgramId[] = ['matthieu', 'loic']

export function getProgramBundle(id: ProgramId): ProgramBundle {
  return REGISTRY[id]
}

export function isProgramSlug(s: string): s is ProgramId {
  return s === 'matthieu' || s === 'loic'
}
