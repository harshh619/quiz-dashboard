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

    const { jobId } = await request.json()
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    // Fetch the email job
    const { data: job, error: jobErr } = await supabase
      .from('email_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Email job not found' }, { status: 404 })
    }

    const payload = job.payload || {}
    const certNumber = payload.certificateNumber || 'AMR-WAAW-2026'
    const verificationUrl = payload.verificationUrl || `${new URL(request.url).origin}/verify/${certNumber}`
    const score = payload.score ?? 0
    const totalQuestions = payload.totalQuestions ?? 30

    // Dispatch email
    const result = await sendCertificateEmail({
      to: job.to_email,
      studentName: job.to_name || 'Participant',
      certificateNumber: certNumber,
      verificationUrl,
      score,
      totalQuestions,
    })

    // Update job status
    await supabase
      .from('email_jobs')
      .update({
        status: result.success ? 'sent' : 'failed',
        error_message: result.success ? null : (result.reason || 'Failed to dispatch email'),
        last_attempted_at: new Date().toISOString(),
        attempts: (job.attempts || 0) + 1,
      })
      .eq('id', jobId)

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Error in resend email API:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
