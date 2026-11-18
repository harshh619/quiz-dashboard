import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateCertificatePdfBuffer } from '@/lib/certificatePdf'
import { ensureCompetitionAutoFinalized, PRODUCTION_APP_URL } from '@/lib/autoFinalize'

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

    const { data: attempt, error: attErr } = await admin
      .from('quiz_attempts')
      .select('*, student:profiles(*)')
      .eq('id', attemptId)
      .single()

    if (attErr || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Security check: student owns attempt or viewer is admin
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

    // Ensure auto-finalization has run if exam end time has passed
    await ensureCompetitionAutoFinalized(attempt.competition_id)

    const { data: cert } = await admin
      .from('certificates')
      .select('*')
      .eq('attempt_id', attemptId)
      .maybeSingle()

    if (!cert) {
      return NextResponse.json(
        { error: 'Certificate is not yet issued. It will unlock automatically once the quiz window ends and rankings are finalized.' },
        { status: 409 }
      )
    }

    const verificationUrl = `${PRODUCTION_APP_URL}/verify/${cert.certificate_number}`
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

    const pdfBuffer = await generateCertificatePdfBuffer({
      studentName: attempt.student?.full_name || 'Participant',
      collegeName: attempt.student?.college_name || '',
      course: attempt.student?.course || '',
      certificateNumber: cert.certificate_number,
      certificateType: cert.certificate_type || 'participation',
      verificationUrl,
      score: attempt.score ?? 0,
      totalQuestions: attempt.total_questions ?? 30,
      dateStr: issuedDateStr,
    })

    const safeFileName = `AMR_Certificate_${cert.certificate_number.replace(/[^A-Za-z0-9_-]/g, '')}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate PDF'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
