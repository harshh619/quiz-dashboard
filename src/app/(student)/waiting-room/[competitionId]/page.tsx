'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Competition } from '@/types'
import { ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft, CalendarClock } from 'lucide-react'
import SandGlassAnimation from '@/components/quiz/SandGlassAnimation'

interface TimeLeftState {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
}

function computeTimeLeft(targetMs: number, currentMs: number): TimeLeftState {
  const diff = Math.floor((targetMs - currentMs) / 1000)
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 }
  }
  const days = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  const seconds = diff % 60
  return { days, hours, minutes, seconds, totalSeconds: diff }
}

export default function WaitingRoomPage({
  params,
}: {
  params: Promise<{ competitionId: string }>
}) {
  const resolvedParams = use(params)
  const competitionId = resolvedParams.competitionId
  const router = useRouter()
  const supabase = createClient()

  const [competition, setCompetition] = useState<Competition | null>(null)
  const [serverOffsetMs, setServerOffsetMs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<TimeLeftState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
  })
  const [isUnlocked, setIsUnlocked] = useState(false)
  const redirectedRef = useRef(false)

  // Instant redirect helper: immediately transitions without artificial delay
  const redirectToQuiz = useCallback(() => {
    if (redirectedRef.current) return
    redirectedRef.current = true
    router.replace(`/quiz/${competitionId}`)
  }, [competitionId, router])

  // Pre-fetch quiz page route in background so transition is instantaneous (0 network delay)
  useEffect(() => {
    router.prefetch(`/quiz/${competitionId}`)
  }, [competitionId, router])

  useEffect(() => {
    async function loadComp() {
      try {
        // Fetch via server API so 'scheduled' competitions are always accessible even before start
        const res = await fetch(`/api/student/competitions?id=${competitionId}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.competition) {
            const comp: Competition = data.competition
            const offset = data.serverTime
              ? new Date(data.serverTime).getTime() - Date.now()
              : 0
            setServerOffsetMs(offset)
            setCompetition(comp)

            const initial = computeTimeLeft(
              new Date(comp.scheduled_start).getTime(),
              Date.now() + offset
            )
            setTimeLeft(initial)
            if (initial.totalSeconds <= 0) {
              setIsUnlocked(true)
              redirectToQuiz()
              return
            }
          }
        } else {
          // Fallback direct query
          const { data: comp } = await supabase
            .from('competitions')
            .select('*')
            .eq('id', competitionId)
            .single()

          if (comp) {
            setCompetition(comp)
            const initial = computeTimeLeft(new Date(comp.scheduled_start).getTime(), Date.now())
            setTimeLeft(initial)
            if (initial.totalSeconds <= 0) {
              setIsUnlocked(true)
              redirectToQuiz()
              return
            }
          }
        }
      } catch (err) {
        console.error('Failed to load waiting room competition:', err)
      } finally {
        setLoading(false)
      }
    }

    loadComp()
  }, [competitionId, supabase, redirectToQuiz])

  // Sub-second precision timer (ticks every 200ms to immediately detect start time without lag)
  useEffect(() => {
    if (!competition) return

    const targetTime = new Date(competition.scheduled_start).getTime()

    const tick = () => {
      const next = computeTimeLeft(targetTime, Date.now() + serverOffsetMs)
      setTimeLeft(next)
      if (next.totalSeconds <= 0) {
        setIsUnlocked(true)
        redirectToQuiz()
        return true
      }
      return false
    }

    if (tick()) return

    const interval = setInterval(() => {
      if (tick()) {
        clearInterval(interval)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [competition, serverOffsetMs, redirectToQuiz])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
      </div>
    )
  }

  const startDate = competition ? new Date(competition.scheduled_start) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">
        
        {/* Navigation */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-400/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Registration Confirmed · Quiz Waiting Room</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-snug">
            {competition?.title || 'World AMR Awareness Week Quiz'}
          </h1>
          {startDate && (
            <div className="inline-flex items-center gap-1.5 text-xs text-blue-200 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <CalendarClock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Starts: {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <p className="text-xs sm:text-sm text-blue-200/80 max-w-md mx-auto">
            Stay on this screen — your quiz will open automatically the moment the countdown reaches zero.
          </p>
        </div>

        {/* Countdown Box */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-4 sm:p-8 text-center shadow-2xl">
          {!isUnlocked && (
            <div className="mb-3 sm:mb-4">
              <SandGlassAnimation isRunning={true} />
            </div>
          )}

          <div className="text-[11px] sm:text-xs uppercase tracking-widest text-blue-300 font-semibold mb-3.5 sm:mb-4">
            {isUnlocked ? 'Quiz is Live! Opening Quiz...' : 'Time Until Quiz Starts'}
          </div>

          {!isUnlocked ? (
            <div className={`grid ${timeLeft.days > 0 ? 'grid-cols-4 max-w-sm' : 'grid-cols-3 max-w-xs'} gap-2 sm:gap-3 mx-auto`}>
              {timeLeft.days > 0 && (
                <div className="bg-black/30 rounded-xl p-2.5 sm:p-3 border border-white/10">
                  <div className="text-2xl sm:text-4xl font-mono font-bold text-amber-400">
                    {String(timeLeft.days).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase mt-1">Days</div>
                </div>
              )}
              <div className="bg-black/30 rounded-xl p-2.5 sm:p-3 border border-white/10">
                <div className="text-2xl sm:text-4xl font-mono font-bold text-amber-400">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-gray-400 uppercase mt-1">Hours</div>
              </div>
              <div className="bg-black/30 rounded-xl p-2.5 sm:p-3 border border-white/10">
                <div className="text-2xl sm:text-4xl font-mono font-bold text-amber-400">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-gray-400 uppercase mt-1">Minutes</div>
              </div>
              <div className="bg-black/30 rounded-xl p-2.5 sm:p-3 border border-white/10">
                <div className="text-2xl sm:text-4xl font-mono font-bold text-amber-400">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-gray-400 uppercase mt-1">Seconds</div>
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-3">
              <div className="inline-flex items-center gap-2.5 text-emerald-400 font-bold text-base sm:text-xl animate-pulse">
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Quiz Time Started! Entering Exam Now...</span>
              </div>
              <p className="text-xs text-blue-200/80">
                Opening your questions automatically. Please wait...
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={redirectToQuiz}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white underline cursor-pointer"
                >
                  <span>Manual fallback: Click here if not redirected</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rules & Instructions */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs">
          <h4 className="font-bold text-sm text-blue-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Important Competition Rules</span>
          </h4>

          <ul className="space-y-2.5 text-gray-300 leading-relaxed list-disc list-inside">
            <li><strong className="text-white">Total {competition?.total_questions || 30} MCQs</strong> to be completed within <strong className="text-white">{Math.round((competition?.duration_seconds || 600) / 60)} minutes ({competition?.duration_seconds || 600} seconds)</strong>.</li>
            <li><strong className="text-white">Single Attempt Only:</strong> Once submitted or if time expires, you cannot retake the quiz.</li>
            <li><strong className="text-white">Server-Synchronized Timer:</strong> Timer is controlled by the server; refreshing your page will not add time.</li>
            <li><strong className="text-white">Autosave:</strong> Every option you click is immediately saved in the database.</li>
            <li><strong className="text-white">Winner Selection Criteria:</strong> Ranks are determined strictly by <span className="text-amber-300">Highest Correct Answers</span> first, followed by <span className="text-amber-300">Fastest Submission Time</span>.</li>
            <li><strong className="text-white">Certificates:</strong> Top 3 participants receive Rank Certificates (1st, 2nd, 3rd Prize); all valid submitted participants receive Participation Certificates.</li>
          </ul>
        </div>

      </div>
    </div>
  )
}
