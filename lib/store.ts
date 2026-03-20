import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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

export interface PlanStore {
  dateOverrides: Record<string, string>
  sessionStates: Record<string, SessionState>
  garminConnected: boolean

  toggleDone: (id: string) => void
  setRating: (id: string, rating: number) => void
  setNote: (id: string, note: string) => void
  moveSession: (id: string, newDate: string) => void
  resetSessionDate: (id: string) => void
  markGarminSynced: (ids: string[]) => void
  setGarminConnected: (v: boolean) => void
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      dateOverrides: {},
      sessionStates: {},
      garminConnected: false,

      toggleDone: (id) =>
        set((s) => {
          const cur = s.sessionStates[id] ?? defaultSessionState()
          return {
            sessionStates: {
              ...s.sessionStates,
              [id]: { ...cur, done: !cur.done },
            },
          }
        }),

      setRating: (id, rating) =>
        set((s) => {
          const cur = s.sessionStates[id] ?? defaultSessionState()
          const r = rating as 1 | 2 | 3 | 4 | 5
          return {
            sessionStates: {
              ...s.sessionStates,
              [id]: { ...cur, rating: r },
            },
          }
        }),

      setNote: (id, note) =>
        set((s) => {
          const cur = s.sessionStates[id] ?? defaultSessionState()
          return {
            sessionStates: {
              ...s.sessionStates,
              [id]: { ...cur, note },
            },
          }
        }),

      moveSession: (id, newDate) =>
        set((s) => ({
          dateOverrides: { ...s.dateOverrides, [id]: newDate },
        })),

      resetSessionDate: (id) =>
        set((s) => {
          const rest = { ...s.dateOverrides }
          delete rest[id]
          return { dateOverrides: rest }
        }),

      markGarminSynced: (ids) =>
        set((s) => {
          const next = { ...s.sessionStates }
          for (const id of ids) {
            const cur = next[id] ?? defaultSessionState()
            next[id] = { ...cur, garminSynced: true }
          }
          return { sessionStates: next }
        }),

      setGarminConnected: (v) => set({ garminConnected: v }),
    }),
    {
      name: 'trail-plan-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dateOverrides: state.dateOverrides,
        sessionStates: state.sessionStates,
      }),
    }
  )
)

export function getSessionState(
  states: Record<string, SessionState>,
  id: string
): SessionState {
  return states[id] ?? defaultSessionState()
}
