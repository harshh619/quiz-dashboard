import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorDescription = searchParams.get('error_description') || searchParams.get('error')
  const next = searchParams.get('next') ?? '/dashboard'

  if (errorDescription) {
    console.error('Auth callback error from provider:', errorDescription)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check user role & profile completion
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, college_name, course')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin' || user.email === 'msunagpur@gmail.com') {
          return NextResponse.redirect(`${origin}/admin/dashboard`)
        }

        // If profile is incomplete, route directly to register (preserving target destination)
        if (!profile || !profile.college_name || !profile.course) {
          const regTarget = next && next !== '/dashboard'
            ? `${origin}/register?redirect=${encodeURIComponent(next)}`
            : `${origin}/register`
          return NextResponse.redirect(regTarget)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('Exchange code error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  // Return to login with error if auth failed
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
