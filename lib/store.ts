import { create } from 'zustand'
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from 'zustand/middleware'
import type { ProgramId } from '@/lib/registry'
import type { GarminTokensPayload } from '@/lib/garmin-types'
import type { SessionEdit } from '@/lib/session-customization'

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
  /** Email Garmin utilisé pour la session (affichage + constructeur client côté API). */
  garminAccountEmail: string | null
  /** Jetons OAuth après 1re connexion — plus besoin du mot de passe tant qu’ils sont valides. */
  garminTokens: GarminTokensPayload | null
  /** Surcharges locales (contenu, km, D+, type…) par id de séance. */
  sessionEdits: Record<string, SessionEdit>
  /** Séances masquées du plan (suppression locale). */
  deletedSessionIds: string[]
  /** Rappels navigateur (Notification API) pour séances à venir. */
  reminderBrowserEnabled: boolean
}

const emptyProgram = (): ProgramSlice => ({
  dateOverrides: {},
  sessionStates: {},
  garminConnected: false,
  garminAccountEmail: null,
  garminTokens: null,
  sessionEdits: {},
  deletedSessionIds: [],
  reminderBrowserEnabled: false,
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
    garminAccountEmail: p.garminAccountEmail ?? null,
    garminTokens: p.garminTokens ?? null,
    sessionEdits: p.sessionEdits ?? {},
    deletedSessionIds: p.deletedSessionIds ?? [],
    reminderBrowserEnabled: p.reminderBrowserEnabled ?? false,
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
  /** Enregistre email + jetons après connexion réussie (ou met à jour après sync). */
  setGarminSession: (
    programId: ProgramId,
    payload: { email: string; tokens: GarminTokensPayload } | null
  ) => void
  setSessionEdit: (
    programId: ProgramId,
    id: string,
    patch: SessionEdit
  ) => void
  clearSessionEdit: (programId: ProgramId, id: string) => void
  deleteSession: (programId: ProgramId, id: string) => void
  setReminderBrowserEnabled: (programId: ProgramId, enabled: boolean) => void
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
              thelma: emptyProgram(),
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
      thelma: sliceOrEmpty(programs, 'thelma'),
    },
  }
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      programs: {
        matthieu: emptyProgram(),
        loic: emptyProgram(),
        thelma: emptyProgram(),
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

      setGarminSession: (programId, payload) =>
        set((s) => {
          const cur = sliceOrEmpty(s.programs, programId)
          if (payload === null) {
            return {
              programs: {
                ...s.programs,
                [programId]: {
                  ...cur,
                  garminConnected: false,
                  garminAccountEmail: null,
                  garminTokens: null,
                },
              },
            }
          }
          return {
            programs: {
              ...s.programs,
              [programId]: {
                ...cur,
                garminConnected: true,
                garminAccountEmail: payload.email,
                garminTokens: payload.tokens,
              },
            },
          }
        }),

      setSessionEdit: (programId, id, patch) =>
        set((s) => {
          const cur = sliceOrEmpty(s.programs, programId)
          const merged = { ...(cur.sessionEdits[id] ?? {}), ...patch }
          return {
            programs: {
              ...s.programs,
              [programId]: {
                ...cur,
                sessionEdits: { ...cur.sessionEdits, [id]: merged },
              },
            },
          }
        }),

      clearSessionEdit: (programId, id) =>
        set((s) => {
          const cur = sliceOrEmpty(s.programs, programId)
          const next = { ...cur.sessionEdits }
          delete next[id]
          return {
            programs: {
              ...s.programs,
              [programId]: {
                ...cur,
                sessionEdits: next,
              },
            },
          }
        }),

      deleteSession: (programId, id) =>
        set((s) => {
          const cur = sliceOrEmpty(s.programs, programId)
          const nextOverrides = { ...cur.dateOverrides }
          delete nextOverrides[id]
          const nextStates = { ...cur.sessionStates }
          delete nextStates[id]
          const nextEdits = { ...cur.sessionEdits }
          delete nextEdits[id]
          const del = cur.deletedSessionIds.includes(id)
            ? cur.deletedSessionIds
            : [...cur.deletedSessionIds, id]
          return {
            programs: {
              ...s.programs,
              [programId]: {
                ...cur,
                deletedSessionIds: del,
                dateOverrides: nextOverrides,
                sessionStates: nextStates,
                sessionEdits: nextEdits,
              },
            },
          }
        }),

      setReminderBrowserEnabled: (programId, enabled) =>
        set((s) => {
          const cur = sliceOrEmpty(s.programs, programId)
          return {
            programs: {
              ...s.programs,
              [programId]: {
                ...cur,
                reminderBrowserEnabled: enabled,
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
