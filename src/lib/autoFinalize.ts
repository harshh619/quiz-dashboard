import { createAdminClient } from '@/lib/supabase/admin'
import { sendCertificateEmail } from '@/lib/mailer'

export const FINALIZE_GRACE_SECONDS = 10

export const PRODUCTION_APP_URL = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')
  ? process.env.NEXT_PUBLIC_APP_URL
  : 'https://quiz-msu-nagpur.vercel.app'

/**
 * Deduplicates email_jobs by (type, to_email, certificate_number)
 * Always prefers keeping an already 'sent' or 'processing' row so nobody gets emailed twice.
 */
export async function deduplicateEmailJobs(admin = createAdminClient()): Promise<number> {
  const { data: allJobs } = await admin
    .from('email_jobs')
    .select('*')
    .order('created_at', { ascending: true })

  if (!allJobs || allJobs.length === 0) return 0

  const grouped = new Map<string, any[]>()
  for (const job of allJobs) {
    const certNum = job.payload?.certificate_number || job.payload?.certificateNumber || ''
    const key = `${job.type}::${(job.to_email || '').toLowerCase()}::${certNum}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(job)
  }

  const idsToDelete: string[] = []
  for (const [, list] of grouped.entries()) {
    if (list.length <= 1) continue
    const preferred =
      list.find((j) => j.status === 'sent') ||
      list.find((j) => j.status === 'processing') ||
      list[0]
    for (const row of list) {
      if (row.id !== preferred.id) idsToDelete.push(row.id)
    }
  }

  if (idsToDelete.length > 0) {
    await admin.from('email_jobs').delete().in('id', idsToDelete)
  }

  // Fix any localhost URLs in remaining payloads
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

  return idsToDelete.length
}

/**
 * Atomically auto-finalizes a competition once (scheduled_end + grace period) has passed.
 * Safe under 500 concurrent requests: uses PostgreSQL conditional UPDATE as a distributed lock.
 */
export async function ensureCompetitionAutoFinalized(competitionId: string): Promise<{
  finalized: boolean
  justFinalized: boolean
  unlockAtIso: string | null
}> {
  const admin = createAdminClient()

  const { data: comp } = await admin
    .from('competitions')
    .select('id, status, scheduled_end, certificate_enabled')
    .eq('id', competitionId)
    .single()

  if (!comp) {
    return { finalized: false, justFinalized: false, unlockAtIso: null }
  }

  const endMs = new Date(comp.scheduled_end).getTime()
  const unlockMs = endMs + FINALIZE_GRACE_SECONDS * 1000
  const unlockAtIso = new Date(unlockMs).toISOString()

  if (comp.status === 'results_published') {
    return { finalized: true, justFinalized: false, unlockAtIso }
  }

  if (comp.status === 'draft') {
    return { finalized: false, justFinalized: false, unlockAtIso }
  }

  // Not yet past scheduled_end + grace buffer
  if (Date.now() < unlockMs) {
    return { finalized: false, justFinalized: false, unlockAtIso }
  }

  // Atomic distributed lock: ONLY ONE caller out of 500 will flip status -> 'closed'
  const { data: claimed } = await admin
    .from('competitions')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', competitionId)
    .in('status', ['scheduled', 'waiting_room', 'active'])
    .select('id')

  if (!claimed || claimed.length === 0) {
    // Another request is currently finalizing; wait briefly and re-check
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 400))
      const { data: checkComp } = await admin
        .from('competitions')
        .select('status')
        .eq('id', competitionId)
        .single()
      if (checkComp?.status === 'results_published') {
        return { finalized: true, justFinalized: false, unlockAtIso }
      }
    }
    return { finalized: false, justFinalized: false, unlockAtIso }
  }

  try {
    // 1. Auto-submit any lingering in_progress OR un-scored attempts (e.g., students who lost connection / closed browser / timed out)
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

    // 2. Finalize leaderboard, assign 1st / 2nd / 3rd Prize & Participation certificates, set results_published
    const { error: rpcError } = await admin.rpc('finalize_competition', {
      p_competition_id: competitionId,
    })

    if (rpcError) {
      console.error('Auto-finalize RPC error:', rpcError)
      // Revert lock so it can retry
      await admin
        .from('competitions')
        .update({ status: 'scheduled', updated_at: new Date().toISOString() })
        .eq('id', competitionId)
      return { finalized: false, justFinalized: false, unlockAtIso }
    }

    // 3. Handle certificates and verification URLs
    if (comp.certificate_enabled === false) {
      // Certificates are strictly disabled for this competition:
      // Strip out any certificate records and cancel all certificate email jobs
      await admin
        .from('certificates')
        .delete()
        .eq('competition_id', competitionId)

      await admin
        .from('email_jobs')
        .delete()
        .eq('type', 'certificate')
    } else {
      // Fix any localhost QR verification URLs on issued certificates
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
    }

    // 4. Deduplicate email_jobs cleanly
    await deduplicateEmailJobs(admin)

    return { finalized: true, justFinalized: true, unlockAtIso }
  } catch (err) {
    console.error('Unexpected error in ensureCompetitionAutoFinalized:', err)
    return { finalized: false, justFinalized: false, unlockAtIso }
  }
}

/**
 * Atomically claims & sends a single student's pending certificate email (if not already sent).
 * Guarantees zero duplicate emails under concurrent requests.
 */
export async function autoSendPendingCertificateEmailForCert({
  studentEmail,
  studentName,
  collegeName,
  course,
  certificateNumber,
  certificateType,
  score,
  totalQuestions,
}: {
  studentEmail?: string
  studentName: string
  collegeName?: string
  course?: string
  certificateNumber: string
  certificateType: string
  score: number
  totalQuestions: number
}) {
  if (!studentEmail) return
  const admin = createAdminClient()

  // Find a pending or stale processing job matching this student & certificate number
  const { data: candidateJobs } = await admin
    .from('email_jobs')
    .select('id, payload, status, last_attempted_at')
    .eq('to_email', studentEmail)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: true })

  const matchingJob = (candidateJobs || []).find((j) => {
    const certNum = j.payload?.certificate_number || j.payload?.certificateNumber
    if (certNum !== certificateNumber) return false
    if (j.status === 'pending') return true
    if (j.status === 'processing') {
      const lastAttempt = j.last_attempted_at ? new Date(j.last_attempted_at).getTime() : 0
      return Date.now() - lastAttempt > 120_000 // 2 minutes stale recovery
    }
    return false
  })

  if (!matchingJob) return

  // Atomic claim: ONLY ONE request flips pending/stale-processing -> processing
  const { data: claimed } = await admin
    .from('email_jobs')
    .update({ status: 'processing', last_attempted_at: new Date().toISOString() })
    .eq('id', matchingJob.id)
    .in('status', ['pending', 'processing'])
    .select('id')

  if (!claimed || claimed.length === 0) return

  try {
    const verificationUrl = `${PRODUCTION_APP_URL}/verify/${certificateNumber}`
    const result = await sendCertificateEmail({
      to: studentEmail,
      studentName,
      collegeName,
      course,
      certificateNumber,
      certificateType,
      verificationUrl,
      score,
      totalQuestions,
    })

    await admin
      .from('email_jobs')
      .update({
        status: result.success ? 'sent' : 'failed',
        error_message: result.success ? null : String(result.reason || 'SMTP failed'),
        last_attempted_at: new Date().toISOString(),
      })
      .eq('id', matchingJob.id)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Send error'
    await admin
      .from('email_jobs')
      .update({
        status: 'failed',
        error_message: msg,
        last_attempted_at: new Date().toISOString(),
      })
      .eq('id', matchingJob.id)
  }
}
