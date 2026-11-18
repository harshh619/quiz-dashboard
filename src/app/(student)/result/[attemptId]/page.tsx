'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatTime, formatDate } from '@/lib/utils'
import { parseCategoryTopic } from '@/lib/questionCategories'
import { 
  Trophy, Award, CheckCircle2, Download, ArrowLeft, 
  Share2, QrCode, Sparkles, Clock, Check, ShieldCheck,
  CheckCircle, XCircle, ChevronDown, ChevronUp, BookOpen, Mail
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
  const [responses, setResponses] = useState<any[]>([])
  const [showReview, setShowReview] = useState(false)
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

          // Fetch responses with questions for answer review
          const { data: respList } = await supabase
            .from('quiz_responses')
            .select('selected_option, question:question_bank(id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic)')
            .eq('attempt_id', attemptId)

          if (respList) {
            setResponses(respList)
          }

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
                Thank you for participating. <span className="font-semibold text-blue-900">Your official digital certificate (PDF) will be sent to your registered email address shortly</span> after final result synchronization.
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
          <div className="grid grid-cols-3 gap-2 sm:gap-3 my-5 sm:my-6 max-w-sm mx-auto">
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
          </div>

          {/* Candidate Info Summary */}
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-100 px-3.5 py-2 rounded-2xl text-xs font-medium max-w-full leading-snug">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span className="break-words">{profile?.full_name} · {profile?.college_name}</span>
          </div>
        </div>

        {/* Certificate Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500 shrink-0" />
              <h3 className="font-bold text-sm text-gray-900">Your Digital Certificate</h3>
            </div>
            {certificate && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Issued &amp; Verified
              </span>
            )}
          </div>

          {/* Certificate Visual Card Preview */}
          <div className="border-4 border-amber-100 rounded-2xl p-4 sm:p-6 bg-gradient-to-b from-amber-50/30 via-white to-amber-50/20 text-center relative shadow-inner">
            <div className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-amber-800 uppercase">
              WORLD AMR AWARENESS WEEK 2026
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Certificate of Completion / Participation</div>
            
            <div className="my-4">
              <span className="text-xs text-gray-400">Awarded to</span>
              <div className="text-base sm:text-lg font-bold text-gray-900 mt-0.5 break-words">{profile?.full_name}</div>
              <div className="text-xs text-gray-600 break-words">{profile?.college_name} ({profile?.course})</div>
            </div>

            <p className="text-[11px] text-gray-500 max-w-sm mx-auto leading-relaxed">
              For demonstrating exceptional commitment to Antimicrobial Stewardship in the National AMR Awareness Quiz.
            </p>

            {/* QR Code & Certificate Number */}
            <div className="mt-5 pt-4 border-t border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <div className="text-[9px] text-gray-400 uppercase font-mono">Certificate ID</div>
                <div className="text-xs font-mono font-bold text-gray-800 break-all">
                  {certificate?.certificate_number || 'AMR-WAAW-2026-PENDING'}
                </div>
              </div>

              {qrCodeDataUrl && (
                <img 
                  src={qrCodeDataUrl} 
                  alt="Verification QR" 
                  className="w-14 h-14 border border-gray-200 rounded-lg p-0.5 bg-white shadow-xs shrink-0" 
                />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleDownloadCertificate}
              disabled={downloading}
              className="flex-1 py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
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
              <div className="p-5 border-t border-gray-100 space-y-6 bg-slate-50/40">
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
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                            {parseCategoryTopic(q.topic).displayLabel}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
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
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${optClass}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{opt.key}.</span>
                                <span>{opt.text}</span>
                              </div>
                              {isThisCorrect && (
                                <span className="text-[10px] text-emerald-700 font-bold uppercase">
                                  ✓ Correct Answer
                                </span>
                              )}
                              {isSelected && !isThisCorrect && (
                                <span className="text-[10px] text-red-700 font-bold uppercase">
                                  ✗ Your Answer
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
