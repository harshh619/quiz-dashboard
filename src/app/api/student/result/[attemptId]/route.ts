import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ensureCompetitionAutoFinalized,
  autoSendPendingCertificateEmailForCert,
  FINALIZE_GRACE_SECONDS,
} from '@/lib/autoFinalize'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Fetch attempt with competition & student profile
    const { data: attempt, error: attErr } = await admin
      .from('quiz_attempts')
      .select('*, competition:competitions(*), student:profiles(*)')
      .eq('id', attemptId)
      .single()

    if (attErr || !attempt) {
      return NextResponse.json({ error: 'Quiz attempt not found' }, { status: 404 })
    }

    // Security check: student can only view own attempt (admins can view any)
    if (attempt.student_id !== user.id) {
      const { data: viewerProfile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const isAdmin = viewerProfile?.role === 'admin' || user.email === 'msunagpur@gmail.com'
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Auto-finalize competition if exam window has ended (+ grace buffer)
    const { finalized, unlockAtIso } = await ensureCompetitionAutoFinalized(attempt.competition_id)

    // Fetch responses, issued certificate, and rank in parallel
    const [{ data: responses }, { data: cert }, { data: compResult }] = await Promise.all([
      admin
        .from('quiz_responses')
        .select('selected_option, question:question_bank(id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic)')
        .eq('attempt_id', attemptId),
      admin
        .from('certificates')
        .select('*')
        .eq('attempt_id', attemptId)
        .maybeSingle(),
      admin
        .from('competition_results')
        .select('rank, is_winner, certificate_type')
        .eq('attempt_id', attemptId)
        .maybeSingle(),
    ])

    // If finalized & certificate exists, automatically dispatch this student's pending email once (atomic lock prevents duplicates)
    if (cert && attempt.student?.email) {
      void autoSendPendingCertificateEmailForCert({
        studentEmail: attempt.student.email,
        studentName: attempt.student.full_name || 'Participant',
        collegeName: attempt.student.college_name || '',
        course: attempt.student.course || '',
        certificateNumber: cert.certificate_number,
        certificateType: cert.certificate_type || 'participation',
        score: attempt.score ?? 0,
        totalQuestions: attempt.total_questions ?? 30,
      }).catch((e) => console.error('Background auto-email error:', e))
    }

    const scheduledEnd = attempt.competition?.scheduled_end
    const computedUnlockAt =
      unlockAtIso ||
      (scheduledEnd
        ? new Date(new Date(scheduledEnd).getTime() + FINALIZE_GRACE_SECONDS * 1000).toISOString()
        : null)

    return NextResponse.json({
      attempt,
      profile: attempt.student,
      competition: attempt.competition,
      certificate: cert || null,
      rank: compResult?.rank ?? attempt.rank ?? null,
      isWinner: compResult?.is_winner ?? false,
      responses: responses || [],
      isFinalized: finalized || Boolean(cert),
      unlockAt: computedUnlockAt,
      serverTime: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
