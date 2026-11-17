import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendCertificateEmail } from '@/lib/mailer'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attemptId } = await request.json()
    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 })
    }

    // Fetch attempt details
    const { data: attempt, error: attError } = await supabase
      .from('quiz_attempts')
      .select('*, student:profiles(*), competition:competitions(*)')
      .eq('id', attemptId)
      .single()

    if (attError || !attempt) {
      return NextResponse.json({ error: 'Quiz attempt not found' }, { status: 404 })
    }

    // Fetch or find certificate
    const { data: cert } = await supabase
      .from('certificates')
      .select('*')
      .eq('attempt_id', attemptId)
      .single()

    const certNumber = cert?.certificate_number || `AMR-WAAW-2026-${attempt.id.slice(0, 6).toUpperCase()}`
    const verificationUrl = `${new URL(request.url).origin}/verify/${certNumber}`

    const result = await sendCertificateEmail({
      to: attempt.student.email,
      studentName: attempt.student.full_name || 'Participant',
      certificateNumber: certNumber,
      verificationUrl,
      score: attempt.score,
      totalQuestions: attempt.total_questions || 30,
    })

    // Log to email_jobs table
    await supabase.from('email_jobs').insert({
      type: 'certificate',
      to_email: attempt.student.email,
      to_name: attempt.student.full_name || 'Participant',
      subject: `Official Certificate - ${certNumber}`,
      status: result.success ? 'sent' : 'failed',
      error_message: result.success ? null : (result.reason || 'Failed to dispatch email'),
      payload: {
        certificateNumber: certNumber,
        verificationUrl,
        sentFrom: 'msunagpur@gmail.com',
      },
      last_attempted_at: new Date().toISOString(),
    })

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Error in send-certificate API:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
