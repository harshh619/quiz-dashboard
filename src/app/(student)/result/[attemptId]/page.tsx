'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatTime } from '@/lib/utils'
import { parseCategoryTopic } from '@/lib/questionCategories'
import {
  Trophy, Award, Download, ArrowLeft, QrCode, Sparkles, Clock,
  ShieldCheck, CheckCircle, XCircle, ChevronDown, ChevronUp,
  BookOpen, Mail, Loader2, Medal, Lock, Share2, ImageIcon
} from 'lucide-react'
import QRCode from 'qrcode'

function getAwardDisplay(certificateType?: string | null) {
  switch (certificateType) {
    case 'first_prize':
      return {
        title: 'Certificate of Merit – First Prize',
        badge: '1st Prize Winner',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        borderClass: 'border-amber-300 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/40',
      }
    case 'second_prize':
      return {
        title: 'Certificate of Merit – Second Prize',
        badge: '2nd Prize Winner',
        badgeClass: 'bg-slate-200 text-slate-900 border-slate-300',
        borderClass: 'border-slate-300 bg-gradient-to-b from-slate-50 via-white to-slate-50/60',
      }
    case 'third_prize':
      return {
        title: 'Certificate of Merit – Third Prize',
        badge: '3rd Prize Winner',
        badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
        borderClass: 'border-orange-200 bg-gradient-to-b from-orange-50/60 via-white to-orange-50/30',
      }
    default:
      return {
        title: 'Certificate of Participation',
        badge: 'Verified Participation',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        borderClass: 'border-amber-100 bg-gradient-to-b from-amber-50/30 via-white to-amber-50/20',
      }
  }
}

