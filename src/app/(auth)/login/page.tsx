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
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const googleBtnRef = useRef<HTMLDivElement | null>(null)
  const rawNonceRef = useRef<string>('')
  const initializedRef = useRef(false)
  const supabase = createClient()

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
        .select('role, college_name')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin' || user.email === 'msunagpur@gmail.com') {
        window.location.href = '/admin/dashboard'
        return
      }

      const redirectParam = searchParams.get('redirect')
      const target = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard'

      if (!profile || !profile.college_name) {
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
            setMessage(null)

            const { error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce: rawNonceRef.current,
            })

            if (error) throw error

            setMessage({ type: 'success', text: 'Verified! Redirecting to your portal...' })
            await redirectAfterLogin()
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Google Sign-In failed'
            setMessage({ type: 'error', text: msg })
            setLoading(false)
            initializedRef.current = false
            void initGoogleSignIn()
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
  }, [redirectAfterLogin, supabase])

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

  // Fallback OAuth (only used if Google GSI script is blocked by browser/ad-blocker)
  const handleFallbackOAuth = async () => {
    try {
      setLoading(true)
      setMessage(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
  }

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

            {gsiError && !loading && (
              <button
                onClick={handleFallbackOAuth}
                type="button"
                className="w-full flex justify-center items-center gap-3 py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 transition-all"
              >
                <span>Continue with Google</span>
              </button>
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
