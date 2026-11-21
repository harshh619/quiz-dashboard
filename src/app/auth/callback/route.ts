import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isProfileComplete } from '@/lib/profileValidation'

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
    const cookieStore = await cookies()
    const targetPath = next.startsWith('/') ? next : '/dashboard'
    let redirectResponse = NextResponse.redirect(new URL(targetPath, origin))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              redirectResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, college_name, course, mobile, profile_completed, full_name')
          .eq('id', user.id)
          .single()

        // 1. Admin redirect
        if (profile?.role === 'admin' || user.email === 'msunagpur@gmail.com') {
          const adminResp = NextResponse.redirect(new URL('/admin/dashboard', origin))
          redirectResponse.cookies.getAll().forEach(c => adminResp.cookies.set(c.name, c.value, c))
          return adminResp
        }

        // 2. Strict Incomplete profile check:
        // Must have complete name, valid health facility, designation, and 10-digit mobile
        if (!isProfileComplete(profile)) {
          const regTarget = next && next !== '/dashboard'
            ? `/register?redirect=${encodeURIComponent(next)}`
            : '/register'
          const regResp = NextResponse.redirect(new URL(regTarget, origin))
          redirectResponse.cookies.getAll().forEach(c => regResp.cookies.set(c.name, c.value, c))
          return regResp
        }
      }

      // 3. User is already registered and complete -> proceed to target destination
      return redirectResponse
    }

    console.error('Exchange code error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  // Return to login with error if auth failed
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
