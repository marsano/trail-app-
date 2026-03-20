import type { SessionWorkoutBlock, WorkoutBlockType } from '@/lib/plan-types'

/** Première allure @X:XX/km ou plage dans un bloc. */
export function extractPaceTarget(text: string): string | null {
  if (!text.trim()) return null
  const at = text.match(/@(\d{1,2}:\d{2})(?:\/km)?/i)
  if (at) return `${at[1]}/km`
  const range = text.match(
    /(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})\s*\/km/i
  )
  if (range) return `${range[1]}–${range[2]}/km`
  const plain = text.match(/(\d{1,2}:\d{2})\s*\/km/i)
  if (plain) return `${plain[1]}/km`
  return null
}

function makeBlock(
  sessionId: string,
  type: WorkoutBlockType,
  suffix: string,
  content: string
): SessionWorkoutBlock {
  const c = content.trim()
  return {
    id: `${sessionId}-${suffix}`,
    type,
    content: c,
    paceTarget: c ? extractPaceTarget(c) : null,
  }
}

/**
 * Découpe un texte plan historique (séparateurs `|`) en 3 blocs.
 * Sans `|`, tout va dans « intervalles » sauf détection RAC / Ech en une ligne.
 */
export function legacyContentToBlocks(
  content: string,
  sessionId: string
): SessionWorkoutBlock[] {
  const c = content.trim()
  if (!c) {
    return [
      makeBlock(sessionId, 'warmup', 'w', ''),
      makeBlock(sessionId, 'intervals', 'i', ''),
      makeBlock(sessionId, 'cooldown', 'c', ''),
    ]
  }

  const parts = c.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean)
  let w = ''
  let i = ''
  let cd = ''

  if (parts.length >= 3) {
    w = parts[0]
    cd = parts[parts.length - 1]
    i = parts.slice(1, -1).join(' | ')
  } else if (parts.length === 2) {
    const [a, b] = parts
    const aWarm = /^(ech|activation|échauff)/i.test(a.trim())
    const bCool = /^(rac|récup|retour au calme)/i.test(b.trim())
    if (aWarm && bCool) {
      w = a
      cd = b
      i = ''
    } else if (aWarm && !bCool) {
      w = a
      i = b
    } else if (!aWarm && bCool) {
      i = a
      cd = b
    } else {
      i = `${a} | ${b}`
    }
  } else {
    const single = parts[0]
    const pipeRac = single.split(/\s*\|\s*(?=RAC\s+)/i)
    if (pipeRac.length === 2) {
      const head = pipeRac[0].trim()
      cd = pipeRac[1].trim()
      const headParts = head.split(/\s*\|\s*/)
      if (headParts.length >= 2) {
        w = headParts[0]
        i = headParts.slice(1).join(' | ')
      } else if (/^(ech|activation|échauff)/i.test(head)) {
        w = head
        i = ''
      } else {
        i = head
      }
    } else {
      i = single
    }
  }

  return [
    makeBlock(sessionId, 'warmup', 'w', w),
    makeBlock(sessionId, 'intervals', 'i', i),
    makeBlock(sessionId, 'cooldown', 'c', cd),
  ]
}
