import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || user.email === 'msunagpur@gmail.com'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can clear test data' }, { status: 403 })
    }

    const { clearStudents } = await request.json().catch(() => ({ clearStudents: false }))
    const admin = createAdminClient()

    // 1. Delete generated certificates
    await admin.from('certificates').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 2. Delete competition results & rankings
    await admin.from('competition_results').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 3. Delete student quiz responses
    await admin.from('quiz_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 4. Delete attempt questions
    await admin.from('attempt_questions').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 5. Delete quiz attempts
    await admin.from('quiz_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 6. Delete competition registrations
    await admin.from('registrations').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 7. Delete queued & dispatched email jobs
    await admin.from('email_jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 8. Reset non-draft competition status back to 'scheduled'
    await admin
      .from('competitions')
      .update({ status: 'scheduled' })
      .neq('status', 'draft')

    // 9. If requested to clear test student profiles (keep admin profiles safe)
    if (clearStudents) {
      const { data: students } = await admin
        .from('profiles')
        .select('id')
        .neq('role', 'admin')
        .neq('email', 'msunagpur@gmail.com')

      await admin.from('profiles').delete().neq('role', 'admin').neq('email', 'msunagpur@gmail.com')

      for (const s of students || []) {
        await admin.auth.admin.deleteUser(s.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All test quiz attempts, registrations, results, certificates, and email logs cleared successfully!'
    })
  } catch (err: any) {
    console.error('Error clearing test data:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