export default function StudentResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const resolvedParams = use(params)
  const attemptId = resolvedParams.attemptId
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [finalizingNow, setFinalizingNow] = useState(false)
  const [attempt, setAttempt] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [competition, setCompetition] = useState<any>(null)
  const [certificate, setCertificate] = useState<any>(null)
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null)
  const [authCode, setAuthCode] = useState<string | null>(null)
  const [rank, setRank] = useState<number | null>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [scoreUnlocked, setScoreUnlocked] = useState(false)
  const [answerKeyUnlocked, setAnswerKeyUnlocked] = useState(false)
  const [unlockAt, setUnlockAt] = useState<string | null>(null)
  const [serverOffsetMs, setServerOffsetMs] = useState(0)
  const [secondsUntilUnlock, setSecondsUntilUnlock] = useState<number | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [signatories, setSignatories] = useState<any[]>([])
  const [downloading, setDownloading] = useState(false)
  const [downloadingImage, setDownloadingImage] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const loadResult = useCallback(async (isAutoRefresh = false) => {
    if (isAutoRefresh) setFinalizingNow(true)
    try {
      const res = await fetch(`/api/student/result/${attemptId}`, { cache: 'no-store' })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        throw new Error('Could not load result')
      }

      const data = await res.json()
      setAttempt(data.attempt)
      setProfile(data.profile)
      setCompetition(data.competition)
      setCertificate(data.certificate || null)
      setSignatories(data.signatories || [])
      setVerifyUrl(data.qrPayload || null)
      setAuthCode(data.authCode || null)
      setRank(data.rank ?? null)
      setResponses(data.responses || [])
      setScoreUnlocked(Boolean(data.scoreUnlocked))
      setAnswerKeyUnlocked(Boolean(data.answerKeyUnlocked))
      setUnlockAt(data.unlockAt || null)

      const offset = data.serverTime
        ? new Date(data.serverTime).getTime() - Date.now()
        : 0
      setServerOffsetMs(offset)

      if (data.unlockAt && (!data.certificate || !data.answerKeyUnlocked || !data.scoreUnlocked)) {
        const diff = Math.max(
          0,
          Math.ceil((new Date(data.unlockAt).getTime() - (Date.now() + offset)) / 1000)
        )
        setSecondsUntilUnlock(diff)
      } else {
        setSecondsUntilUnlock(0)
      }

      if (data.qrPayload) {
        const qr = await QRCode.toDataURL(data.qrPayload, {
          width: 220,
          margin: 1,
          errorCorrectionLevel: 'M',
        })
        setQrCodeDataUrl(qr)
      } else if (data.certificate?.certificate_number) {
        const verifyUrl = `${window.location.origin}/verify/${data.certificate.certificate_number}`
        const qr = await QRCode.toDataURL(verifyUrl, { width: 180, margin: 1 })
        setQrCodeDataUrl(qr)
      }
    } catch (err) {
      console.error('Error loading result:', err)
    } finally {
      setLoading(false)
      setFinalizingNow(false)
    }
  }, [attemptId, router])

  useEffect(() => {
    loadResult(false)
  }, [loadResult])

  // Live countdown to auto-unlock score, official certificate & answer key once exam window closes!
  useEffect(() => {
    if ((certificate && answerKeyUnlocked && scoreUnlocked) || !unlockAt) return

    const unlockMs = new Date(unlockAt).getTime()
    let triggered = false

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((unlockMs - (Date.now() + serverOffsetMs)) / 1000))
      setSecondsUntilUnlock(diff)

      if (diff <= 0 && !triggered) {
        triggered = true
        clearInterval(interval)
        void loadResult(true)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [certificate, answerKeyUnlocked, scoreUnlocked, unlockAt, serverOffsetMs, loadResult])

  // Direct Official PDF Certificate Download (NOT webpage print!)
  const handleDownloadCertificate = async () => {
    if (!certificate) return
    setDownloading(true)
    setDownloadError(null)
    try {
      const res = await fetch(`/api/certificate/${attemptId}/pdf`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to download certificate PDF')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AMR_Certificate_${certificate.certificate_number}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed'
      setDownloadError(msg)
    } finally {
      setDownloading(false)
    }
  }

  // 1-Click High-Res Image (PNG) Download directly to phone gallery
  const handleDownloadCertificateImage = async () => {
    if (!certificate) return
    setDownloadingImage(true)
    setDownloadError(null)
    try {
      const html2canvas = (await import('html2canvas')).default
      const certElem = document.getElementById('certificate-card-preview')
      if (!certElem) throw new Error('Certificate element not found')

      const canvas = await html2canvas(certElem, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `AMR_Certificate_${certificate.certificate_number}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save certificate image'
      setDownloadError(msg)
    } finally {
      setDownloadingImage(false)
    }
  }

  // 1-Click WhatsApp Share with pre-formatted message
  const handleWhatsAppShare = () => {
    if (!certificate) return
    const certUrl = verifyUrl || (typeof window !== 'undefined' ? `${window.location.origin}/verify/${certificate.certificate_number}` : '')
    const msg = `🏥 *World AMR Awareness Week (WAAW) 2026 – Online Quiz Competition*\n*Metropolitan Surveillance Unit (MSU), Nagpur | NMC Nagpur*\n\n🎉 I participated as a Pharmacy Officer representing *${profile?.college_name || 'UPHC Nagpur'}* and scored *${score}/${total}* (Accuracy: *${percentage}%*)!\n${rank ? `🏆 Final Rank: *#${rank}*\n` : ''}📜 *Verify My Official Certificate:* ${certUrl}\n\n#WAAW2026 #StopAMR #OneHealth #MSUNagpur`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(whatsappUrl, '_blank')
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
  const durationLimit = competition?.duration_seconds || 600

  let timeSpentSeconds = durationLimit
  if (attempt?.started_at && attempt?.submitted_at) {
    const diff = Math.floor(
      (new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 1000
    )
    timeSpentSeconds = Math.max(0, Math.min(diff, durationLimit))
  }

  const awardInfo = getAwardDisplay(certificate?.certificate_type)
  const endTimeLabel = competition?.scheduled_end
    ? new Date(competition.scheduled_end).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
    : null

  let certificateTitle = 'CERTIFICATE OF PARTICIPATION'
  let achievementPhrase = 'for actively participating in'
  if (certificate?.certificate_type === 'first_prize') {
    certificateTitle = 'CERTIFICATE OF MERIT - FIRST PRIZE'
    achievementPhrase = 'for securing First Prize in'
  } else if (certificate?.certificate_type === 'second_prize') {
    certificateTitle = 'CERTIFICATE OF MERIT - SECOND PRIZE'
    achievementPhrase = 'for securing Second Prize in'
  } else if (certificate?.certificate_type === 'third_prize') {
    certificateTitle = 'CERTIFICATE OF MERIT - THIRD PRIZE'
    achievementPhrase = 'for securing Third Prize in'
  }

  const issuedDateStr = certificate?.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })

  const activeSignatories =
    signatories && signatories.length > 0
      ? signatories
      : [
          {
            id: 'sig-1',
            name: 'Dr. Sandeep Bhoyar',
            designation: 'Microbiologist',
            organization: 'Metropolitan Surveillance Unit (MSU), Nagpur',
            organizationLine2: 'Nagpur Municipal Corporation, Nagpur',
            signatureUrl: '/signatures/dr_sandeep_bhoyar_signature.png',
          },
          {
            id: 'sig-2',
            name: 'Dr. Deepak Selokar',
            designation: 'Medical Officer Health (MOH)',
            organization: 'Nagpur Municipal Corporation, Nagpur',
            organizationLine2: '',
            signatureUrl: '/signatures/dr_deepak_selokar_signature.png',
          },
        ]

  return (
    <div className={`min-h-screen min-h-[100dvh] bg-slate-50 text-gray-900 py-3 sm:py-6 px-3 sm:px-6 flex flex-col ${!certificate ? 'justify-center' : ''}`}>
      <div className={`mx-auto w-full space-y-3 sm:space-y-4 ${!certificate ? 'max-w-md' : 'max-w-3xl'}`}>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-[11px] sm:text-xs text-gray-400 font-mono">
            Attempt ID: {attemptId.slice(0, 8)}...
          </span>
        </div>

        {/* STATE A: Pre-Finalization / Timer Running — Single-Screen Unified Card (Zero Scroll & Zero Repetition) */}
        {!certificate ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-sm text-center space-y-3 sm:space-y-3.5">

            <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                Quiz Successfully Submitted!
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                {competition?.title || 'World AMR Awareness Week National Quiz Competition 2026'}
              </p>
            </div>

            {/* Candidate Pill */}
            <div className="inline-flex items-center justify-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-100 px-3 py-1 rounded-xl text-xs font-semibold max-w-full">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span className="truncate">{profile?.full_name} · {profile?.college_name || 'Pharmacy Officer'}</span>
            </div>

            {/* Compact Stats Row */}
            <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
              <div className="bg-slate-50 rounded-xl p-2 border border-gray-100">
                <div className="text-base font-bold text-indigo-700">{formatTime(timeSpentSeconds)}</div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Time Taken</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-2 border border-gray-100">
                <div className="text-base font-bold text-emerald-700">{total} Questions</div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Submitted</div>
              </div>
            </div>

            {/* Auto-Unlock Countdown */}
            {secondsUntilUnlock !== null && secondsUntilUnlock > 0 ? (
              <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-sm space-y-0.5">
                <div className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">
                  Results &amp; Certificate Unlock In
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400">
                  {formatTime(secondsUntilUnlock)}
                </div>
                {endTimeLabel && (
                  <div className="text-[10px] text-slate-400 font-medium">
                    Quiz closes at {endTimeLabel}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-3 sm:p-4 rounded-2xl space-y-2">
                <div className="text-xs font-semibold flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-700" />
                  <span>Finalizing results &amp; issuing official certificate...</span>
                </div>
                <button
                  onClick={() => void loadResult(true)}
                  disabled={finalizingNow}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Refresh Status Now
                </button>
              </div>
            )}

            {/* Single crisp explanation note without repetition */}
            <p className="text-[11px] text-gray-500 leading-relaxed max-w-xs mx-auto">
              Your score, answer key, and verified certificate will unlock automatically once the quiz ends and will also be sent to your email.
            </p>

            {/* Direct action button */}
            <div className="pt-0.5">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <span>Go to Dashboard</span>
              </Link>
            </div>
          </div>
        ) : (
          /* STATE B: Post-Finalization — Full Certificate & Final Score Presentation */
          <>
            {/* Email Dispatch Notice */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Official Certificate Issued!
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Your final score and rank have been computed. Your verified certificate is ready to download below and has also been emailed.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold shrink-0 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>PDF Available</span>
              </div>
            </div>

            {/* Final Scorecard */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-5 sm:p-8 shadow-sm text-center relative overflow-hidden">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 mb-4">
                <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900">
                Quiz Result &amp; Score
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                {competition?.title || 'World AMR Awareness Week National Quiz Competition 2026'}
              </p>

              {/* Stats Badges */}
              <div className={`grid ${rank ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-2 sm:gap-3 my-5 sm:my-6 max-w-md mx-auto`}>
                <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-gray-100">
                  <div className="text-base sm:text-2xl font-extrabold text-blue-700 whitespace-nowrap">
                    {score} / {total}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold mt-0.5">Score</div>
                </div>

                <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-gray-100">
                  <div className="text-base sm:text-2xl font-extrabold text-emerald-600">
                    {percentage}%
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold mt-0.5">Accuracy</div>
                </div>

                <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-gray-100">
                  <div className="text-base sm:text-2xl font-extrabold text-indigo-700">
                    {formatTime(timeSpentSeconds)}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold mt-0.5">Time Taken</div>
                </div>

                {rank && (
                  <div className="bg-amber-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-amber-200">
                    <div className="text-base sm:text-2xl font-extrabold text-amber-700">
                      #{rank}
                    </div>
                    <div className="text-[10px] text-amber-700 uppercase font-semibold mt-0.5">Final Rank</div>
                  </div>
                )}
              </div>

              {/* Candidate Info Summary */}
              <div className="inline-flex flex-wrap items-center justify-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-100 px-3.5 py-2 rounded-2xl text-xs font-medium max-w-full leading-snug">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span className="break-words">{profile?.full_name} · {profile?.college_name}</span>
              </div>
            </div>

            {/* Digital Certificate Preview Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {certificate.certificate_type !== 'participation' ? (
                    <Medal className="w-5 h-5 text-amber-500 shrink-0" />
                  ) : (
                    <Award className="w-5 h-5 text-amber-500 shrink-0" />
                  )}
                  <h3 className="font-bold text-sm text-gray-900">Your Official Digital Certificate</h3>
                </div>
                <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${awardInfo.badgeClass}`}>
                  {awardInfo.badge}
                </span>
              </div>

              {/* Official Certificate Preview Card (1:1 Identical to Downloaded Official PDF) */}
              <div
                id="certificate-card-preview"
                className="relative bg-[#feffff] p-2 sm:p-3 rounded-2xl border-[4px] border-[#1e3a8a] shadow-xl text-center select-none overflow-hidden"
              >
                {/* Inner Golden Amber Border matching PDF */}
                <div className="relative border-2 border-[#d97706] p-4 sm:p-7 rounded-xl bg-[#feffff]">
                  {/* Top 4 Official Partner Logos */}
                  <div className="flex items-center justify-between gap-2 sm:gap-4 pb-2 border-b border-amber-200/60">
                    {/* Left Logos: NMC & NCDC */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/nmc.png"
                        alt="NMC Nagpur"
                        crossOrigin="anonymous"
                        className="h-9 sm:h-12 w-auto object-contain drop-shadow-xs"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/ncdc.png"
                        alt="NCDC"
                        crossOrigin="anonymous"
                        className="h-9 sm:h-12 w-auto object-contain drop-shadow-xs"
                      />
                    </div>

                    {/* Center Header Authority */}
                    <div className="min-w-0 flex-1 px-1 sm:px-2 text-center">
                      <div className="text-[10px] sm:text-xs md:text-sm font-black tracking-wide text-[#1e3a8a] uppercase leading-tight">
                        NAGPUR MUNICIPAL CORPORATION (NMC), NAGPUR
                      </div>
                      <div className="text-[8px] sm:text-[10px] md:text-xs font-bold tracking-wider text-slate-700 uppercase mt-0.5">
                        METROPOLITAN SURVEILLANCE UNIT (MSU), NAGPUR
                      </div>
                      <div className="text-[7px] sm:text-[9px] font-medium text-slate-500 hidden sm:block mt-0.5">
                        National Awareness Initiative · Antimicrobial Resistance (AMR) Containment
                      </div>
                    </div>

                    {/* Right Logos: NHM & One Health */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/nhm.png"
                        alt="NHM"
                        crossOrigin="anonymous"
                        className="h-9 sm:h-12 w-auto object-contain drop-shadow-xs"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/onehealth.png"
                        alt="One Health Mission"
                        crossOrigin="anonymous"
                        className="h-9 sm:h-12 w-auto object-contain drop-shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Event Ribbon */}
                  <div className="mt-3 sm:mt-4 text-[10px] sm:text-xs md:text-sm font-extrabold tracking-widest text-[#b45309] uppercase">
                    WORLD AMR AWARENESS WEEK (WAAW) 2026
                  </div>

                  {/* Certificate Title */}
                  <h2 className="text-sm sm:text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight mt-1 font-serif">
                    {certificateTitle}
                  </h2>

                  {/* Presentation Line */}
                  <div className="text-xs sm:text-sm italic font-serif text-slate-500 mt-2 sm:mt-2.5">
                    This is proudly presented to
                  </div>

                  {/* Participant Name with Golden Accent Line */}
                  <div className="my-2 sm:my-2.5">
                    <div className="text-base sm:text-2xl md:text-3xl font-black text-[#1e3a8a] uppercase tracking-wide break-words px-2 font-sans">
                      {profile?.full_name}
                    </div>
                    <div className="h-[2px] bg-[#d97706] w-36 sm:w-56 mx-auto mt-1 sm:mt-1.5 rounded-full" />
                  </div>

                  {/* Designation / Health Facility */}
                  <div className="text-xs sm:text-sm font-bold text-slate-700 break-words px-2">
                    {(!profile?.course || profile.course.toLowerCase() === 'pharmacy officer' || profile.course.toLowerCase() === 'pharmacist')
                      ? `Pharmacy Officer, ${profile?.college_name || 'Nagpur'}`
                      : `${profile?.college_name}${profile?.course ? ` (${profile.course})` : ''}`}
                  </div>

                  {/* Commendation Paragraph */}
                  <p className="text-[11px] sm:text-xs text-slate-600 max-w-xl mx-auto leading-relaxed mt-2 px-2">
                    {achievementPhrase} the Online Quiz Competition for Pharmacy Officers on Antimicrobial Resistance (AMR) and demonstrating commitment to Rational Drug Use and Antimicrobial Stewardship.
                  </p>

                  {/* Score Obtained */}
                  <div className="mt-1.5 text-xs sm:text-sm font-bold text-[#1e3a8a]">
                    Score Obtained: {score} / {total}
                  </div>

                  {/* Official One Health / AMR Slogan Block */}
                  <div className="mt-3 sm:mt-4 py-2 border-y border-amber-200/60 font-serif font-bold text-[#0b2566] leading-tight space-y-0.5">
                    <div className="text-[11px] sm:text-xs md:text-sm tracking-wider uppercase">
                      ONE HEALTH, ONE ACTION
                    </div>
                    <div className="text-[11px] sm:text-xs md:text-sm tracking-wider uppercase text-amber-800">
                      PREVENT AMR NOW!
                    </div>
                    <div className="text-[9px] sm:text-[11px] font-sans font-medium text-slate-600 tracking-normal pt-0.5">
                      Protect • Humans • Animals • Environment
                    </div>
                  </div>

                  {/* Bottom Row: Verification QR & Dual Official Signatories */}
                  <div className="mt-4 pt-3 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 sm:gap-6 text-left">
                    {/* Left: Cryptographic Verification QR & Security Seal */}
                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                      {qrCodeDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrCodeDataUrl}
                          alt="Offline Verification QR"
                          crossOrigin="anonymous"
                          className="w-18 h-18 sm:w-22 sm:h-22 border border-blue-200 rounded-lg p-1 bg-white shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-18 h-18 sm:w-22 sm:h-22 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">
                          QR Code
                        </div>
                      )}
                      <div className="space-y-0.5 text-left">
                        <div className="text-[10px] sm:text-xs font-bold text-[#1e3a8a] uppercase tracking-wide">
                          Scan QR to Verify
                        </div>
                        <div className="text-[9px] sm:text-[11px] font-mono text-slate-600 break-all">
                          ID: <span className="font-bold text-slate-900">{certificate.certificate_number}</span>
                        </div>
                        {authCode && (
                          <div className="text-[8px] sm:text-[10px] font-mono font-medium text-blue-700 break-all">
                            Seal: {authCode}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Dynamic Official Signatories */}
                    <div className="flex items-end justify-center sm:justify-end gap-5 sm:gap-8 flex-wrap w-full sm:w-auto">
                      {activeSignatories.map((sig: any, idx: number) => {
                        const isDrSandeep = sig.name?.toLowerCase().includes('sandeep')
                        const isDrDeepak = sig.name?.toLowerCase().includes('deepak') || sig.name?.toLowerCase().includes('selokar')
                        const sigImg = isDrSandeep
                          ? '/signatures/dr_sandeep_bhoyar_signature.png'
                          : isDrDeepak
                          ? '/signatures/dr_deepak_selokar_signature.png'
                          : (sig.signatureUrl || null)

                        return (
                          <div key={sig.id || idx} className="text-center min-w-[125px] sm:min-w-[155px] max-w-[185px]">
                            {/* Signature Image above the line */}
                            <div className="h-9 sm:h-11 flex items-end justify-center mb-1">
                              {sigImg ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={sigImg}
                                  alt={sig.name}
                                  crossOrigin="anonymous"
                                  className="h-8 sm:h-10 w-auto object-contain max-w-[130px] drop-shadow-xs"
                                />
                              ) : (
                                <div className="h-5" />
                              )}
                            </div>

                            {/* Signature Line */}
                            <div className="border-t border-slate-400 w-full mb-1" />

                            {/* Signatory Name */}
                            <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                              {sig.name}
                            </div>

                            {/* Designation & Organization */}
                            <div className="text-[9px] sm:text-[10px] text-slate-600 font-medium leading-tight mt-0.5">
                              {sig.designation}
                            </div>
                            <div className="text-[8px] sm:text-[9px] text-slate-500 leading-tight mt-0.5">
                              {sig.organization}
                            </div>
                            {sig.organizationLine2 && (
                              <div className="text-[8px] sm:text-[9px] text-slate-400 leading-tight">
                                {sig.organizationLine2}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Bottom Center Date of Issue */}
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[9px] sm:text-xs text-slate-400 text-center">
                    Date of Issue: {issuedDateStr}
                  </div>
                </div>
              </div>

              {downloadError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {downloadError}
                </div>
              )}

              {/* PDF Download, Image Save, WhatsApp & Verify Buttons */}
              <div className="space-y-2.5 pt-1">
                {/* Primary Row: PDF & Image Download */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={handleDownloadCertificate}
                    disabled={downloading}
                    className="flex-1 py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {downloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{downloading ? 'Generating Official PDF...' : 'Download Official Certificate (PDF)'}</span>
                  </button>

                  <button
                    onClick={handleDownloadCertificateImage}
                    disabled={downloadingImage}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {downloadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                    <span>{downloadingImage ? 'Creating Image...' : 'Save as Image (PNG / Gallery)'}</span>
                  </button>
                </div>

                {/* Secondary Row: WhatsApp 1-Click Share & Online Verify */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </button>

                  {verifyUrl ? (
                    <a
                      href={verifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Verify Online</span>
                    </a>
                  ) : (
                    <Link
                      href={`/verify/${certificate.certificate_number}`}
                      className="py-2.5 px-5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Verify Online</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Question by Question Review Accordion (Only after unlock) */}
            {answerKeyUnlocked && responses.length > 0 && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                <button
                  onClick={() => setShowReview(!showReview)}
                  className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-700 rounded-xl shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">
                        Review Your Answers &amp; Explanations
                      </h3>
                      <p className="text-xs text-gray-500">
                        See correct answers, your selected options, and detailed explanations for all {responses.length} questions.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 shrink-0 self-end sm:self-center">
                    <span>{showReview ? 'Hide Answers' : 'View Answers'}</span>
                    {showReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {showReview && (
                  <div className="p-4 sm:p-5 border-t border-gray-100 space-y-5 bg-slate-50/40">
                    {responses.map((item, index) => {
                      const q = item.question
                      if (!q) return null
                      const isCorrect = item.selected_option === q.correct_option
                      const options = [
                        { key: 'A', text: q.option_a },
                        { key: 'B', text: q.option_b },
                        { key: 'C', text: q.option_c },
                        { key: 'D', text: q.option_d },
                      ]

                      return (
                        <div
                          key={q.id || index}
                          className={`p-4 rounded-2xl border transition-all ${isCorrect
                              ? 'bg-white border-emerald-200 shadow-xs'
                              : 'bg-white border-red-200 shadow-xs'
                            }`}
                        >
                          {/* Question Header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                                {index + 1}
                              </span>
                              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                {parseCategoryTopic(q.topic).displayLabel}
                              </span>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase shrink-0 ${isCorrect
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                                }`}
                            >
                              {isCorrect ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Correct
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  Incorrect
                                </>
                              )}
                            </span>
                          </div>

                          {/* Question Text */}
                          <p className="text-sm font-semibold text-gray-900 mb-3">
                            {q.question_text}
                          </p>

                          {/* Options Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                            {options.map((opt) => {
                              const isSelected = item.selected_option === opt.key
                              const isThisCorrect = q.correct_option === opt.key

                              let optClass = 'bg-gray-50 border-gray-200 text-gray-700'
                              if (isThisCorrect) {
                                optClass = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold'
                              } else if (isSelected && !isCorrect) {
                                optClass = 'bg-red-50 border-red-400 text-red-900 font-semibold'
                              }

                              return (
                                <div
                                  key={opt.key}
                                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${optClass}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-bold">{opt.key}.</span>
                                    <span className="break-words">{opt.text}</span>
                                  </div>
                                  {isThisCorrect && (
                                    <span className="text-[10px] text-emerald-700 font-bold uppercase shrink-0">
                                      ✓ Correct
                                    </span>
                                  )}
                                  {isSelected && !isThisCorrect && (
                                    <span className="text-[10px] text-red-700 font-bold uppercase shrink-0">
                                      ✗ Yours
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Explanation */}
                          {q.explanation && (
                            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-950">
                              <span className="font-bold text-blue-900">Explanation: </span>
                              <span>{q.explanation}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
