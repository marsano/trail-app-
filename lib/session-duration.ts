import type { Session } from '@/lib/plan-types'
import { getDisplayBlocks } from '@/lib/workout-blocks'

/** Retire les allures type 6:35/km pour ne pas compter comme durées. */
function stripPaceTokens(s: string): string {
  return s.replace(
    /\d{1,2}:\d{2}(?:\s*[–-]\s*\d{1,2}:\d{2})?\s*\/km/gi,
    ' PACE '
  )
}

/**
 * Estime la durée totale de séance (minutes) à partir des textes des blocs + note.
 * Heuristique : somme des durées explicites (35', 1h30, 6x3', etc.) ; si très faible
 * et km renseigné, complète avec km × min/km par défaut.
 */
export function estimateSessionDurationMinutes(session: Session): number | null {
  const blocks = getDisplayBlocks(session)
  const raw = [...blocks.map((b) => b.content), session.note]
    .filter(Boolean)
    .join(' ')
  let work = stripPaceTokens(raw)

  let minutes = 0

  work = work.replace(/\b(\d+)h(?:(\d{1,2}))?\b/gi, (_, h, min) => {
    minutes += parseInt(h, 10) * 60 + (min != null && min !== '' ? parseInt(min, 10) : 0)
    return ' '
  })

  work = work.replace(/\b(\d+)\s*x\s*(\d+)'(?:(\d{1,2})'')?/gi, (_, reps, min, sec) => {
    const r = parseInt(reps, 10)
    const m = parseInt(min, 10)
    const s = sec != null && sec !== '' ? parseInt(sec, 10) : 0
    minutes += r * (m + s / 60)
    return ' '
  })

  work = work.replace(/\b(\d+)'(\d{2})''/g, (_, m, s) => {
    minutes += parseInt(m, 10) + parseInt(s, 10) / 60
    return ' '
  })

  work = work.replace(/\b(\d+)'(\d{2})\b/g, (full, m, s) => {
    if (full.includes("''")) return full
    minutes += parseInt(m, 10) + parseInt(s, 10) / 60
    return ' '
  })

  work = work.replace(/\b\d+''\b/g, ' ')

  work = work.replace(/\b(\d{1,3})'\b/g, (_, n) => {
    const v = parseInt(n, 10)
    if (v <= 180) minutes += v
    return ' '
  })

  work.replace(/recup(?:ération)?\s+(\d+)\s*min\s+(\d+)/gi, (_, a, b) => {
    minutes += parseInt(a, 10) + parseInt(b, 10) / 60
    return ' '
  })

  const rounded = Math.round(minutes * 10) / 10
  if (rounded >= 8) return Math.round(rounded)

  if (session.km != null && session.km > 0) {
    const defaultMinPerKm =
      session.type === 'TRAIL' ||
      session.type === 'WC' ||
      session.type === 'RANDO'
        ? 7.5
        : 6
    return Math.round(session.km * defaultMinPerKm)
  }

  if (rounded > 0) return Math.max(1, Math.round(rounded))
  return null
}

export function formatDurationLabel(minutes: number | null): string {
  if (minutes == null || !Number.isFinite(minutes)) return '—'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h <= 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}
