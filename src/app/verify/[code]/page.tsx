'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME, APP_TAGLINE } from '@/constants'
import { formatDate } from '@/lib/utils'
import { ShieldCheck, Award, CheckCircle2, School, Calendar, ArrowLeft, AlertCircle } from 'lucide-react'

export default function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const resolvedParams = use(params)
  const code = resolvedParams.code
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [cert, setCert] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(code)}`)
        const json = await res.json()

        if (!res.ok || json.error) {
          setError(json.error || 'Certificate record not found or code is invalid.')
        } else {
          setCert(json.certificate)
        }
      } catch (err: unknown) {
        setError('Verification lookup failed.')
      } finally {
        setLoading(false)
      }
    }

    verify()
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home Portal</span>
          </Link>
          <span className="text-[11px] text-gray-400 font-mono">
            Public Registry
          </span>
        </div>

        {error ? (
          <div className="bg-white rounded-3xl border border-red-200 p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Certificate Not Verified</h1>
            <p className="text-xs text-gray-600 max-w-sm mx-auto">
              {error} No authentic credentials match certificate ID: <span className="font-mono font-bold">{code}</span>.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-6 relative overflow-hidden">
            
            {/* Authenticity Banner */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-950">Official Certificate Verified Genuine</h4>
                <p className="text-xs text-emerald-700">
                  This document has been tamper-verified through the AMR National Examination Portal.
                </p>
              </div>
            </div>

            {/* Details Table */}
            <div className="space-y-4 text-xs">
              <div className="pb-3 border-b border-gray-100 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Certificate ID</span>
                <span className="font-mono font-bold text-gray-900">{cert?.certificate_number}</span>
              </div>

              <div className="pb-3 border-b border-gray-100 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Recipient Name</span>
                <span className="font-bold text-gray-900 text-sm">{cert?.student?.full_name}</span>
              </div>

              <div className="pb-3 border-b border-gray-100 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Health Facility</span>
                <span className="font-semibold text-gray-800 text-right max-w-xs">{cert?.student?.college_name}</span>
              </div>

              <div className="pb-3 border-b border-gray-100 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Role / Category</span>
                <span className="font-semibold text-gray-800">{cert?.student?.course || 'Pharmacist'}</span>
              </div>

              <div className="pb-3 border-b border-gray-100 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Recognition Category</span>
                <span className="font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {cert?.certificate_type?.replace('_', ' ')}
                </span>
              </div>

              <div className="pb-3 border-b border-gray-100 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Event</span>
                <span className="font-medium text-gray-700 text-right max-w-xs">
                  {cert?.competition?.title || 'World AMR Awareness Week 2026'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Date of Issue</span>
                <span className="font-medium text-gray-700">
                  {cert?.issued_at ? formatDate(cert.issued_at) : 'November 2026'}
                </span>
              </div>
            </div>

            {/* Organizing Authority Footer */}
            <div className="pt-4 border-t border-gray-100 text-center">
              <p className="text-[11px] text-gray-400">
                Nagpur Municipal Corporation (NMC), Nagpur · Metropolitan Surveillance Unit (MSU), Nagpur · World AMR Awareness Week (WAAW) 2026
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
