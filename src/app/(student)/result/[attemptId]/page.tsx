'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatTime } from '@/lib/utils'
import { parseCategoryTopic } from '@/lib/questionCategories'
import { renderPdfAsImage, type PdfImageResult } from '@/lib/pdfToImage'
import {
  Trophy, Award, Download, ArrowLeft, QrCode, Sparkles, Clock,
  ShieldCheck, CheckCircle, XCircle, ChevronDown, ChevronUp,
  BookOpen, Mail, Loader2, Medal, Lock, Share2, ImageIcon, Check, X
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
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [sharedStatus, setSharedStatus] = useState<'idle' | 'opened'>('idle')
  const [imagePreviewModal, setImagePreviewModal] = useState<{
    url: string
    fileName: string
    file?: File
  } | null>(null)
  const [certPreviewUrl, setCertPreviewUrl] = useState<string | null>(null)
  const [certPreviewLoading, setCertPreviewLoading] = useState(false)
  const [certPdfImage, setCertPdfImage] = useState<PdfImageResult | null>(null)

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

      const isCertActive = data.competition?.certificate_enabled === true
      const isAlreadyUnlocked = isCertActive
        ? Boolean(data.certificate && data.answerKeyUnlocked && data.scoreUnlocked)
        : Boolean(data.answerKeyUnlocked && data.scoreUnlocked)

      if (data.unlockAt && !isAlreadyUnlocked) {
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

  // Live countdown to auto-unlock score, rankings & answer key once exam window closes!
  useEffect(() => {
    const isCertActive = competition?.certificate_enabled === true
    const isFullyUnlocked = isCertActive
      ? Boolean(certificate && answerKeyUnlocked && scoreUnlocked)
      : Boolean(answerKeyUnlocked && scoreUnlocked)

    if (isFullyUnlocked || !unlockAt) return

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
  }, [competition, certificate, answerKeyUnlocked, scoreUnlocked, unlockAt, serverOffsetMs, loadResult])

  // Render official PDF certificate as image for preview (once certificate is available and enabled)
  useEffect(() => {
    if (!certificate || !competition?.certificate_enabled || certPreviewUrl || certPreviewLoading) return
    setCertPreviewLoading(true)

    const fileName = `AMR_Certificate_${certificate.certificate_number}.png`
    renderPdfAsImage(`/api/certificate/${attemptId}/pdf`, fileName, 2.5)
      .then((result) => {
        setCertPreviewUrl(result.blobUrl)
        setCertPdfImage(result)
      })
      .catch((err) => {
        console.error('Failed to render certificate preview:', err)
      })
      .finally(() => {
        setCertPreviewLoading(false)
      })
  }, [certificate, competition, attemptId, certPreviewUrl, certPreviewLoading])

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
      // Delay revoke so mobile download managers have ample time to complete
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 60000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed'
      setDownloadError(msg)
    } finally {
      setDownloading(false)
    }
  }

  // 1-Click High-Res Image (PNG) Download — renders official PDF certificate as PNG
  const handleDownloadCertificateImage = async () => {
    if (!certificate) return
    setDownloadingImage(true)
    setDownloadError(null)

    try {
      const fileName = `AMR_Certificate_${certificate.certificate_number}.png`

      // Reuse already-rendered PDF image if available, otherwise render fresh
      let result = certPdfImage
      if (!result) {
        result = await renderPdfAsImage(`/api/certificate/${attemptId}/pdf`, fileName, 2.5)
        setCertPreviewUrl(result.blobUrl)
        setCertPdfImage(result)
      }

      const { blobUrl, file } = result

      // 1. Mobile Native Share Sheet (Save to Gallery / Photos directly)
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] }) &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      ) {
        try {
          await navigator.share({
            files: [file],
            title: 'AMR Official Quiz Certificate',
            text: `Certificate of ${profile?.full_name || 'Participant'} - Nagpur Municipal Corporation`,
          })
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') {
            // User cancelled native share sheet
          }
        }
      }

      // 2. Programmatic Blob Download
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()

      // 3. Open in-app Preview Modal so user can always view the full image and save to Gallery
      setImagePreviewModal({
        url: blobUrl,
        fileName,
        file,
      })

      // Delayed revoke so mobile download managers have ample time to write to disk
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
      }, 120000)
    } catch (err: unknown) {
      console.error('Save certificate image error:', err)
      const msg = err instanceof Error ? err.message : 'Failed to save certificate image'
      setDownloadError(msg)
    } finally {
      setDownloadingImage(false)
    }
  }

  // 1-Click WhatsApp Share
  const handleWhatsAppShare = async () => {
    setSharingWhatsApp(true)
    setDownloadError(null)

    const isCertEnabled = Boolean(competition?.certificate_enabled)
    const certUrl =
      isCertEnabled && certificate
        ? (verifyUrl ||
          (typeof window !== 'undefined'
            ? `${window.location.origin}/verify/${certificate.certificate_number}`
            : ''))
        : ''

    const desig = profile?.course || 'Pharmacy Officer'
    const facility = profile?.college_name || 'UPHC Nagpur'

    let msg = `🏥 *World AMR Awareness Week (WAAW) 2026 – Online Quiz Competition*\n*Metropolitan Surveillance Unit (MSU), Nagpur | NMC Nagpur*\n\n🎉 I participated as a ${desig} representing *${facility}* and scored *${score}/${total}* (Accuracy: *${percentage}%*)!\n${rank ? `🏆 Final Rank: *#${rank}*\n` : ''}`
    if (isCertEnabled && certUrl) {
      msg += `📜 *Verify My Official Certificate:* ${certUrl}\n`
    }
    msg += `\n#WAAW2026 #StopAMR #OneHealth #MSUNagpur`

    try {
      // If certificates are disabled or no cert, share text directly
      if (!isCertEnabled || !certificate) {
        setSharedStatus('opened')
        setTimeout(() => setSharedStatus('idle'), 8000)

        const isMobile =
          typeof navigator !== 'undefined' &&
          /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        if (isMobile) {
          window.location.href = `whatsapp://send?text=${encodeURIComponent(msg)}`
        } else {
          const webUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`
          window.open(webUrl, '_blank')
        }
        return
      }

      // 1. Fetch official PDF certificate blob
      let pdfFile: File | null = null
      let pdfBlob: Blob | null = null
      try {
        const res = await fetch(`/api/certificate/${attemptId}/pdf`)
        if (res.ok) {
          pdfBlob = await res.blob()
          const fileName = `AMR_Certificate_${certificate.certificate_number}.pdf`
          pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })
        }
      } catch (e) {
        console.warn('Could not fetch PDF for attachment:', e)
      }

      setSharedStatus('opened')
      setTimeout(() => setSharedStatus('idle'), 8000)

      // 2. Native Web Share with attached PDF file (Android / iOS / Mobile)
      if (
        pdfFile &&
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        try {
          await navigator.share({
            title: 'Official AMR Quiz Certificate (PDF)',
            text: msg,
            files: [pdfFile],
          })
          return
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') {
            // User cancelled native share sheet intentionally
            return
          }
        }
      }

      // 3. Fallback: If native file share is not supported (e.g. Desktop PC or unsupported browser):
      // Download the PDF file to user's device so they have it immediately
      if (pdfBlob) {
        const url = window.URL.createObjectURL(pdfBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `AMR_Certificate_${certificate.certificate_number}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => window.URL.revokeObjectURL(url), 60000)
      }

      // 4. Launch WhatsApp with message & link
      const isMobile =
        typeof navigator !== 'undefined' &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isMobile) {
        window.location.href = `whatsapp://send?text=${encodeURIComponent(msg)}`
      } else {
        const webUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`
        window.open(webUrl, '_blank')
      }
    } catch (err: unknown) {
      console.error('WhatsApp share error:', err)
      const errText = err instanceof Error ? err.message : 'Failed to share on WhatsApp'
      setDownloadError(errText)
    } finally {
      setSharingWhatsApp(false)
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
  const durationLimit = competition?.duration_seconds || 600

  let timeSpentSeconds = durationLimit
  if (attempt?.started_at && attempt?.submitted_at) {
    const diff = Math.floor(
      (new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 1000
    )
    timeSpentSeconds = Math.max(0, Math.min(diff, durationLimit))
  }

  const awardInfo = getAwardDisplay(certificate?.certificate_type)
  const certsEnabled = Boolean(competition?.certificate_enabled)
  const isResultsUnlocked = Boolean(
    scoreUnlocked ||
    certificate ||
    (competition?.status === 'results_published') ||
    (competition?.status === 'closed')
  )

  const endTimeLabel = competition?.scheduled_end
    ? new Date(competition.scheduled_end).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
    : null

  return (
    <div className={`min-h-screen min-h-[100dvh] bg-slate-50 text-gray-900 py-3 sm:py-6 px-3 sm:px-6 flex flex-col ${!isResultsUnlocked ? 'justify-center' : ''}`}>
      <div className={`mx-auto w-full space-y-3 sm:space-y-4 ${!isResultsUnlocked ? 'max-w-md' : 'max-w-3xl'}`}>

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
        {!isResultsUnlocked ? (
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
              <span className="truncate">{profile?.full_name} · {profile?.course || 'Pharmacy Officer'} · {profile?.college_name || 'NMC Nagpur'}</span>
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
                  Results Unlock In
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
                  <span>Finalizing results &amp; rankings...</span>
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
              {certsEnabled
                ? 'Your score, answer key, and verified certificate will unlock automatically once the quiz ends and will also be sent to your email.'
                : 'Your score, final rank, and answer key with detailed explanations will unlock automatically once the quiz closes.'}
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
            {/* Notice Banner */}
            {certsEnabled ? (
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
            ) : (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Official Quiz Results Published!
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                      Your final score, accuracy, and rank have been evaluated. Detailed answers with explanations are unlocked below.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold shrink-0 shadow-2xs">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Rankings Final</span>
                </div>
              </div>
            )}

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
                <span className="break-words">{profile?.full_name} · {profile?.course || 'Pharmacy Officer'} · {profile?.college_name || 'NMC Nagpur'}</span>
              </div>
            </div>

            {/* Digital Certificate Preview Card OR Clean Result Share Card (if disabled) */}
            {certsEnabled && certificate ? (
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

                {/* Official Certificate Preview — PDF rendered as high-res image */}
                <div
                  className="relative rounded-2xl border-2 border-indigo-200 overflow-hidden bg-slate-50 transition-all shadow-md"
                >
                  {certPreviewUrl ? (
                    <div className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={certPreviewUrl}
                        alt="Official Certificate Preview"
                        className="w-full h-auto object-contain block select-none cursor-pointer"
                        onClick={() => {
                          if (certPdfImage) {
                            setImagePreviewModal({
                              url: certPdfImage.blobUrl,
                              fileName: certPdfImage.file.name,
                              file: certPdfImage.file,
                            })
                          }
                        }}
                        title="Click to expand / view full screen"
                      />
                      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-1 rounded-lg">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Official Certificate Preview</span>
                      </div>
                    </div>
                  ) : certPreviewLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      <p className="text-xs text-gray-600 font-medium">Generating official certificate preview...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-3 text-center px-4">
                      <Award className="w-10 h-10 text-gray-300" />
                      <p className="text-xs text-gray-500 font-medium">Could not render certificate preview.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setCertPreviewLoading(true)
                          const fileName = `AMR_Certificate_${certificate.certificate_number}.png`
                          renderPdfAsImage(`/api/certificate/${attemptId}/pdf`, fileName, 2.5)
                            .then((result) => {
                              setCertPreviewUrl(result.blobUrl)
                              setCertPdfImage(result)
                            })
                            .catch((err) => console.error('Retry preview failed:', err))
                            .finally(() => setCertPreviewLoading(false))
                        }}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Retry Loading
                      </button>
                    </div>
                  )}
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
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        onClick={handleWhatsAppShare}
                        disabled={sharingWhatsApp}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${sharedStatus === 'opened'
                          ? 'bg-emerald-700 text-white ring-2 ring-emerald-400/50'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                      >
                        {sharingWhatsApp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Attaching Official PDF...</span>
                          </>
                        ) : sharedStatus === 'opened' ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-200" />
                            <span>WhatsApp Opened!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4" />
                            <span>Share PDF on WhatsApp</span>
                          </>
                        )}
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

                    {sharedStatus === 'opened' && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 text-center flex items-center justify-center gap-1.5 shadow-2xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>WhatsApp launched with your official certificate PDF attached!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Official Results Finalized</h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Your score, rank, and detailed question reviews have been evaluated and recorded. You can share your performance score directly on WhatsApp.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleWhatsAppShare}
                  disabled={sharingWhatsApp}
                  className="w-full sm:w-auto py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Score on WhatsApp</span>
                </button>
              </div>
            )}

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

      {/* High-Res Certificate Image Preview & Save Modal */}
      {imagePreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl relative border border-gray-200 text-center my-auto animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setImagePreviewModal(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certificate Image Ready!</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                Official Certificate (PNG Image)
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Tap &amp; hold (long-press) on the certificate image to save directly to Gallery, or use the buttons below.
              </p>
            </div>

            {/* Certificate Image View */}
            <div className="rounded-xl overflow-hidden border-2 border-indigo-200 shadow-md bg-slate-50 max-h-[55vh] flex items-center justify-center p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreviewModal.url}
                alt="AMR Certificate"
                className="w-full h-auto max-h-[52vh] object-contain rounded-lg shadow-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = imagePreviewModal.url
                  a.download = imagePreviewModal.fileName
                  document.body.appendChild(a)
                  a.click()
                  a.remove()
                }}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Image (PNG)</span>
              </button>

              {imagePreviewModal.file && typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.share({
                        files: [imagePreviewModal.file!],
                        title: 'AMR Quiz Certificate',
                        text: `Official Certificate - ${certificate?.certificate_number}`,
                      })
                    } catch { }
                  }}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Save to Gallery / Share</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setImagePreviewModal(null)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-[11px] text-gray-400">
              💡 Mobile Tip: You can also tap and hold (long-press) on the certificate image above and select &quot;Download Image&quot; or &quot;Save to Photos&quot;.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
