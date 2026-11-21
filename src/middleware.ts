import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isProfileComplete } from '@/lib/profileValidation'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http')
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        } catch {}
      },
    },
  })

  // Skip auth checks if running placeholder without real Supabase connection
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http')) {
    return supabaseResponse
  }

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Auto-redirect admin directly to admin dashboard if they visit home or login while logged in
  if (user && (pathname === '/' || pathname === '/login')) {
    if (user.email === 'msunagpur@gmail.com') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  // Protected routes check
  const isProtectedRoute = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/quiz') ||
    pathname.startsWith('/waiting-room') ||
    pathname.startsWith('/result') ||
    pathname.startsWith('/admin')

  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    if (pathname.startsWith('/waiting-room') || pathname.startsWith('/quiz')) {
      loginUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // If non-admin tries to access /admin, redirect them to student dashboard
  if (user && pathname.startsWith('/admin') && user.email !== 'msunagpur@gmail.com') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // If authenticated student accesses dashboard, quiz, or waiting room with incomplete profile -> force to /register
  if (user && (pathname.startsWith('/dashboard') || pathname.startsWith('/quiz') || pathname.startsWith('/waiting-room'))) {
    if (user.email !== 'msunagpur@gmail.com') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, college_name, course, mobile, profile_completed, full_name')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin' && !isProfileComplete(profile)) {
        const regUrl = new URL('/register', request.url)
        if (pathname.startsWith('/waiting-room') || pathname.startsWith('/quiz')) {
          regUrl.searchParams.set('redirect', pathname)
        }
        return NextResponse.redirect(regUrl)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
