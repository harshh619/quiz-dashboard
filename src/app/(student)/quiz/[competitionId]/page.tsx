'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/utils'
import { 
  Clock, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, 
  Send, ShieldAlert, Check, HelpCircle 
} from 'lucide-react'

interface QuestionItem {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  topic: string
  display_order: number
  selected_option: 'A' | 'B' | 'C' | 'D' | null
}

export default function LiveQuizPage({
  params,
}: {
  params: Promise<{ competitionId: string }>
}) {
  const resolvedParams = use(params)
  const competitionId = resolvedParams.competitionId
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
  const [timeRemaining, setTimeRemaining] = useState<number>(600) // 10 mins default
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [warningCount, setWarningCount] = useState(0)
  const [showTabWarning, setShowTabWarning] = useState(false)

  // 1. Initialize Quiz
  useEffect(() => {
    async function initQuiz() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setStudentId(user.id)

        // Call RPC function to start or resume attempt
        const { data, error: rpcError } = await supabase.rpc('start_or_resume_quiz_attempt', {
          p_competition_id: competitionId,
          p_student_id: user.id,
        })

        if (rpcError) throw rpcError

        if (!data.success) {
          if (data.attempt_id) {
            router.push(`/result/${data.attempt_id}`)
            return
          }
          throw new Error(data.error || 'Failed to start quiz')
        }

        setAttemptId(data.attempt_id)
        setTimeRemaining(data.time_remaining_seconds || 600)
        
        const qList: QuestionItem[] = data.questions || []
        setQuestions(qList)

        // Hydrate existing answers from server & localStorage fallback
        const initialAnswers: Record<string, 'A' | 'B' | 'C' | 'D'> = {}
        let localCachedAnswers: Record<string, 'A' | 'B' | 'C' | 'D'> = {}
        try {
          const cached = localStorage.getItem(`quiz_answers_${data.attempt_id}`)
          if (cached) localCachedAnswers = JSON.parse(cached)
        } catch {}

        qList.forEach(q => {
          if (q.selected_option) {
            initialAnswers[q.id] = q.selected_option
          } else if (localCachedAnswers[q.id]) {
            initialAnswers[q.id] = localCachedAnswers[q.id]
          }
        })
        setAnswers(initialAnswers)

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error loading quiz'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    initQuiz()
  }, [competitionId, router, supabase])

  // 2. Submit Handler
  const handleSubmitQuiz = useCallback(async (isAuto = false) => {
    if (!attemptId || !studentId || isSubmitting) return
    setIsSubmitting(true)

    try {
      const { data, error: submitError } = await supabase.rpc('submit_quiz_attempt', {
        p_attempt_id: attemptId,
        p_student_id: studentId,
      })

      if (submitError) throw submitError

      router.push(`/result/${attemptId}`)
    } catch (err) {
      console.error('Submission failed:', err)
      if (!isAuto) {
        alert('Submission failed. Please check internet and retry.')
        setIsSubmitting(false)
      } else {
        router.push(`/result/${attemptId}`)
      }
    }
  }, [attemptId, studentId, isSubmitting, router, supabase])

  // 3. Countdown Timer
  useEffect(() => {
    if (loading || isSubmitting || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmitQuiz(true) // Auto-submit when time expires
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, isSubmitting, timeRemaining, handleSubmitQuiz])

  // 4. Tab Switch / Window Blur Anti-Cheating Monitor
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting) {
        setWarningCount(prev => prev + 1)
        setShowTabWarning(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isSubmitting])

  // 5. Select Option & Autosave
  const handleSelectOption = async (option: 'A' | 'B' | 'C' | 'D') => {
    const currentQ = questions[currentIndex]
    if (!currentQ || !attemptId || !studentId) return

    // Optimistic UI update & localStorage backup
    setAnswers(prev => {
      const updated = { ...prev, [currentQ.id]: option }
      try {
        localStorage.setItem(`quiz_answers_${attemptId}`, JSON.stringify(updated))
      } catch {}
      return updated
    })
    setAutosaveStatus('saving')

    try {
      const { error: saveError } = await supabase.rpc('autosave_quiz_response', {
        p_attempt_id: attemptId,
        p_student_id: studentId,
        p_question_id: currentQ.id,
        p_selected_option: option,
      })

      if (saveError) throw saveError
      setAutosaveStatus('saved')
    } catch (err) {
      console.error('Autosave failed:', err)
      setAutosaveStatus('error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p className="text-xs text-blue-300">Synchronizing with examination server...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-6 text-center space-y-4 shadow-lg">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Unable to Start Exam</h2>
          <p className="text-xs text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-5 py-2.5 bg-blue-700 text-white text-xs font-semibold rounded-xl hover:bg-blue-800"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const totalQuestions = questions.length || 30
  const isUrgentTime = timeRemaining <= 120 // Less than 2 minutes

  const options = [
    { key: 'A', text: currentQ?.option_a },
    { key: 'B', text: currentQ?.option_b },
    { key: 'C', text: currentQ?.option_c },
    { key: 'D', text: currentQ?.option_d },
  ] as const

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900 flex flex-col select-none">
      
      {/* Top Fixed Header with Synchronized Timer */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center text-[11px] shrink-0">
              AMR
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-900 truncate max-w-[110px] sm:max-w-xs hidden xs:block sm:block">
                WAAW Quiz 2026
              </div>
              <div className="text-[11px] sm:text-[10px] font-semibold sm:font-normal text-gray-700 sm:text-gray-500 whitespace-nowrap">
                Q {currentIndex + 1} / {totalQuestions}
              </div>
            </div>
          </div>

          {/* Synchronized Server Countdown Clock */}
          <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-bold tracking-wider shrink-0 ${
            isUrgentTime 
              ? 'bg-red-50 border-red-300 text-red-600 animate-pulse' 
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isUrgentTime ? 'text-red-600' : 'text-blue-700'}`} />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          {/* Autosave status indicator (desktop) */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-gray-500 font-medium shrink-0">
            {autosaveStatus === 'saving' && (
              <span className="text-amber-600 flex items-center gap-1">Saving...</span>
            )}
            {autosaveStatus === 'saved' && (
              <span className="text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Autosaved
              </span>
            )}
            {autosaveStatus === 'error' && (
              <span className="text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Retry save
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Finish &amp;</span> Submit
          </button>
        </div>
      </header>

      {/* Main Examination Body */}
      <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Left Column: Active Question & Options (8 cols) */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-8 shadow-xs">
            
            {/* Topic, Autosave (mobile) & Display number */}
            <div className="flex items-center justify-between gap-2 mb-3.5 sm:mb-4 pb-3 border-b border-gray-100 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider truncate max-w-[65%]">
                {currentQ?.topic || 'AMR Topic'}
              </span>
              <div className="flex items-center gap-2.5 ml-auto">
                <span className="md:hidden text-[10px] font-medium">
                  {autosaveStatus === 'saving' && <span className="text-amber-600">Saving...</span>}
                  {autosaveStatus === 'saved' && <span className="text-emerald-600 flex items-center gap-0.5"><Check className="w-3 h-3" />Saved</span>}
                  {autosaveStatus === 'error' && <span className="text-red-500">Offline backup</span>}
                </span>
                <span className="text-xs text-gray-400 font-mono font-semibold">
                  Q.{currentIndex + 1}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <h3 className="text-[15px] sm:text-lg font-bold text-gray-900 leading-relaxed mb-5 sm:mb-6 break-words">
              {currentQ?.question_text}
            </h3>

            {/* MCQ Options */}
            <div className="space-y-2.5 sm:space-y-3">
              {options.map((opt) => {
                const isSelected = answers[currentQ.id] === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border text-[13px] sm:text-sm flex items-start gap-3 sm:gap-3.5 transition-all active:scale-[0.99] ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 text-blue-950 font-semibold ring-1 ring-blue-600 shadow-xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="pt-0.5 leading-snug break-words min-w-0 flex-1">{opt.text}</span>
                  </button>
                )
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex-1 sm:flex-none justify-center px-4 py-2.5 sm:py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                disabled={currentIndex === totalQuestions - 1}
                className="flex-1 sm:flex-none justify-center px-5 py-2.5 sm:py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Question Palette & Progress (4 cols) */}
        <div className="lg:col-span-4 space-y-4 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs lg:sticky lg:top-20">
            
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Question Palette
              </h4>
              <span className="text-xs font-semibold text-blue-700">
                {answeredCount} / {totalQuestions} Answered
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>

            {/* Grid of 30 questions */}
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 sm:gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id]
                const isCurrent = idx === currentIndex

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg font-mono text-xs font-bold transition-all relative ${
                      isCurrent
                        ? 'ring-2 ring-blue-600 ring-offset-1 text-white bg-blue-700'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500 pt-5 mt-4 border-t border-gray-100">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Answered
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span> Unanswered
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Current
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h4 className="text-base font-bold text-gray-900">Confirm Final Submission?</h4>
              <p className="text-xs text-gray-500 mt-1">
                You have answered <span className="font-bold text-gray-900">{answeredCount}</span> out of <span className="font-bold text-gray-900">{totalQuestions}</span> questions.
              </p>
              {answeredCount < totalQuestions && (
                <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                  ⚠️ You have {totalQuestions - answeredCount} unanswered questions!
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Back to Exam
              </button>
              <button
                type="button"
                onClick={() => handleSubmitQuiz(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switch Warning Modal */}
      {showTabWarning && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-3 shadow-2xl text-center border-t-4 border-amber-500">
            <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
            <h4 className="font-bold text-gray-900 text-sm">Security Notice: Tab Switch Detected</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Leaving the examination window or switching tabs is logged by the Proctoring Engine (Warning #{warningCount}). Please stay on this tab until completion.
            </p>
            <button
              onClick={() => setShowTabWarning(false)}
              className="w-full mt-2 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl"
            >
              I Understand, Continue Exam
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
