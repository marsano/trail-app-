import type { ProgramId } from '@/lib/registry'
import type { GarminTokensPayload } from '@/lib/garmin-types'
import type { SessionEdit } from '@/lib/session-customization'

export type GarminConnectResponse = {
  success?: boolean
  error?: string
  tokens?: GarminTokensPayload
  synced?: string[]
}

export async function postGarminConnect(
  body: Record<string, unknown>
): Promise<{ ok: boolean; data: GarminConnectResponse; status: number }> {
  const res = await fetch('/api/garmin/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as GarminConnectResponse
  return { ok: res.ok, data, status: res.status }
}

export function buildGarminSyncBody(opts: {
  email: string
  password?: string
  garminTokens: GarminTokensPayload | null
  programId: ProgramId
  sessionIds?: string[]
  dateOverrides: Record<string, string>
  sessionEdits: Record<string, SessionEdit>
  dryRun?: boolean
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    email: opts.email,
    programId: opts.programId,
    dateOverrides: opts.dateOverrides,
    dryRun: opts.dryRun === true,
  }
  if (opts.sessionIds && opts.sessionIds.length > 0) {
    body.sessionIds = opts.sessionIds
  }
  if (opts.garminTokens) body.garminTokens = opts.garminTokens
  if (opts.password) body.password = opts.password
  if (Object.keys(opts.sessionEdits).length > 0) {
    body.sessionEdits = opts.sessionEdits
  }
  return body
}
