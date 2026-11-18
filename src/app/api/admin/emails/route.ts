import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

// POST: Deduplicate email_jobs (keeps 1 row per unique email + certificate_number)
export async function POST() {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: allJobs, error } = await admin
      .from('email_jobs')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const grouped = new Map<string, any[]>()
    for (const job of allJobs || []) {
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
    }

    return NextResponse.json({
      success: true,
      removed: idsToDelete.length,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE: Remove a single email_job row
export async function DELETE(request: Request) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('email_jobs').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
