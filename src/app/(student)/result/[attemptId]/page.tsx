'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatTime } from '@/lib/utils'
import { parseCategoryTopic } from '@/lib/questionCategories'
import {
  Trophy, Award, Download, ArrowLeft, QrCode, Sparkles, Clock,
  ShieldCheck, CheckCircle, XCircle, ChevronDown, ChevronUp,
  BookOpen, Mail, Loader2, Medal
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
  const [authCode, setAuthCode] = useState<string | null>(null)
  const [rank, setRank] = useState<number | null>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [unlockAt, setUnlockAt] = useState<string | null>(null)
  const [serverOffsetMs, setServerOffsetMs] = useState(0)
  const [secondsUntilUnlock, setSecondsUntilUnlock] = useState<number | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [downloading, setDownloading] = useState(false)
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
      setAuthCode(data.authCode || null)
      setRank(data.rank ?? null)
      setResponses(data.responses || [])
      setUnlockAt(data.unlockAt || null)

      const offset = data.serverTime
        ? new Date(data.serverTime).getTime() - Date.now()
        : 0
      setServerOffsetMs(offset)

      if (data.unlockAt && !data.certificate) {
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

  // Live countdown to auto-unlock official certificate once exam window closes!
  useEffect(() => {
    if (certificate || !unlockAt) return

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
  }, [certificate, unlockAt, serverOffsetMs, loadResult])

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

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">

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

        {/* Email Certificate Dispatch Notice Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                Examination Finished &amp; Recorded!
              </h4>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                {certificate ? (
                  <>
                    Your final rank has been computed! <span className="font-semibold text-blue-900">Your official PDF certificate is ready to download below and has been queued/sent to your email.</span>
                  </>
                ) : (
                  <>
                    Thank you for participating. <span className="font-semibold text-blue-900">Your official certificate (Merit 1st/2nd/3rd or Participation PDF) will unlock automatically once the exam window closes</span> and will also be sent to your email.
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold shrink-0 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>PDF via Email</span>
          </div>
        </div>

        {/* Hero Scorecard */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-5 sm:p-8 shadow-sm text-center relative overflow-hidden">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 mb-4">
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900">
            Quiz Successfully Submitted!
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

        {/* Certificate Section — Only shown ONCE finalized! Before end time, show automatic unlock countdown */}
        {!certificate ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-indigo-200 p-5 sm:p-8 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center mx-auto">
              {finalizingNow ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1.5">
              <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                {finalizingNow ? 'Calculating Official Rankings...' : 'Final Rankings in Progress'}
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                Official Certificate Unlocks Automatically After Quiz Ends
              </h3>
              <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                Other participants are still completing the exam{endTimeLabel ? ` (closes at ${endTimeLabel})` : ''}. Once the exam window finishes, <strong>1st, 2nd, 3rd Prize &amp; Participation Certificates</strong> will be generated automatically and unlocked right here.
              </p>
            </div>

            {secondsUntilUnlock !== null && secondsUntilUnlock > 0 ? (
              <div className="inline-flex flex-col items-center bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-md">
                <span className="text-[10px] uppercase tracking-widest text-blue-300 font-semibold">
                  Auto-Unlock Countdown
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 mt-0.5">
                  {formatTime(secondsUntilUnlock)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="text-xs text-indigo-700 font-semibold flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Finalizing leaderboard &amp; issuing verified certificate...</span>
                </div>
                <button
                  onClick={() => void loadResult(true)}
                  disabled={finalizingNow}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Check Certificate Status Now
                </button>
              </div>
            )}
          </div>
        ) : (
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

            {/* Official Certificate Preview Card */}
            <div className={`border-4 rounded-2xl p-4 sm:p-6 text-center relative shadow-inner ${awardInfo.borderClass}`}>
              <div className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-blue-900 uppercase">
                METROPOLITAN SURVEILLANCE UNIT (MSU), NAGPUR · NMC
              </div>
              <div className="text-[10px] font-bold tracking-widest text-amber-800 uppercase mt-1">
                WORLD AMR AWARENESS WEEK (WAAW) 2026
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-gray-900 mt-1.5 uppercase">
                {awardInfo.title}
              </div>

              <div className="my-4">
                <span className="text-xs text-gray-400">Awarded to</span>
                <div className="text-base sm:text-xl font-bold text-blue-950 mt-0.5 break-words">
                  {profile?.full_name}
                </div>
                <div className="text-xs text-gray-600 break-words">
                  {profile?.college_name} ({profile?.course})
                </div>
              </div>

              <p className="text-[11px] text-gray-500 max-w-sm mx-auto leading-relaxed">
                For demonstrating commitment to Antimicrobial Stewardship in the Online Quiz Competition for Health Sciences Students.
              </p>

              {/* Verified Certificate ID, Auth Code & Self-Contained Offline QR Code */}
              <div className="mt-5 pt-4 border-t border-amber-200/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left space-y-0.5">
                  <div className="text-[9px] text-gray-400 uppercase font-mono">Verified Certificate ID</div>
                  <div className="text-xs font-mono font-bold text-gray-900 break-all">
                    {certificate.certificate_number}
                  </div>
                  {authCode && (
                    <div className="text-[10px] font-mono font-semibold text-blue-700">
                      Auth: {authCode}
                    </div>
                  )}
                </div>

                {qrCodeDataUrl && (
                  <img
                    src={qrCodeDataUrl}
                    alt="Offline Verification QR"
                    className="w-20 h-20 border border-gray-200 rounded-lg p-1 bg-white shadow-xs shrink-0"
                  />
                )}
              </div>
            </div>

            {downloadError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {downloadError}
              </div>
            )}

            {/* Real Official PDF Download & Online Verification Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
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

              <Link
                href={`/verify/${certificate.certificate_number}`}
                className="py-3 px-5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Verify Online</span>
              </Link>
            </div>
          </div>
        )}

        {/* Question by Question Review Accordion */}
        {responses.length > 0 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
            <button
              onClick={() => setShowReview(!showReview)}
              className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors text-left"
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
                      className={`p-4 rounded-2xl border transition-all ${
                        isCorrect
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
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase shrink-0 ${
                            isCorrect
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

      </div>
    </div>
  )
}
