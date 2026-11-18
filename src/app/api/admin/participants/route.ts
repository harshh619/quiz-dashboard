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

async function deleteStudentCompletely(admin: ReturnType<typeof createAdminClient>, studentId: string, studentEmail?: string) {
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

  // 2. Delete certificates, results, attempts, registrations
  await admin.from('certificates').delete().eq('student_id', studentId)
  await admin.from('competition_results').delete().eq('student_id', studentId)
  await admin.from('quiz_attempts').delete().eq('student_id', studentId)
  await admin.from('registrations').delete().eq('student_id', studentId)

  // 3. Delete email jobs associated with this student email
  if (studentEmail) {
    await admin.from('email_jobs').delete().eq('to_email', studentEmail)
  }

  // 4. Delete profile row
  await admin.from('profiles').delete().eq('id', studentId)

  // 5. Delete Supabase Auth user so next year they can log in fresh and re-register with updated Year/Semester
  await admin.auth.admin.deleteUser(studentId)
}

// GET: List all registered student participants
export async function GET() {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const admin = createAdminClient()

    const [{ data: profiles, error }, { data: regs }, { data: attempts }] = await Promise.all([
      admin
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .neq('email', 'msunagpur@gmail.com')
        .order('created_at', { ascending: false }),
      admin.from('registrations').select('student_id'),
      admin.from('quiz_attempts').select('student_id, status, score, total_questions'),
    ])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const regCountMap: Record<string, number> = {}
    for (const r of regs || []) {
      regCountMap[r.student_id] = (regCountMap[r.student_id] || 0) + 1
    }

    const attemptMap: Record<string, { count: number; latestScore: number | null; latestTotal: number | null }> = {}
    for (const a of attempts || []) {
      if (!attemptMap[a.student_id]) {
        attemptMap[a.student_id] = { count: 0, latestScore: null, latestTotal: null }
      }
      attemptMap[a.student_id].count += 1
      if (a.score !== null && a.score !== undefined) {
        attemptMap[a.student_id].latestScore = a.score
        attemptMap[a.student_id].latestTotal = a.total_questions ?? 30
      }
    }

    const participants = (profiles || []).map((p) => ({
      ...p,
      registrations_count: regCountMap[p.id] || 0,
      attempts_count: attemptMap[p.id]?.count || 0,
      latest_score: attemptMap[p.id]?.latestScore ?? null,
      latest_total: attemptMap[p.id]?.latestTotal ?? null,
    }))

    return NextResponse.json({ participants })
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

    if (deleteAll) {
      const { data: students } = await admin
        .from('profiles')
        .select('id, email, role')
        .neq('role', 'admin')
        .neq('email', 'msunagpur@gmail.com')

      let deletedCount = 0
      for (const s of students || []) {
        await deleteStudentCompletely(admin, s.id, s.email)
        deletedCount++
      }

      return NextResponse.json({
        success: true,
        deletedCount,
        message: `${deletedCount} registered participants deleted. They can now register fresh with updated academic details.`,
      })
    }

    if (!id) {
      return NextResponse.json({ error: 'Participant id is required' }, { status: 400 })
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
