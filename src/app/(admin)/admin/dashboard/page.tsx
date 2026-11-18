'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { createClient } from '@/lib/supabase/client'
import {
  Users, CheckCircle2, Clock, HelpCircle, Trophy,
  RefreshCw, Award, Trash2, Lock
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
  score_unlocked: boolean
  score_locked_until: string | null
}

export default function AdminOverviewPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [stats, setStats] = useState({
    totalRegistered: 0,
    totalSubmitted: 0,
    totalInProgress: 0,
    totalQuestions: 0,
  })
  const [competitions, setCompetitions] = useState<any[]>([])
  const [liveParticipants, setLiveParticipants] = useState<LiveParticipant[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [partRes, { count: qCount }, { data: comps }] = await Promise.all([
        fetch('/api/admin/participants', { cache: 'no-store' }),
        supabase.from('question_bank').select('*', { count: 'exact', head: true }),
        supabase.from('competitions').select('*').order('scheduled_start', { ascending: false }),
      ])

      const partJson = partRes.ok ? await partRes.json() : { participants: [] }
      const list: LiveParticipant[] = partJson.participants || []

      const submittedCount = list.filter(
        (p) => p.attempt_status === 'submitted' || p.attempt_status === 'timed_out'
      ).length
      const inProgressCount = list.filter((p) => p.attempt_status === 'in_progress').length

      setStats({
        totalRegistered: list.length,
        totalSubmitted: submittedCount,
        totalInProgress: inProgressCount,
        totalQuestions: qCount || 0,
      })

      setLiveParticipants(list)
      setCompetitions(comps || [])
      setLastUpdated(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    } catch (err) {
      console.error(err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void loadData(false)
    // Live auto-refresh every 5 seconds so newly registered participants & timeout scores appear instantly
    const interval = setInterval(() => {
      void loadData(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [loadData])

  // Action: Finalize Competition Leaderboard & Generate Certificates
  const handleFinalize = async (compId: string) => {
    if (!confirm('Are you sure you want to finalize the competition? This will lock rankings and generate certificates for all submitted participants.')) {
      return
    }

    setActionLoading(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/admin/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId: compId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Finalization failed')

      setStatusMessage(
        `Leaderboard finalized! ${data.total_finalized} certificates generated & queued cleanly (no duplicate emails).`
      )
      await loadData(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Finalization failed'
      alert(`Error: ${msg}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Clear All Test Submissions, Attempts & Generated Certificates
  const handleClearTestData = async (clearProfiles: boolean = false) => {
    const confirmPrompt = clearProfiles
      ? 'ARE YOU SURE? This will wipe all test participants, registrations, quiz attempts, results, certificates, and email logs. (Admin accounts will remain safe).'
      : 'Clear all test submissions, quiz attempts, generated certificates, and email logs? (Registered participant profiles will be retained).'

    if (!confirm(confirmPrompt)) return

    setClearing(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/admin/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearStudents: clearProfiles }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to clear data')

      setStatusMessage(json.message || 'Test data cleared successfully!')
      await loadData(false)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setClearing(false)
    }
  }

  const getStatusBadge = (status: LiveParticipant['attempt_status']) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
            Submitted
          </span>
        )
      case 'timed_out':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-800">
            Timed Out
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Taking Quiz
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
            Registered
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* Header & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                AMR Quiz Operations Dashboard
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Auto-Sync
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Live participant monitoring, submissions, and evaluation controls.{lastUpdated ? ` Last synced: ${lastUpdated}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => handleClearTestData(false)}
              disabled={clearing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              title="Clears attempts, responses, certificates, and email jobs so you can re-test"
            >
              <Trash2 className={`w-3.5 h-3.5 ${clearing ? 'animate-spin' : ''}`} />
              <span>{clearing ? 'Clearing Data...' : 'Reset Test Submissions & Certs'}</span>
            </button>

            <button
              onClick={() => void loadData(false)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Registered</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {stats.totalRegistered}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Total Participants</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Submissions</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats.totalSubmitted}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Completed attempts</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Live</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {stats.totalInProgress}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Currently taking quiz</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Question Bank</span>
              <HelpCircle className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-700">
              {stats.totalQuestions}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Validated MCQs</div>
          </div>
        </div>

        {/* Competition Controls Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Active Competitions &amp; Evaluation Controls</span>
          </h3>

          <div className="space-y-4">
            {competitions.map((comp) => (
              <div
                key={comp.id}
                className="p-4 rounded-xl border border-gray-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{comp.title}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {comp.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Scheduled: {new Date(comp.scheduled_start).toLocaleString('en-IN')} – {new Date(comp.scheduled_end).toLocaleTimeString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleFinalize(comp.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Finalize Rankings &amp; Issue Certificates</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Participants Table (Shows every participant immediately as they register; scores unlock only after quiz timeout!) */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Live Registered Participants</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Participants appear immediately upon registration. Scores reveal automatically once the quiz timer finishes.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
              {liveParticipants.length} Participant{liveParticipants.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Participant Name</th>
                  <th className="px-5 py-3">Health Facility</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Registered / Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {liveParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                      No participants registered yet. Participants will appear here automatically as they join.
                    </td>
                  </tr>
                ) : (
                  liveParticipants.map((p, idx) => {
                    const isDone = p.attempt_status === 'submitted' || p.attempt_status === 'timed_out'
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 font-mono text-gray-400">
                          {idx + 1}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-gray-900">
                            {p.full_name || 'Participant'}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {p.mobile ? `${p.mobile} · ` : ''}{p.email}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600 font-medium">
                          {p.college_name || 'Profile Incomplete'}
                        </td>
                        <td className="px-5 py-3">
                          {getStatusBadge(p.attempt_status)}
                        </td>
                        <td className="px-5 py-3">
                          {!isDone ? (
                            <span className="text-gray-400">—</span>
                          ) : !p.score_unlocked ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold"
                              title="Score stays hidden until the competition timer finishes"
                            >
                              <Lock className="w-3 h-3" />
                              <span>After Timeout</span>
                            </span>
                          ) : p.latest_score !== null ? (
                            <span className="font-mono font-bold text-blue-700">
                              {p.latest_score} / {p.latest_total ?? 30}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-400 font-mono text-[11px]">
                          {p.submitted_at
                            ? `Sub: ${new Date(p.submitted_at).toLocaleTimeString('en-IN')}`
                            : `Reg: ${new Date(p.created_at).toLocaleTimeString('en-IN')}`}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
