import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isProfileComplete } from '@/lib/profileValidation'
import { getLockedCompetitionIds, getProtectedStudentIds } from '@/lib/protectedCompetitions'

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

async function deleteStudentCompletely(admin: ReturnType<typeof createAdminClient>, studentId: string, studentEmail?: string) {
  try {
    // 1. Find attempts for this student to delete responses & attempt_questions cleanly
    const { data: attempts } = await admin
      .from('quiz_attempts')
      .select('id')
      .eq('student_id', studentId)

    const attemptIds = (attempts || []).map((a) => a.id)
    if (attemptIds.length > 0) {
      await admin.from('quiz_responses').delete().in('attempt_id', attemptIds)
      await admin.from('attempt_questions').delete().in('attempt_id', attemptIds)
    }
  } catch (err) {
    console.error(`Error deleting attempts for student ${studentId}:`, err)
  }

  try {
    // 2. Delete certificates, results, attempts, registrations
    await admin.from('certificates').delete().eq('student_id', studentId)
    await admin.from('competition_results').delete().eq('student_id', studentId)
    await admin.from('quiz_attempts').delete().eq('student_id', studentId)
    await admin.from('registrations').delete().eq('student_id', studentId)
  } catch (err) {
    console.error(`Error deleting results/certificates for student ${studentId}:`, err)
  }

  try {
    // 3. Delete email jobs associated with this student email
    if (studentEmail) {
      await admin.from('email_jobs').delete().eq('to_email', studentEmail)
    }
  } catch (err) {
    console.error(`Error deleting email jobs for student ${studentId}:`, err)
  }

  try {
    // 4. Delete profile row
    await admin.from('profiles').delete().eq('id', studentId)
  } catch (err) {
    console.error(`Error deleting profile for student ${studentId}:`, err)
  }

  try {
    // 5. Delete Supabase Auth user so they can log in fresh and re-register anytime with same email
    await admin.auth.admin.deleteUser(studentId)
  } catch (err) {
    console.error(`Error deleting auth user ${studentId}:`, err)
  }
}

