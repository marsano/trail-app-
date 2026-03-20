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

/** Bloc structuré pour Garmin / affichage (échauffement, cœur de séance, retour au calme). */
export type WorkoutBlockType = 'warmup' | 'intervals' | 'cooldown'

export interface SessionWorkoutBlock {
  id: string
  type: WorkoutBlockType
  /** Détail (ex. 3×3 km, récup 2 min 30). */
  content: string
  /** Allure cible (ex. 5:00/km, allure 10 km) — équivalent @allure. */
  paceTarget: string | null
}

export interface Session {
  id: string
  phase: number
  phaseLabel?: string
  week: number
  weekLabel?: string
  date: string
  day: string
  type: SessionType
  /** Texte libre ou agrégé des blocs (rétrocompatibilité, recherche). */
  content: string
  km: number | null
  dp: number | null
  note: string
  isEvent?: boolean
  /** Si défini, structure la séance pour l’app et Garmin ; sinon `content` est affiché dans le bloc « intervalles ». */
  blocks?: SessionWorkoutBlock[]
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
