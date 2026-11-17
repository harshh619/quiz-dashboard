'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatTime, formatDate } from '@/lib/utils'
import { 
  Trophy, Award, CheckCircle2, Download, ArrowLeft, 
  Share2, QrCode, Sparkles, Clock, Check, ShieldCheck 
} from 'lucide-react'
import QRCode from 'qrcode'

export default function StudentResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const resolvedParams = use(params)
  const attemptId = resolvedParams.attemptId
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [competition, setCompetition] = useState<any>(null)
  const [certificate, setCertificate] = useState<any>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function loadResult() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Fetch attempt
        const { data: att } = await supabase
          .from('quiz_attempts')
          .select('*, competition:competitions(*), student:profiles(*)')
          .eq('id', attemptId)
          .single()

        if (att) {
          setAttempt(att)
          setProfile(att.student)
          setCompetition(att.competition)

          // Fetch certificate if already generated
          const { data: cert } = await supabase
            .from('certificates')
            .select('*')
            .eq('attempt_id', attemptId)
            .single()

          if (cert) {
            setCertificate(cert)
            // Generate QR code data URL
            const url = `${window.location.origin}/verify/${cert.certificate_number}`
            const qr = await QRCode.toDataURL(url, { width: 180, margin: 1 })
            setQrCodeDataUrl(qr)
          } else {
            // Generate temporary QR code for attempt
            const url = `${window.location.origin}/result/${attemptId}`
            const qr = await QRCode.toDataURL(url, { width: 180, margin: 1 })
            setQrCodeDataUrl(qr)
          }
        }
      } catch (err) {
        console.error('Error loading result:', err)
      } finally {
        setLoading(false)
      }
    }

    loadResult()
  }, [attemptId, router, supabase])

  // Simple Certificate PDF / Image Download
  const handleDownloadCertificate = async () => {
    setDownloading(true)
    try {
      // In production with Resend/storage, downloads signed PDF. For now, open certificate print view
      window.print()
    } catch (err) {
      console.error(err)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  const score = attempt?.score ?? 0
  const total = attempt?.total_questions ?? 30
  const percentage = Math.round((score / total) * 100)
  
  // Calculate completion time in seconds
  let timeSpentSeconds = 600
  if (attempt?.started_at && attempt?.submitted_at) {
    const diff = Math.floor(
      (new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 1000
    )
    timeSpentSeconds = Math.max(0, Math.min(diff, 600))
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-xs text-gray-400 font-mono">
            Attempt ID: {attemptId.slice(0, 8)}...
          </span>
        </div>

        {/* Hero Scorecard */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 mb-4">
            <Trophy className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Quiz Successfully Submitted!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
            {competition?.title || 'World AMR Awareness Week National Quiz Competition 2026'}
          </p>

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-3 my-6 max-w-sm mx-auto">
            <div className="bg-slate-50 rounded-2xl p-3 border border-gray-100">
              <div className="text-xl sm:text-2xl font-extrabold text-blue-700">
                {score} / {total}
              </div>
              <div className="text-[10px] text-gray-500 uppercase font-semibold mt-0.5">Score</div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-gray-100">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
                {percentage}%
              </div>
              <div className="text-[10px] text-gray-500 uppercase font-semibold mt-0.5">Accuracy</div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-gray-100">
              <div className="text-xl sm:text-2xl font-extrabold text-indigo-700">
                {formatTime(timeSpentSeconds)}
              </div>
              <div className="text-[10px] text-gray-500 uppercase font-semibold mt-0.5">Time Taken</div>
            </div>
          </div>

          {/* Candidate Info Summary */}
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-900 border border-blue-100 px-4 py-1.5 rounded-full text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>{profile?.full_name} · {profile?.college_name}</span>
          </div>
        </div>

        {/* Certificate Section */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-gray-900">Your Digital Certificate</h3>
            </div>
            {certificate && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Issued &amp; Verified
              </span>
            )}
          </div>

          {/* Certificate Visual Card Preview */}
          <div className="border-4 border-amber-100 rounded-2xl p-6 bg-gradient-to-b from-amber-50/30 via-white to-amber-50/20 text-center relative shadow-inner">
            <div className="text-[11px] font-extrabold tracking-widest text-amber-800 uppercase">
              WORLD AMR AWARENESS WEEK 2026
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Certificate of Completion / Participation</div>
            
            <div className="my-4">
              <span className="text-xs text-gray-400">Awarded to</span>
              <div className="text-lg font-bold text-gray-900 mt-0.5">{profile?.full_name}</div>
              <div className="text-xs text-gray-600">{profile?.college_name} ({profile?.course})</div>
            </div>

            <p className="text-[11px] text-gray-500 max-w-sm mx-auto leading-relaxed">
              For demonstrating exceptional commitment to Antimicrobial Stewardship in the National AMR Awareness Quiz.
            </p>

            {/* QR Code & Certificate Number */}
            <div className="mt-5 pt-4 border-t border-amber-100 flex items-center justify-between">
              <div className="text-left">
                <div className="text-[9px] text-gray-400 uppercase font-mono">Certificate ID</div>
                <div className="text-xs font-mono font-bold text-gray-800">
                  {certificate?.certificate_number || 'AMR-WAAW-2026-PENDING'}
                </div>
              </div>

              {qrCodeDataUrl && (
                <img 
                  src={qrCodeDataUrl} 
                  alt="Verification QR" 
                  className="w-14 h-14 border border-gray-200 rounded-lg p-0.5 bg-white shadow-xs" 
                />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleDownloadCertificate}
              disabled={downloading}
              className="flex-1 py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Preparing Download...' : 'Download Official Certificate (PDF)'}</span>
            </button>

            {certificate && (
              <Link
                href={`/verify/${certificate.certificate_number}`}
                className="py-3 px-5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Verify Online</span>
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
