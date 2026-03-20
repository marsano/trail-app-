import type { Session, SessionWorkoutBlock, WorkoutBlockType } from '@/lib/plan-types'
import { legacyContentToBlocks } from '@/lib/parse-plan-blocks'

const ORDER: WorkoutBlockType[] = ['warmup', 'intervals', 'cooldown']

export const BLOCK_UI_LABEL: Record<WorkoutBlockType, string> = {
  warmup: '1) Échauffement',
  intervals: '2) Intervalles',
  cooldown: '3) Récupération',
}

/** Libellés courts pour description Garmin. */
const BLOCK_GARMIN_HEADER: Record<WorkoutBlockType, string> = {
  warmup: 'ÉCHAUFFEMENT',
  intervals: 'INTERVALLES',
  cooldown: 'RÉCUPÉRATION',
}

function normalizeThreeBlocks(blocks: SessionWorkoutBlock[]): SessionWorkoutBlock[] {
  const byType = new Map(blocks.map((b) => [b.type, b]))
  return ORDER.map((type) => {
    const existing = byType.get(type)
    if (existing) {
      return {
        ...existing,
        id: existing.id || type,
        paceTarget: existing.paceTarget ?? null,
        content: existing.content ?? '',
      }
    }
    return { id: type, type, content: '', paceTarget: null }
  })
}

/**
 * Trois blocs pour affichage / édition. Sans `session.blocks`, le texte legacy
 * `content` est placé dans « intervalles ».
 */
export function getDisplayBlocks(session: Session): SessionWorkoutBlock[] {
  if (session.blocks && session.blocks.length > 0) {
    return normalizeThreeBlocks(session.blocks)
  }
  return normalizeThreeBlocks(
    legacyContentToBlocks(session.content ?? '', session.id)
  )
}

/** Texte agrégé (équivalent ancien champ `content` multi-lignes). */
export function formatBlocksPlain(blocks: SessionWorkoutBlock[]): string {
  return blocks
    .map((b) => {
      const pace = b.paceTarget?.trim() ? ` @${b.paceTarget.trim()}` : ''
      const title = BLOCK_UI_LABEL[b.type]
      const body = b.content.trim()
      if (!body && !b.paceTarget?.trim()) return ''
      return `${title}${pace}\n${body}`
    })
    .filter(Boolean)
    .join('\n\n')
}

/** Description envoyée à Garmin Connect (structure lisible par toi sur la montre). */
export function formatBlocksForGarminDescription(session: Session): string {
  const blocks = getDisplayBlocks(session)
  const parts: string[] = []
  for (const b of blocks) {
    const pace = b.paceTarget?.trim() ? ` @ ${b.paceTarget.trim()}` : ''
    parts.push(`${BLOCK_GARMIN_HEADER[b.type]}${pace}`)
    if (b.content.trim()) parts.push(b.content.trim())
    parts.push('')
  }
  let desc = parts.join('\n').trimEnd()
  if (session.note?.trim()) {
    desc += (desc ? '\n\n' : '') + `Note: ${session.note.trim()}`
  }
  if (session.km != null) {
    desc += `\nVolume indicatif: ${session.km} km`
  }
  if (session.dp != null) {
    desc += `\nD+: ${session.dp} m`
  }
  return desc.trim()
}

export function garminWorkoutTitleSnippet(session: Session): string {
  const blocks = getDisplayBlocks(session)
  const main = blocks.find((b) => b.type === 'intervals')
  const text = main?.content?.trim() || session.content?.trim() || ''
  return text.slice(0, 60)
}
