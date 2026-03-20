import type { Session } from '@/lib/plan-types'

/** Champs de séance modifiables par l’utilisateur (sans toucher au fichier source du plan). */
export type SessionEdit = Partial<
  Pick<
    Session,
    'content' | 'km' | 'dp' | 'note' | 'type' | 'day' | 'blocks'
  >
>

export function mergeSessionEdit(
  base: Session,
  edits: Record<string, SessionEdit>,
  id: string
): Session {
  const e = edits[id]
  if (!e) return base
  return { ...base, ...e }
}

export function applySessionCustomizations(
  plan: Session[],
  edits: Record<string, SessionEdit>,
  deletedIds: string[]
): Session[] {
  const del = new Set(deletedIds)
  return plan
    .filter((s) => !del.has(s.id))
    .map((s) => mergeSessionEdit(s, edits, s.id))
}
