import { GarminConnect } from 'garmin-connect'
import axios from 'axios'
import { getProgramBundle, type ProgramId } from '@/lib/registry'
import { resolveSessionDate } from '@/lib/plan-helpers'
import {
  sessionToGarminRunningPayload,
  shouldSkipGarminSync,
} from '@/lib/garmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SCHEDULE_BASE = 'https://connectapi.garmin.com/workout-service/schedule'

function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const st = e.response?.status
    const data = e.response?.data
    if (st === 401 || st === 403)
      return 'Identifiants Garmin invalides ou session refusée.'
    if (st === 429)
      return 'Trop de requêtes Garmin — réessaie dans quelques minutes.'
    if (typeof data === 'object' && data !== null && 'message' in data) {
      return String((data as { message: unknown }).message)
    }
    return e.message
  }
  if (e instanceof Error) return e.message
  return String(e)
}

interface ConnectBody {
  email?: string
  password?: string
  sessionIds?: string[]
  dryRun?: boolean
  dateOverrides?: Record<string, string>
  programId?: string
}

function parseProgramId(raw: unknown): ProgramId | null {
  if (raw === 'matthieu' || raw === 'loic') return raw
  return null
}

function findSession(programId: ProgramId, id: string) {
  return getProgramBundle(programId).plan.find((s) => s.id === id)
}

function parseOverrides(raw: unknown): Record<string, string> {
  if (raw === null || raw === undefined || typeof raw !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      out[k] = v
    }
  }
  return out
}

export async function POST(req: Request) {
  let body: ConnectBody
  try {
    body = (await req.json()) as ConnectBody
  } catch {
    return Response.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) {
    return Response.json(
      { error: 'Email et mot de passe requis' },
      { status: 400 }
    )
  }

  const dryRun = body.dryRun === true
  const programId = parseProgramId(body.programId)
  if (!programId) {
    return Response.json(
      { error: 'programId requis (matthieu ou loic)' },
      { status: 400 }
    )
  }

  const dateOverrides = parseOverrides(body.dateOverrides)

  const sessionIdsRaw = body.sessionIds
  const sessionIds =
    Array.isArray(sessionIdsRaw) &&
    sessionIdsRaw.every((x) => typeof x === 'string')
      ? sessionIdsRaw
      : undefined

  if (!dryRun && sessionIds === undefined) {
    return Response.json(
      { error: 'sessionIds requis pour la synchronisation' },
      { status: 400 }
    )
  }

  let client: InstanceType<typeof GarminConnect>
  try {
    client = new GarminConnect({ username: email, password })
    await client.login(email, password)
    await client.getUserProfile()
  } catch (e: unknown) {
    return Response.json(
      { error: errMsg(e) || 'Connexion Garmin impossible' },
      { status: 401 }
    )
  }

  if (dryRun) {
    return Response.json({ success: true as const, synced: [] as string[] })
  }

  const synced: string[] = []

  for (const id of sessionIds!) {
    const session = findSession(programId, id)
    if (!session) {
      return Response.json({ error: `Séance inconnue: ${id}` }, { status: 400 })
    }
    if (shouldSkipGarminSync(session)) continue

    const dateStr = resolveSessionDate(session, dateOverrides)
    const { name, description, meters } = sessionToGarminRunningPayload(session)

    try {
      const created = await client.addRunningWorkout(name, meters, description)
      const wid = created.workoutId
      if (wid == null) {
        return Response.json(
          { error: 'Garmin n’a pas renvoyé d’identifiant workout' },
          { status: 502 }
        )
      }
      await client.client.post(
        `${SCHEDULE_BASE}/${String(wid)}`,
        { date: dateStr },
        {}
      )
      synced.push(id)
    } catch (e: unknown) {
      const msg = errMsg(e)
      const low = msg.toLowerCase()
      if (
        low.includes('duplicate') ||
        low.includes('already') ||
        low.includes('exist')
      ) {
        return Response.json(
          {
            error:
              'Conflit Garmin : workout ou planning déjà présent. Supprime l’entrée existante ou change la date.',
            detail: msg,
          },
          { status: 409 }
        )
      }
      return Response.json(
        { error: msg || 'Erreur lors de la création du workout' },
        { status: 502 }
      )
    }
  }

  return Response.json({ success: true as const, synced })
}
