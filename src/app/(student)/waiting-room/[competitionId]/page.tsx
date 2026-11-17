'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Competition } from '@/types'
import { Clock, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
    totalSeconds: number
  }>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 })
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    async function loadComp() {
      const { data: comp } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .single()

      if (comp) {
        setCompetition(comp)
      }
      setLoading(false)
    }

    loadComp()
  }, [competitionId, supabase])

  // Countdown timer
  useEffect(() => {
    if (!competition) return

    const targetTime = new Date(competition.scheduled_start).getTime()

    const interval = setInterval(() => {
      const now = Date.now()
      const diff = Math.floor((targetTime - now) / 1000)

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 })
        setIsUnlocked(true)
        clearInterval(interval)
      } else {
        const hours = Math.floor(diff / 3600)
        const minutes = Math.floor((diff % 3600) / 60)
        const seconds = diff % 60
        setTimeLeft({ hours, minutes, seconds, totalSeconds: diff })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [competition])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
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
          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-400/30">
            Waiting Room · Exam Lobby
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {competition?.title || 'World AMR Awareness Week Quiz'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/80">
            The quiz questions will unlock automatically once the countdown reaches zero.
          </p>
        </div>

        {/* Countdown Box */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-6 sm:p-8 text-center shadow-2xl">
          <div className="text-xs uppercase tracking-widest text-blue-300 font-semibold mb-4">
            {isUnlocked ? 'Exam is Live!' : 'Time Until Exam Unlocks'}
          </div>

          {!isUnlocked ? (
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              <div className="bg-black/30 rounded-xl p-3 border border-white/10">
                <div className="text-3xl sm:text-4xl font-mono font-bold text-amber-400">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-gray-400 uppercase mt-1">Hours</div>
              </div>
              <div className="bg-black/30 rounded-xl p-3 border border-white/10">
                <div className="text-3xl sm:text-4xl font-mono font-bold text-amber-400">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-gray-400 uppercase mt-1">Minutes</div>
              </div>
              <div className="bg-black/30 rounded-xl p-3 border border-white/10">
                <div className="text-3xl sm:text-4xl font-mono font-bold text-amber-400">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-gray-400 uppercase mt-1">Seconds</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-lg animate-bounce">
                <CheckCircle2 className="w-6 h-6" />
                <span>The quiz is now open!</span>
              </div>
              <div>
                <Link
                  href={`/quiz/${competitionId}`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105"
                >
                  <span>Enter Examination Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Rules & Instructions */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4 text-xs">
          <h4 className="font-bold text-sm text-blue-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Important Competition Rules</span>
          </h4>

          <ul className="space-y-2.5 text-gray-300 leading-relaxed list-disc list-inside">
            <li><strong className="text-white">Total 30 MCQs</strong> to be completed within <strong className="text-white">10 minutes (600 seconds)</strong>.</li>
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
