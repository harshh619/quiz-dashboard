import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PRODUCTION_APP_URL = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')
  ? process.env.NEXT_PUBLIC_APP_URL
  : 'https://quiz-msu-nagpur.vercel.app'

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

export async function POST(request: Request) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    const { competitionId } = await request.json()
    if (!competitionId) {
      return NextResponse.json({ error: 'competitionId is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 0. Auto-submit any lingering in_progress OR un-scored attempts (e.g. lost connection / timed out)
    const { data: openAttempts } = await admin
      .from('quiz_attempts')
      .select('id, student_id')
      .eq('competition_id', competitionId)
      .or('status.eq.in_progress,score.is.null')

    if (openAttempts && openAttempts.length > 0) {
      await Promise.all(
        openAttempts.map((att) =>
          admin.rpc('submit_quiz_attempt', {
            p_attempt_id: att.id,
            p_student_id: att.student_id,
          })
        )
      )
    }

    // 1. Run finalize_competition RPC
    const { data: rpcResult, error: rpcError } = await admin.rpc('finalize_competition', {
      p_competition_id: competitionId,
    })
    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 })
    }

    // 2. Fix any localhost verification URLs in certificates for this competition
    const { data: certs } = await admin
      .from('certificates')
      .select('id, certificate_number, qr_verification_url')
      .eq('competition_id', competitionId)

    if (certs) {
      for (const cert of certs) {
        const expectedUrl = `${PRODUCTION_APP_URL}/verify/${cert.certificate_number}`
        if (cert.qr_verification_url !== expectedUrl) {
          await admin
            .from('certificates')
            .update({ qr_verification_url: expectedUrl })
            .eq('id', cert.id)
        }
      }
    }

    // 3. Deduplicate email_jobs by (type, to_email, certificate_number)
    // Prefer keeping already 'sent' job so re-finalizing NEVER emails a student twice!
    const { data: allJobs } = await admin
      .from('email_jobs')
      .select('*')
      .order('created_at', { ascending: true })

    let removedDuplicates = 0
    if (allJobs && allJobs.length > 0) {
      const grouped = new Map<string, any[]>()

      for (const job of allJobs) {
        const certNum =
          job.payload?.certificate_number ||
          job.payload?.certificateNumber ||
          ''
        const key = `${job.type}::${(job.to_email || '').toLowerCase()}::${certNum}`
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key)!.push(job)
      }

      const idsToDelete: string[] = []
      for (const [, list] of grouped.entries()) {
        if (list.length <= 1) continue
        // Pick the best row to keep: 'sent' first, otherwise oldest row
        const sentRow = list.find((j) => j.status === 'sent')
        const keepRow = sentRow || list[0]
        for (const row of list) {
          if (row.id !== keepRow.id) {
            idsToDelete.push(row.id)
          }
        }
      }

      if (idsToDelete.length > 0) {
        await admin.from('email_jobs').delete().in('id', idsToDelete)
        removedDuplicates = idsToDelete.length
      }

      // Fix localhost URL inside remaining pending email job payloads
      for (const job of allJobs) {
        if (idsToDelete.includes(job.id)) continue
        const certNum = job.payload?.certificate_number
        if (
          certNum &&
          typeof job.payload?.verification_url === 'string' &&
          job.payload.verification_url.includes('localhost')
        ) {
          await admin
            .from('email_jobs')
            .update({
              payload: {
                ...job.payload,
                verification_url: `${PRODUCTION_APP_URL}/verify/${certNum}`,
              },
            })
            .eq('id', job.id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      total_finalized: rpcResult?.total_finalized ?? 0,
      removed_duplicates: removedDuplicates,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
