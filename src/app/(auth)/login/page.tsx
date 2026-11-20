'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME, APP_TAGLINE } from '@/constants'
import { AlertCircle, CheckCircle, ShieldCheck, Building2 } from 'lucide-react'

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '860148988905-2nonqgt1sb77gi6q4h062fmtmpg0t3od.apps.googleusercontent.com'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            nonce?: string
            auto_select?: boolean
            ux_mode?: 'popup' | 'redirect'
            itp_support?: boolean
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon'
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              logo_alignment?: 'left' | 'center'
              width?: number
            }
          ) => void
        }
      }
    }
  }
}

async function generateNoncePair(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const bytes = new Uint8Array(32)
  window.crypto.getRandomValues(bytes)
  const rawNonce = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNonce))
  const hashedNonce = Array.from(new Uint8Array(hashBuffer), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('')
  return { rawNonce, hashedNonce }
}

function LoginContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [gsiReady, setGsiReady] = useState(false)
  const [gsiError, setGsiError] = useState(false)
  const [isEmbeddedBrowser, setIsEmbeddedBrowser] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const googleBtnRef = useRef<HTMLDivElement | null>(null)
  const rawNonceRef = useRef<string>('')
  const initializedRef = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || ''
      const isEmbedded = /WhatsApp|FBAN|FBAV|Instagram|Line|Twitter|MicroMessenger/i.test(ua)
      setIsEmbeddedBrowser(isEmbedded)
    }
  }, [])

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

  const redirectAfterLogin = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, college_name, course')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin' || user.email === 'msunagpur@gmail.com') {
        window.location.href = '/admin/dashboard'
        return
      }

      const redirectParam = searchParams.get('redirect')
      const target = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard'

      if (!profile || !profile.college_name || !profile.course) {
        window.location.href = redirectParam
          ? `/register?redirect=${encodeURIComponent(redirectParam)}`
          : '/register'
        return
      }

      window.location.href = target
      return
    }
    window.location.href = '/dashboard'
  }, [supabase, searchParams])

  // Direct Standard Google OAuth flow (100% reliable across all browsers & devices)
  const handleFallbackOAuth = useCallback(async () => {
    try {
      setLoading(true)
      setMessage({ type: 'success', text: 'Connecting to Google accounts...' })
      const redirectParam = searchParams.get('redirect')
      const target = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard'
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`

      const { error } = await supabase.auth.signInWithOAuth({
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setMessage({ type: 'error', text: msg })
      setLoading(false)
    }
  }, [supabase, searchParams])

  const initGoogleSignIn = useCallback(async () => {
    if (initializedRef.current || !window.google?.accounts?.id || !googleBtnRef.current) return
    initializedRef.current = true

    try {
      const { rawNonce, hashedNonce } = await generateNoncePair()
      rawNonceRef.current = rawNonce

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashedNonce,
        auto_select: false,
        ux_mode: 'popup',
        itp_support: true,
        callback: async (response: { credential: string }) => {
          try {
            setLoading(true)
            setMessage({ type: 'success', text: 'Verifying Google credentials...' })

            const { error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce: rawNonceRef.current,
            })

            if (error) {
              console.warn('signInWithIdToken error, automatically falling back to browser OAuth:', error.message)
              await handleFallbackOAuth()
              return
            }

            setMessage({ type: 'success', text: 'Verified! Redirecting to your portal...' })
            await redirectAfterLogin()
          } catch (err: unknown) {
            console.warn('GSI callback exception, falling back to browser OAuth:', err)
            await handleFallbackOAuth()
          }
        },
      })

      const containerWidth = googleBtnRef.current.offsetWidth || 300
      const btnWidth = Math.min(Math.max(containerWidth, 210), 360)

      googleBtnRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'center',
        width: btnWidth,
      })

      setGsiReady(true)
    } catch (err) {
      console.error('Google Sign-In init error:', err)
      setGsiError(true)
    }
  }, [redirectAfterLogin, handleFallbackOAuth, supabase])

  useEffect(() => {
    if (window.google?.accounts?.id) {
      void initGoogleSignIn()
      return
    }
    const timer = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(timer)
        void initGoogleSignIn()
      }
    }, 150)
    const timeout = setTimeout(() => clearInterval(timer), 6000)
    return () => {
      clearInterval(timer)
      clearTimeout(timeout)
    }
  }, [initGoogleSignIn])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => void initGoogleSignIn()}
        onError={() => setGsiError(true)}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="AMR 2026 Logo"
            width={72}
            height={72}
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
            <div className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
              {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Primary Action: Direct Google Identity Services Sign-In */}
          <div className="space-y-3">
            {loading && (
              <div className="w-full flex justify-center items-center gap-2.5 py-3 px-4 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-700 border-t-transparent"></div>
                <span>Verifying your Google account...</span>
              </div>
            )}

            <div className={`relative w-full min-h-[44px] overflow-hidden ${loading ? 'hidden' : 'block'}`}>
              <div
                className="w-full flex justify-center"
                ref={googleBtnRef}
              />

              {!gsiReady && !gsiError && (
                <div className="absolute inset-0 w-full h-[44px] rounded-xl bg-gray-100 animate-pulse flex items-center justify-center text-xs text-gray-400">
                  Loading Google Sign-In...
                </div>
              )}
            </div>

            {!loading && (
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleFallbackOAuth}
                  type="button"
                  className="w-full flex justify-center items-center gap-2.5 py-2.5 px-4 rounded-xl shadow-2xs text-xs font-bold text-gray-800 bg-white hover:bg-gray-50 border border-gray-300 transition-all cursor-pointer hover:border-blue-500 hover:shadow-xs"
                  title="Direct Google Browser Sign-In"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Sign In with Google (Direct Browser)</span>
                </button>
              </div>
            )}

            {isEmbeddedBrowser && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-snug">
                <strong>WhatsApp / App Browser:</strong> Agar Google account select karne par dikkat aaye, toh right corner me <strong>⋮ (3 dots)</strong> par tap karke <strong>&ldquo;Open in Chrome / Browser&rdquo;</strong> select karein.
              </div>
            )}

            <p className="text-center text-[11px] text-gray-400">
              Mandatory Google verification prevents duplicate attempts.
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-start gap-2.5 text-gray-500">
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
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
