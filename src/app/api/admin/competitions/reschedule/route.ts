import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function POST(request: Request) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { competitionId, scheduledStart, durationMinutes, status, resetAttempts } = body

    if (!competitionId || !scheduledStart) {
      return NextResponse.json({ error: 'competitionId and scheduledStart are required' }, { status: 400 })
    }

    const startTime = new Date(scheduledStart)
    if (isNaN(startTime.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledStart date' }, { status: 400 })
    }

    const durationMin = Math.max(1, Number(durationMinutes) || 10)
    const durationSeconds = durationMin * 60
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000)

    const admin = createAdminClient()

    // 1. Update competition schedule in DB
    const updatePayload: Record<string, unknown> = {
      scheduled_start: startTime.toISOString(),
      scheduled_end: endTime.toISOString(),
      duration_seconds: durationSeconds,
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updatePayload.status = status
    }

    const { data: updatedComp, error: updateError } = await admin
      .from('competitions')
      .update(updatePayload)
      .eq('id', competitionId)
      .select()
      .single()

    if (updateError) throw updateError

    // 2. If resetAttempts requested, delete prior attempts so admin/testers can re-attempt fresh
    let attemptsResetCount = 0
    if (resetAttempts) {
      const { data: deletedAttempts } = await admin
        .from('quiz_attempts')
        .delete()
        .eq('competition_id', competitionId)
        .select('id')

      attemptsResetCount = deletedAttempts?.length || 0
    }

    return NextResponse.json({
      success: true,
      competition: updatedComp,
      attemptsResetCount,
      message: `Quiz rescheduled successfully! ${resetAttempts ? `(${attemptsResetCount} test attempt(s) reset for fresh re-attempt).` : ''}`,
    })
  } catch (err: unknown) {
    console.error('Reschedule competition error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to reschedule competition'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
