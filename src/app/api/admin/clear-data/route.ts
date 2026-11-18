import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLockedCompetitionIds, getProtectedStudentIds } from '@/lib/protectedCompetitions'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || user.email === 'msunagpur@gmail.com'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can clear test data' }, { status: 403 })
    }

    const { clearStudents } = await request.json().catch(() => ({ clearStudents: false }))
    const admin = createAdminClient()

    // Identify LOCKED official competitions so their data & certificates are NEVER deleted!
    const lockedCompIds = await getLockedCompetitionIds()
    const lockedSet = new Set(lockedCompIds)

    const { data: allComps } = await admin.from('competitions').select('id, status')
    const unlockedCompIds = (allComps || [])
      .filter((c) => !lockedSet.has(c.id))
      .map((c) => c.id)

    // Collect protected certificate numbers & protected student IDs from locked competitions
    const protectedCertNumbers = new Set<string>()
    if (lockedCompIds.length > 0) {
      const { data: lockedCerts } = await admin
        .from('certificates')
        .select('certificate_number')
        .in('competition_id', lockedCompIds)
      for (const c of lockedCerts || []) {
        if (c.certificate_number) protectedCertNumbers.add(c.certificate_number)
      }
    }

    const protectedStudentIds = await getProtectedStudentIds(admin, lockedCompIds)

    // Delete ONLY records belonging to UNLOCKED competitions
    if (unlockedCompIds.length > 0) {
      const { data: unlockedAttempts } = await admin
        .from('quiz_attempts')
        .select('id')
        .in('competition_id', unlockedCompIds)

      const unlockedAttemptIds = (unlockedAttempts || []).map((a) => a.id)

      await admin.from('certificates').delete().in('competition_id', unlockedCompIds)
      await admin.from('competition_results').delete().in('competition_id', unlockedCompIds)

      if (unlockedAttemptIds.length > 0) {
        await admin.from('quiz_responses').delete().in('attempt_id', unlockedAttemptIds)
        await admin.from('attempt_questions').delete().in('attempt_id', unlockedAttemptIds)
      }

      await admin.from('quiz_attempts').delete().in('competition_id', unlockedCompIds)
      await admin.from('registrations').delete().in('competition_id', unlockedCompIds)

      // Reset non-draft unlocked competitions back to 'scheduled'
      await admin
        .from('competitions')
        .update({ status: 'scheduled' })
        .in('id', unlockedCompIds)
        .neq('status', 'draft')
    }

    // Delete ONLY email_jobs that do NOT belong to a locked official certificate
    const { data: allEmailJobs } = await admin.from('email_jobs').select('id, payload')
    const emailIdsToDelete = (allEmailJobs || [])
      .filter((j) => {
        const certNum = j.payload?.certificate_number || j.payload?.certificateNumber || ''
        return !certNum || !protectedCertNumbers.has(certNum)
      })
      .map((j) => j.id)

    if (emailIdsToDelete.length > 0) {
      await admin.from('email_jobs').delete().in('id', emailIdsToDelete)
    }

    // If requested to clear test student profiles, keep admin AND all students in locked competitions 100% safe!
    if (clearStudents) {
      const { data: students } = await admin
        .from('profiles')
        .select('id')
        .neq('role', 'admin')
        .neq('email', 'msunagpur@gmail.com')

      const deletableStudentIds = (students || [])
        .map((s) => s.id)
        .filter((id) => !protectedStudentIds.has(id))

      if (deletableStudentIds.length > 0) {
        await admin.from('profiles').delete().in('id', deletableStudentIds)
        for (const sid of deletableStudentIds) {
          await admin.auth.admin.deleteUser(sid)
        }
      }
    }

    const lockedNotice =
      lockedCompIds.length > 0
        ? ` (${lockedCompIds.length} 🔒 Locked Official Competition(s) and their ${protectedStudentIds.size} participant record(s)/certificates were kept 100% safe!)`
        : ''

    return NextResponse.json({
      success: true,
      protectedCompetitions: lockedCompIds.length,
      protectedStudents: protectedStudentIds.size,
      message: `Test quiz data cleared successfully!${lockedNotice}`,
    })
  } catch (err: any) {
    console.error('Error clearing test data:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
