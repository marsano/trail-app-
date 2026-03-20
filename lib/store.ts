import { create } from 'zustand'
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from 'zustand/middleware'
import type { ProgramId } from '@/lib/registry'

export interface SessionState {
  done: boolean
  rating: 1 | 2 | 3 | 4 | 5 | null
  note: string
  garminSynced: boolean
}

const defaultSessionState = (): SessionState => ({
  done: false,
  rating: null,
  note: '',
  garminSynced: false,
})

export interface ProgramSlice {
  dateOverrides: Record<string, string>
  sessionStates: Record<string, SessionState>
  /** Connexion Garmin validée pour ce programme (indépendant de l’autre athlète). */
  garminConnected: boolean
}

const emptyProgram = (): ProgramSlice => ({
  dateOverrides: {},
  sessionStates: {},
  garminConnected: false,
})

function sliceOrEmpty(
  programs: Record<ProgramId, ProgramSlice> | undefined,
  id: ProgramId
): ProgramSlice {
  const base = emptyProgram()
  const p = programs?.[id]
  if (!p) return base
  return {
    ...base,
    ...p,
    dateOverrides: p.dateOverrides ?? {},
    sessionStates: p.sessionStates ?? {},
    garminConnected: p.garminConnected ?? false,
  }
}

export interface PlanStore {
  programs: Record<ProgramId, ProgramSlice>

  toggleDone: (programId: ProgramId, id: string) => void
  setRating: (programId: ProgramId, id: string, rating: number) => void
  setNote: (programId: ProgramId, id: string, note: string) => void
  moveSession: (programId: ProgramId, id: string, newDate: string) => void
  resetSessionDate: (programId: ProgramId, id: string) => void
  markGarminSynced: (programId: ProgramId, ids: string[]) => void
  setGarminConnected: (programId: ProgramId, v: boolean) => void
}

type LegacyPersisted = {
  dateOverrides?: Record<string, string>
  sessionStates?: Record<string, SessionState>
  programs?: Record<ProgramId, ProgramSlice>
  garminConnected?: boolean
}

function createTrailPlanStorage(): StateStorage {
  const persistKey = 'trail-plan-v2'
  const legacyKey = 'trail-plan-v1'
  return {
    getItem: (name) => {
      const raw = localStorage.getItem(name)
      if (raw) return raw
      if (name !== persistKey) return null
      const legacy = localStorage.getItem(legacyKey)
      if (!legacy) return null
      try {
        const parsed = JSON.parse(legacy) as {
          state?: LegacyPersisted
          version?: number
        }
        const st = parsed.state
        if (!st) return null
        if (st.programs) return legacy
        const migrated = {
          state: {
            programs: {
              matthieu: {
                dateOverrides: st.dateOverrides ?? {},
                sessionStates: st.sessionStates ?? {},
                garminConnected: st.garminConnected ?? false,
              },
              loic: emptyProgram(),
            },
          },
          version: 2,
        }
        return JSON.stringify(migrated)
      } catch {
        return null
      }
    },
    setItem: (name, value) => {
      localStorage.setItem(name, value)
    },
    removeItem: (name) => {
      localStorage.removeItem(name)
      if (name === persistKey) localStorage.removeItem(legacyKey)
    },
  }
}

function mergePersisted(
  persisted: unknown,
  current: PlanStore
): PlanStore {
  if (!persisted || typeof persisted !== 'object') return current
  const programs = (persisted as { programs?: Record<ProgramId, ProgramSlice> })
    .programs
  if (!programs) return current

  return {
    ...current,
    programs: {
      matthieu: sliceOrEmpty(programs, 'matthieu'),
      loic: sliceOrEmpty(programs, 'loic'),
    },
  }
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      programs: {
        matthieu: emptyProgram(),
        loic: emptyProgram(),
      },

      toggleDone: (programId, id) =>
        set((s) => {
          const cur = sliceOrEmpty(s.programs, programId)
          const prev = cur.sessionStates[id] ?? defaultSessionState()
          return {
            programs: {
              ...s.programs,
              [programId]: {
                ...cur,
                sessionStates: {
                  ...cur.sessionStates,
                  [id]: { ...prev, done: !prev.done },
                },
              },
            },
          }
        }),

      setRating: (programId, id, rating) =>
        set((s) => {
          const cur = sliceOrEmpty(s.programs, programId)
          const prev = cur.sessionStates[id] ?? defaultSessionState()
          const r = rating as 1 | 2 | 3 | 4 | 5
          return {
            programs: {
              ...s.programs,
              [programId]: {
                ...cur,
                sessionStates: {
                  ...cur.sessionStates,
                  [id]: { ...prev, rating: r },
                },
              },
            },
          }
        }),

      setNote: (programId, id, note) =>
        set((s) => {
          const cur = sliceOrEmpty(s.programs, programId)
          const prev = cur.sessionStates[id] ?? defaultSessionState()
          return {
            programs: {
              ...s.programs,
              [programId]: {
                ...cur,
                sessionStates: {
                  ...cur.sessionStates,
                  [id]: { ...prev, note },
                },
              },
            },
          }
        }),

      moveSession: (programId, id, newDate) =>
        set((s) => {
          const cur = sliceOrEmpty(s.programs, programId)
          return {
            programs: {
              ...s.programs,
              [programId]: {
                ...cur,
                dateOverrides: { ...cur.dateOverrides, [id]: newDate },
              },
            },
          }
        }),

      resetSessionDate: (programId, id) =>
        set((s) => {
          const cur = sliceOrEmpty(s.programs, programId)
          const rest = { ...cur.dateOverrides }
          delete rest[id]
          return {
            programs: {
              ...s.programs,
              [programId]: {
                ...cur,
                dateOverrides: rest,
              },
            },
          }
        }),

      markGarminSynced: (programId, ids) =>
        set((s) => {
          const cur = sliceOrEmpty(s.programs, programId)
          const next = { ...cur.sessionStates }
          for (const id of ids) {
            const prev = next[id] ?? defaultSessionState()
            next[id] = { ...prev, garminSynced: true }
          }
          return {
            programs: {
              ...s.programs,
              [programId]: {
                ...cur,
                sessionStates: next,
              },
            },
          }
        }),

      setGarminConnected: (programId, v) =>
        set((s) => {
          const cur = sliceOrEmpty(s.programs, programId)
          return {
            programs: {
              ...s.programs,
              [programId]: {
                ...cur,
                garminConnected: v,
              },
            },
          }
        }),
    }),
    {
      name: 'trail-plan-v2',
      storage: createJSONStorage(() => createTrailPlanStorage()),
      partialize: (state) => ({
        programs: state.programs,
      }),
      merge: (persisted, current) => mergePersisted(persisted, current),
    }
  )
)

export function getSessionState(
  states: Record<string, SessionState>,
  id: string
): SessionState {
  return states[id] ?? defaultSessionState()
}
