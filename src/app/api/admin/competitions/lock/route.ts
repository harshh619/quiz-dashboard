import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLockedCompetitionIds, setCompetitionLocked } from '@/lib/protectedCompetitions'

export const dynamic = 'force-dynamic'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin' || user.email === 'msunagpur@gmail.com') {
    return user
  }
  return null
}

export async function GET() {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const lockedIds = await getLockedCompetitionIds()
    return NextResponse.json({ lockedIds })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load locked competitions'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { competitionId, locked } = await request.json()
    if (!competitionId || typeof locked !== 'boolean') {
      return NextResponse.json(
        { error: 'competitionId and locked (boolean) are required' },
        { status: 400 }
      )
    }

    const lockedIds = await setCompetitionLocked(competitionId, locked)
    return NextResponse.json({
      success: true,
      lockedIds,
      message: locked
        ? 'Competition LOCKED! All its participants, scores, and certificates are now 100% protected from deletion or Clear Test Data.'
        : 'Competition unlocked.',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update lock status'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
