export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({
    ok: true,
    server: 'trail-plan',
    garminSession:
      'Aucune session Garmin stockée sur ce serveur — les identifiants ne sont jamais persistés.',
  })
}
