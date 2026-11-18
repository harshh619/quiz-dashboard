import { createAdminClient } from '@/lib/supabase/admin'
import { CERT_BUCKET } from '@/lib/signatories'

const LOCKED_COMPS_PATH = 'config/locked_competitions.json'

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data: buckets } = await admin.storage.listBuckets()
  if (!(buckets || []).some((b) => b.name === CERT_BUCKET)) {
    await admin.storage.createBucket(CERT_BUCKET, {
      public: true,
      fileSizeLimit: 5242880,
    })
  }
}

export async function getLockedCompetitionIds(): Promise<string[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from(CERT_BUCKET)
      .download(LOCKED_COMPS_PATH)

    if (error || !data) return []
    const parsed = JSON.parse(await data.text())
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
    }
    return []
  } catch {
    return []
  }
}

export async function setCompetitionLocked(
  competitionId: string,
  locked: boolean
): Promise<string[]> {
  const admin = createAdminClient()
  await ensureBucket(admin)

  const current = new Set(await getLockedCompetitionIds())
  if (locked) {
    current.add(competitionId)
  } else {
    current.delete(competitionId)
  }

  const next = Array.from(current)
  const { error } = await admin.storage
    .from(CERT_BUCKET)
    .upload(LOCKED_COMPS_PATH, Buffer.from(JSON.stringify(next, null, 2), 'utf8'), {
      contentType: 'application/json',
      upsert: true,
      cacheControl: '0',
    })

  if (error) {
    throw new Error(`Failed to update lock status: ${error.message}`)
  }

  return next
}

/**
 * Returns all student_ids associated with any locked official competition
 * (via registrations, quiz_attempts, competition_results, or certificates).
 */
export async function getProtectedStudentIds(
  admin: ReturnType<typeof createAdminClient>,
  lockedCompIds: string[]
): Promise<Set<string>> {
  const protectedIds = new Set<string>()
  if (lockedCompIds.length === 0) return protectedIds

  const [{ data: regs }, { data: atts }, { data: certs }] = await Promise.all([
    admin.from('registrations').select('student_id').in('competition_id', lockedCompIds),
    admin.from('quiz_attempts').select('student_id').in('competition_id', lockedCompIds),
    admin.from('certificates').select('student_id').in('competition_id', lockedCompIds),
  ])

  for (const r of regs || []) if (r.student_id) protectedIds.add(r.student_id)
  for (const a of atts || []) if (a.student_id) protectedIds.add(a.student_id)
  for (const c of certs || []) if (c.student_id) protectedIds.add(c.student_id)

  return protectedIds
}
