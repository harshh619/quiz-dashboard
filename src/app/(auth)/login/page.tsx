'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME, APP_TAGLINE } from '@/constants'
import { AlertCircle, CheckCircle, ShieldCheck, Mail } from 'lucide-react'

function LoginContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isTestMode, setIsTestMode] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      if (errorParam === 'auth_failed') {
        setMessage({ type: 'error', text: 'Authentication failed. Please check your Supabase & Google OAuth configuration.' })
      } else {
        setMessage({ type: 'error', text: decodeURIComponent(errorParam) })
      }
    }
  }, [searchParams])

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setMessage(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
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

  // Email / Password for Testing / Admin
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setMessage(null)
    try {
      if (password) {
        // Sign in or sign up with password
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          // If user doesn't exist, try signing them up
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: email.split('@')[0] },
            },
          })
          if (signUpError) throw signUpError
          setMessage({ type: 'success', text: 'Account created! Redirecting to dashboard...' })
        }
      } else {
        // Magic link
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) throw error
        setMessage({ type: 'success', text: 'Magic link sent to your email!' })
      }
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      setMessage({ type: 'error', text: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Emblem / Badge */}
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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-gray-100 sm:px-10">
          
          {message && (
            <div className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Primary Action: Google Sign In */}
          <div>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              className="w-full flex justify-center items-center gap-3 py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-150 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
            <p className="mt-2 text-center text-[11px] text-gray-400">
              Mandatory Google verification prevents duplicate attempts.
            </p>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <button 
                type="button" 
                onClick={() => setIsTestMode(!isTestMode)}
                className="bg-white px-2 text-gray-500 hover:text-blue-600 underline font-medium"
              >
                {isTestMode ? 'Hide Email / Test Login' : 'Admin & Test Login'}
              </button>
            </div>
          </div>

          {/* Test / Admin Login */}
          {isTestMode && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Email Address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Password <span className="text-gray-400">(leave blank for Magic Link)</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                <span>{loading ? 'Processing...' : 'Sign in with Email'}</span>
              </button>
            </form>
          )}

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-start gap-2.5 text-gray-500">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-gray-700">Fair Examination Policy:</span> Only one attempt per participant is allowed. Browser activity and server timestamps are strictly monitored.
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
