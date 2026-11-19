'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/utils'
import {
  Users, Activity, CheckCircle2, Trophy, Clock,
  Maximize2, Minimize2, ArrowLeft, RefreshCw, Sparkles,
  Building2, ShieldCheck, AlertCircle
} from 'lucide-react'

interface LiveParticipant {
  id: string
  full_name: string | null
  email: string
  college_name: string | null
  course: string | null
  mobile: string | null
  created_at: string
  attempt_status: 'registered' | 'in_progress' | 'submitted' | 'timed_out'
  submitted_at: string | null
  latest_score: number | null
  latest_total: number | null
}

export default function LiveWarRoomPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<string>('')
  const [currentTime, setCurrentTime] = useState<string>('')
  const [competition, setCompetition] = useState<any>(null)
  const [participants, setParticipants] = useState<LiveParticipant[]>([])

  // Live Clock (IST)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
        setIsFullscreen(false)
      }
    }
  }

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // Load Real-time Data
  const fetchLiveData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const [partRes, compRes] = await Promise.all([
        fetch('/api/admin/participants', { cache: 'no-store' }),
        supabase.from('competitions').select('*').order('scheduled_start', { ascending: false }).limit(1),
      ])

      if (partRes.ok) {
        const partData = await partRes.json()
        setParticipants(partData.participants || [])
      }

      if (compRes.data && compRes.data.length > 0) {
        setCompetition(compRes.data[0])
      }

      setLastRefreshed(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err) {
      console.error('Error fetching war room data:', err)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchLiveData(false)
    // Live polling every 3 seconds for projector/war room screen
    const interval = setInterval(() => {
      void fetchLiveData(true)
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchLiveData])

  // Calculated Metrics
  const totalRegistered = participants.length
  const playingNow = participants.filter((p) => p.attempt_status === 'in_progress').length
  const submittedList = participants.filter(
    (p) => p.attempt_status === 'submitted' || p.attempt_status === 'timed_out'
  )
  const totalSubmitted = submittedList.length
  const completionPercentage = totalRegistered > 0 ? Math.round((totalSubmitted / totalRegistered) * 100) : 0

  const validScores = submittedList
    .map((p) => p.latest_score)
    .filter((s): s is number => typeof s === 'number' && !isNaN(s))

  const avgScore = validScores.length > 0
    ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
    : '0.0'

  const highestScore = validScores.length > 0 ? Math.max(...validScores) : 0

  // Facility breakdown
  const facilityCounts: Record<string, { total: number; submitted: number }> = {}
  participants.forEach((p) => {
    const fac = (p.college_name || 'Unassigned UPHC').trim()
    if (!facilityCounts[fac]) {
      facilityCounts[fac] = { total: 0, submitted: 0 }
    }
    facilityCounts[fac].total += 1
    if (p.attempt_status === 'submitted' || p.attempt_status === 'timed_out') {
      facilityCounts[fac].submitted += 1
    }
  })

  // Recent Submissions feed (sorted by submitted_at desc)
  const recentSubmissions = [...submittedList]
    .filter((p) => p.submitted_at)
    .sort((a, b) => new Date(b.submitted_at!).getTime() - new Date(a.submitted_at!).getTime())
    .slice(0, 8)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top War Room Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/admin/dashboard"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Return to Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Admin Dashboard</span>
          </Link>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Official Logos & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-1 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white uppercase">
                  WAAW 2026 · Live War Room
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  LIVE STREAM
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wide font-medium">
                Metropolitan Surveillance Unit (MSU) · Nagpur Municipal Corporation
              </p>
            </div>
          </div>
        </div>

        {/* Live Clock & Fullscreen Controls */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-mono font-bold text-amber-400">{currentTime || '--:--:--'}</div>
            <div className="text-[9px] text-slate-400 font-mono">Sync: {lastRefreshed || 'Just now'}</div>
          </div>

          <button
            onClick={() => void fetchLiveData(false)}
            disabled={loading}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-slate-300 hover:text-white cursor-pointer transition-colors"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer transition-all active:scale-95"
            title="Toggle Stage Projector Mode (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isFullscreen ? 'Exit Fullscreen' : 'Projector Mode'}</span>
          </button>
        </div>
      </header>

      {/* Main War Room Body */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Banner: Active Competition Info */}
        <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/70 border border-blue-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Official Competition
              </span>
              <span className="text-xs text-slate-400">Duration: 10 Mins · 30 MCQs</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {competition?.title || 'World AMR Awareness Week 2026 – Online Quiz Competition'}
            </h2>
            <p className="text-xs text-slate-300">
              Antimicrobial Stewardship Assessment for Pharmacy Officers across UPHCs, Nagpur.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative z-10">
            <div className="bg-slate-950/80 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-center min-w-[130px]">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Status</div>
              <div className="text-xs font-extrabold uppercase text-emerald-400 flex items-center justify-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{competition?.status?.replace('_', ' ') || 'ACTIVE'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Giant KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* KPI 1: Registered */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Total Registered</span>
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {totalRegistered}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Pharmacy Officers</div>
            </div>
          </div>

          {/* KPI 2: In-Progress */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Taking Quiz Now</span>
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-amber-400">
                {playingNow}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Active In Exam Room</div>
            </div>
          </div>

          {/* KPI 3: Submitted */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Completed &amp; Scored</span>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-emerald-400">
                {totalSubmitted}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">{completionPercentage}% Turnout Rate</div>
            </div>
          </div>

          {/* KPI 4: Average Score */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Average Performance</span>
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-indigo-400">
                {avgScore} <span className="text-base text-slate-500 font-normal">/30</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Top Score: <strong className="text-white">{highestScore}/30</strong></div>
            </div>
          </div>
        </div>

        {/* Visual Progress Gauge */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Overall Competition Completion Gauge</span>
            </span>
            <span className="font-mono font-bold text-white">
              {totalSubmitted} of {totalRegistered} Participants Finished ({completionPercentage}%)
            </span>
          </div>

          <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-lg shadow-blue-500/30"
              style={{ width: `${Math.max(completionPercentage, 2)}%` }}
            />
          </div>
        </div>

        {/* 2-Column Section: Facility Participation Breakdown & Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Health Facilities (UPHCs) Distribution */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wide">
                  Participating Health Facilities (UPHCs)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {Object.keys(facilityCounts).length} UPHCs
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {Object.keys(facilityCounts).length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  Waiting for registered participants...
                </div>
              ) : (
                Object.entries(facilityCounts)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([fac, data]) => {
                    const pct = Math.round((data.submitted / data.total) * 100) || 0
                    return (
                      <div
                        key={fac}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate">{fac}</h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                            <span>{data.submitted} / {data.total} Submitted</span>
                            <span>·</span>
                            <span className={pct === 100 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                              {pct}% Complete
                            </span>
                          </div>
                        </div>

                        <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          </div>

          {/* Right Column: Real-time Live Submissions Stream */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wide">
                  Live Submissions Activity Stream
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Real-Time Feed
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {recentSubmissions.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Clock className="w-6 h-6 text-slate-600 mx-auto animate-spin" />
                  <p className="text-xs text-slate-400">
                    Awaiting participants to complete and submit quiz...
                  </p>
                </div>
              ) : (
                recentSubmissions.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {p.full_name || p.email}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 shrink-0">
                          {p.submitted_at ? new Date(p.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {p.college_name || 'Pharmacy Officer'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono font-extrabold">
                        {p.latest_score ?? 0} / 30
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