// GET: List all registered student participants
export async function GET() {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const admin = createAdminClient()

    const [{ data: profiles, error }, { data: regs }, { data: attempts }, { data: competitions }] = await Promise.all([
      admin
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .neq('email', 'msunagpur@gmail.com')
        .order('created_at', { ascending: false }),
      admin.from('registrations').select('student_id'),
      admin
        .from('quiz_attempts')
        .select('student_id, competition_id, status, score, total_questions, submitted_at, created_at')
        .order('created_at', { ascending: false }),
      admin.from('competitions').select('id, status, scheduled_end'),
    ])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const nowMs = Date.now()
    const compMap = new Map<string, { status: string; scheduled_end: string | null }>()
    for (const c of competitions || []) {
      compMap.set(c.id, { status: c.status, scheduled_end: c.scheduled_end })
    }

    const isCompTimedOut = (compId: string): { unlocked: boolean; endIso: string | null } => {
      const c = compMap.get(compId)
      if (!c) return { unlocked: true, endIso: null }
      const endMs = c.scheduled_end ? new Date(c.scheduled_end).getTime() : 0
      const ended =
        c.status === 'closed' ||
        c.status === 'results_published' ||
        (endMs > 0 && nowMs >= endMs)
      return { unlocked: ended, endIso: c.scheduled_end }
    }

    const regCountMap: Record<string, number> = {}
    for (const r of regs || []) {
      regCountMap[r.student_id] = (regCountMap[r.student_id] || 0) + 1
    }

    const attemptMap: Record<
      string,
      {
        count: number
        latestStatus: 'registered' | 'in_progress' | 'submitted' | 'timed_out'
        latestScore: number | null
        latestTotal: number | null
        submittedAt: string | null
        scoreUnlocked: boolean
        scoreLockedUntil: string | null
      }
    > = {}

    for (const a of attempts || []) {
      if (!attemptMap[a.student_id]) {
        const { unlocked, endIso } = isCompTimedOut(a.competition_id)
        const isDone = a.status === 'submitted' || a.status === 'timed_out'
        attemptMap[a.student_id] = {
          count: 0,
          latestStatus: (a.status as 'in_progress' | 'submitted' | 'timed_out') || 'registered',
          latestScore: isDone && unlocked && a.score !== null && a.score !== undefined ? a.score : null,
          latestTotal: a.total_questions ?? 30,
          submittedAt: a.submitted_at || null,
          scoreUnlocked: unlocked,
          scoreLockedUntil: isDone && !unlocked ? endIso : null,
        }
      }
      attemptMap[a.student_id].count += 1
    }

    const lockedCompIds = await getLockedCompetitionIds()
    const protectedStudentIds = await getProtectedStudentIds(admin, lockedCompIds)

    const completedProfiles = (profiles || []).filter((p) => isProfileComplete(p))

    const participants = completedProfiles.map((p) => {
      const att = attemptMap[p.id]
      return {
        ...p,
        registrations_count: regCountMap[p.id] || 0,
        attempts_count: att?.count || 0,
        attempt_status: att?.latestStatus || 'registered',
        submitted_at: att?.submittedAt || null,
        latest_score: att?.latestScore ?? null,
        latest_total: att?.latestTotal ?? null,
        score_unlocked: att ? att.scoreUnlocked : true,
        score_locked_until: att?.scoreLockedUntil || null,
        is_protected: protectedStudentIds.has(p.id),
      }
    })

    return NextResponse.json({
      participants,
      serverTime: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE: Delete a single participant (?id=...) or all non-admin participants (?all=true)
export async function DELETE(request: Request) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const deleteAll = searchParams.get('all') === 'true'
    const admin = createAdminClient()

    const lockedCompIds = await getLockedCompetitionIds()
    const protectedStudentIds = await getProtectedStudentIds(admin, lockedCompIds)

    if (deleteAll) {
      const { data: students } = await admin
        .from('profiles')
        .select('id, email, role')
        .neq('role', 'admin')
        .neq('email', 'msunagpur@gmail.com')

      let deletedCount = 0
      let skippedProtected = 0
      for (const s of students || []) {
        if (protectedStudentIds.has(s.id)) {
          skippedProtected++
          continue
        }
        await deleteStudentCompletely(admin, s.id, s.email)
        deletedCount++
      }

      // Sweep any remaining non-admin auth.users that are not protected
      try {
        const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
        for (const u of authData?.users || []) {
          if (u.email === 'msunagpur@gmail.com') continue
          if (protectedStudentIds.has(u.id)) continue
          try {
            await admin.auth.admin.deleteUser(u.id)
          } catch {}
        }
      } catch (authSweepErr) {
        console.error('Error sweeping auth.users:', authSweepErr)
      }

      const protectNote =
        skippedProtected > 0
          ? ` (${skippedProtected} official participant(s) from 🔒 Locked Competition(s) were kept 100% safe!)`
          : ''

      return NextResponse.json({
        success: true,
        deletedCount,
        skippedProtected,
        message: `${deletedCount} test participant(s) deleted.${protectNote}`,
      })
    }

    if (!id) {
      return NextResponse.json({ error: 'Participant id is required' }, { status: 400 })
    }

    if (protectedStudentIds.has(id)) {
      return NextResponse.json(
        { error: '🔒 This participant belongs to a Locked Official Competition and cannot be deleted. Unlock that competition first if you really want to remove them.' },
        { status: 400 }
      )
    }

    // Protect admin accounts
    const { data: target } = await admin
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('id', id)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    if (target.role === 'admin' || target.email === 'msunagpur@gmail.com') {
      return NextResponse.json({ error: 'Admin accounts cannot be deleted' }, { status: 400 })
    }

    await deleteStudentCompletely(admin, target.id, target.email)

    return NextResponse.json({
      success: true,
      message: `Participant "${target.full_name || target.email}" deleted successfully. They can now re-register fresh anytime.`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
