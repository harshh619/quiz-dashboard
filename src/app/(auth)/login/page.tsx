'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME, APP_TAGLINE } from '@/constants'
import { isProfileComplete } from '@/lib/profileValidation'
import { AlertCircle, CheckCircle, ShieldCheck, Building2, Lock } from 'lucide-react'

function LoginContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [isEmbeddedBrowser, setIsEmbeddedBrowser] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

  const supabase = createClient()

  // Detect in-app browsers (WhatsApp, Instagram, etc.) to show helpful tip
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || ''
      const isEmbedded = /WhatsApp|FBAN|FBAV|Instagram|Line|Twitter|MicroMessenger/i.test(ua)
      setIsEmbeddedBrowser(isEmbedded)
    }
  }, [])

  // Check URL error parameter
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      if (errorParam === 'auth_failed') {
        setMessage({ type: 'error', text: 'Authentication failed. Please try signing in again.' })
      } else {
        setMessage({ type: 'error', text: decodeURIComponent(errorParam) })
      }
    }
  }, [searchParams])

  // If user is already logged in, route them appropriately
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          if (user.email === 'msunagpur@gmail.com') {
            window.location.href = '/admin/dashboard'
            return
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('role, college_name, course, mobile, profile_completed, full_name')
            .eq('id', user.id)
            .single()

          if (profile?.role === 'admin') {
            window.location.href = '/admin/dashboard'
            return
          }

          const redirectParam = searchParams.get('redirect')
          const target = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard'

          if (!isProfileComplete(profile)) {
            window.location.href = redirectParam
              ? `/register?redirect=${encodeURIComponent(redirectParam)}`
              : '/register'
            return
          }

          window.location.href = target
        }
      } catch {
        // Session check failed silently, user can click login
      }
    }
    void checkExistingSession()
  }, [supabase, searchParams])

  // Single Standard Google Login (Works 100% reliably across all mobile & desktop browsers)
  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setMessage({ type: 'success', text: 'Connecting to Google accounts...' })

      const redirectParam = searchParams.get('redirect')
      const target = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard'

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_redirect_target', target)
        localStorage.setItem('auth_redirect_target', target)
      }

      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })

      if (error) throw error

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google login failed'
      setMessage({ type: 'error', text: msg })
      setLoading(false)
    }
  }

  // Admin Email/Password fallback login
  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminEmail || !adminPassword) return
    try {
      setAdminLoading(true)
      setMessage(null)
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })
      if (error) throw error
      window.location.href = '/admin/dashboard'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Admin authentication failed'
      setMessage({ type: 'error', text: msg })
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="AMR 2026 Logo"
            width={76}
            height={76}
            className="object-contain drop-shadow-md"
            priority
          />
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-gray-900">
          {APP_NAME}
        </h2>
        <p className="mt-1 text-center text-xs text-gray-500 max-w-sm mx-auto">
          {APP_TAGLINE}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-5 sm:px-9 shadow-xl shadow-slate-200/50 rounded-2xl border border-gray-100">

          {/* Official Government / Municipal Organizer Banner */}
          <div className="mb-5 p-3 rounded-xl bg-blue-50/80 border border-blue-100 flex items-start gap-2.5 text-left">
            <Building2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-snug text-blue-950">
              <span className="font-bold">Official Portal:</span> Metropolitan Surveillance Unit (MSU), Nagpur · Nagpur Municipal Corporation (NMC), Nagpur ·{' '}
              <span className="font-semibold text-blue-700">msunagpur@gmail.com</span>
            </div>
          </div>

          {message && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}
            >
              {message.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Single Official Google Login Button */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              className="w-full flex justify-center items-center gap-3 py-3 px-4 rounded-xl shadow-xs text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 transition-all cursor-pointer hover:border-blue-500 hover:shadow-sm disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {isEmbeddedBrowser && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-snug">
                <strong>WhatsApp / App Browser:</strong> Agar Google account select karne par dikkat aaye, toh upar right corner me <strong>⋮ (3 dots)</strong> par tap karke <strong>&ldquo;Open in Chrome / Browser&rdquo;</strong> select karein.
              </div>
            )}

            <p className="text-center text-[11px] text-gray-400">
              Mandatory Google verification ensures fair participation.
            </p>
          </div>

          {/* Admin Email/Password Login Toggle */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowAdminLogin(!showAdminLogin)}
                className="text-[11px] text-gray-400 hover:text-blue-600 font-medium transition-colors"
              >
                {showAdminLogin ? 'Hide Admin Login' : 'Admin Login with Email'}
              </button>
            </div>

            {showAdminLogin && (
              <form onSubmit={handleAdminEmailLogin} className="mt-3 space-y-3 text-left">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    placeholder="msunagpur@gmail.com"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{adminLoading ? 'Authenticating...' : 'Sign In as Admin'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-start gap-2.5 text-gray-500">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-gray-700">Fair Quiz Policy:</span> Only one attempt per participant is allowed. Browser activity and server timestamps are strictly monitored.
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
