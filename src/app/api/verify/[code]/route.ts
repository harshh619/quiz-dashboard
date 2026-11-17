import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Query certificate with student and competition info
    const { data: cert, error: certError } = await adminClient
      .from('certificates')
      .select('*, student:profiles(*), competition:competitions(*)')
      .eq('certificate_number', code.trim())
      .single()

    if (certError || !cert) {
      return NextResponse.json({ error: 'Certificate record not found or code is invalid.' }, { status: 404 })
    }

    // Also fetch score from attempt if available
    const { data: attempt } = await adminClient
      .from('quiz_attempts')
      .select('score, total_questions')
      .eq('id', cert.attempt_id)
      .single()

    return NextResponse.json({
      certificate: cert,
      score: attempt?.score ?? null,
      totalQuestions: attempt?.total_questions ?? null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
