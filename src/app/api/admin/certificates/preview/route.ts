import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCertificatePdfBuffer } from '@/lib/certificatePdf'
import { PRODUCTION_APP_URL } from '@/lib/autoFinalize'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && user.email !== 'msunagpur@gmail.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const certType = searchParams.get('type') || 'first_prize'

    const pdfBuffer = await generateCertificatePdfBuffer({
      studentName: 'Sample Participant Name',
      collegeName: 'Government College of Pharmacy, Nagpur',
      course: 'B.Pharm',
      certificateNumber: 'AMR-WAAW-2026-SAMPLE',
      certificateType: certType,
      verificationUrl: `${PRODUCTION_APP_URL}/verify/AMR-WAAW-2026-SAMPLE`,
      score: 28,
      totalQuestions: 30,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Sample_Certificate_${certType}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate preview PDF'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
