import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Verify authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const admin = createAdminClient()

    if (id) {
      const { data: comp, error } = await admin
        .from('competitions')
        .select('*')
        .eq('id', id)
        .neq('status', 'draft')
        .single()

      if (error || !comp) {
        return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
      }

      return NextResponse.json({
        competition: comp,
        serverTime: new Date().toISOString(),
      })
    }

    // Return all non-draft competitions (scheduled, waiting_room, active, closed, results_published)
    const { data: competitions, error } = await admin
      .from('competitions')
      .select('*')
      .neq('status', 'draft')
      .order('scheduled_start', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      competitions: competitions || [],
      serverTime: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
