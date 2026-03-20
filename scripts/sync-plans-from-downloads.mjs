/**
 * Régénère lib/plans/loic.ts, matthieu.ts et thelma.ts depuis les exports
 * des fichiers dans Téléchargements (noms ci-dessous).
 *
 * Usage: node scripts/sync-plans-from-downloads.mjs
 */
import { writeFileSync } from 'fs'
import { pathToFileURL } from 'url'

const ROOT = '/Users/matthieu/Documents/trail-plan'
const LOIC_SRC = '/Users/matthieu/Downloads/plan-loic-corrige (3).js'
const MAT_SRC = '/Users/matthieu/Downloads/plan-matthieu-corrige (3).js'
const THELMA_SRC = '/Users/matthieu/Downloads/plan-thelma.js'

function emitFile(name, mod) {
  const body = `import type { PlanEvent, RaceInfo, Session } from '../plan-types'

export const RACE_INFO: RaceInfo = ${JSON.stringify(mod.RACE_INFO, null, 2)}

export const EVENTS: PlanEvent[] = ${JSON.stringify(mod.EVENTS, null, 2)}

export const PLAN: Session[] = ${JSON.stringify(mod.PLAN, null, 2)}
`
  writeFileSync(`${ROOT}/lib/plans/${name}.ts`, body, 'utf8')
  console.log(`Wrote lib/plans/${name}.ts (${mod.PLAN.length} sessions)`)
}

const loic = await import(pathToFileURL(LOIC_SRC).href)
const matthieu = await import(pathToFileURL(MAT_SRC).href)
const thelma = await import(pathToFileURL(THELMA_SRC).href)

emitFile('loic', loic)
emitFile('matthieu', matthieu)
emitFile('thelma', thelma)
