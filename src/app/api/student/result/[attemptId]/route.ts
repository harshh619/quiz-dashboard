import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ensureCompetitionAutoFinalized,
  autoSendPendingCertificateEmailForCert,
  FINALIZE_GRACE_SECONDS,
} from '@/lib/autoFinalize'
import { buildSignedQrVerificationUrl } from '@/lib/certificateQr'

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

    const scheduledEnd = attempt.competition?.scheduled_end
    const scheduledEndMs = scheduledEnd ? new Date(scheduledEnd).getTime() : 0
    const compStatus = attempt.competition?.status
    const isCompetitionEnded =
      compStatus === 'closed' ||
      compStatus === 'results_published' ||
      (scheduledEndMs > 0 && Date.now() >= scheduledEndMs)

    // Fetch issued certificate and rank in parallel first
    const [{ data: cert }, { data: compResult }] = await Promise.all([
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

    // Anti-cheating lock: NEVER expose score, accuracy, or answer keys until the competition timer ends (or admin publishes results)
    const answerKeyUnlocked = isCompetitionEnded || finalized || Boolean(cert)
    const scoreUnlocked = answerKeyUnlocked

    let responses: unknown[] = []
    if (answerKeyUnlocked) {
      const { data: respRows } = await admin
        .from('quiz_responses')
        .select('selected_option, question:question_bank(id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic)')
        .eq('attempt_id', attemptId)
      responses = respRows || []
    }

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

    const computedUnlockAt =
      unlockAtIso ||
      (scheduledEnd
        ? new Date(new Date(scheduledEnd).getTime() + FINALIZE_GRACE_SECONDS * 1000).toISOString()
        : null)

    let qrPayload: string | null = null
    let authCode: string | null = null
    if (cert) {
      const issuedDateStr = cert.issued_at
        ? new Date(cert.issued_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
      const built = await buildSignedQrVerificationUrl({
        studentName: attempt.student?.full_name || 'Participant',
        collegeName: attempt.student?.college_name || '',
        course: attempt.student?.course || '',
        certificateNumber: cert.certificate_number,
        certificateType: cert.certificate_type || 'participation',
        score: attempt.score ?? 0,
        totalQuestions: attempt.total_questions ?? 30,
        dateStr: issuedDateStr,
        eventName: attempt.competition?.title || 'World AMR Awareness Week (WAAW) 2026',
      })
      qrPayload = built.qrUrl
      authCode = built.authCode
    }

    const safeAttempt = scoreUnlocked
      ? attempt
      : { ...attempt, score: null, rank: null }

    return NextResponse.json({
      attempt: safeAttempt,
      profile: attempt.student,
      competition: attempt.competition,
      certificate: cert || null,
      qrPayload,
      authCode,
      rank: scoreUnlocked ? (compResult?.rank ?? attempt.rank ?? null) : null,
      isWinner: scoreUnlocked ? (compResult?.is_winner ?? false) : false,
      responses,
      scoreUnlocked,
      answerKeyUnlocked,
      isFinalized: finalized || Boolean(cert),
      unlockAt: computedUnlockAt,
      serverTime: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
