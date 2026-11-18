'use client'

import { useState, useEffect } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, CheckCircle2, Clock, HelpCircle, Trophy, 
  ArrowUpRight, AlertCircle, RefreshCw, Award, Send, Trash2
} from 'lucide-react'

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
  const [recentAttempts, setRecentAttempts] = useState<any[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Count registrations
      const { count: regCount } = await supabase.from('registrations').select('*', { count: 'exact', head: true })
      
      // 2. Count submitted
      const { count: subCount } = await supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'timed_out'])

      // 3. Count in-progress
      const { count: progCount } = await supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('status', 'in_progress')

      // 4. Count questions
      const { count: qCount } = await supabase.from('question_bank').select('*', { count: 'exact', head: true })

      setStats({
        totalRegistered: regCount || 0,
        totalSubmitted: subCount || 0,
        totalInProgress: progCount || 0,
        totalQuestions: qCount || 0,
      })

      // Fetch competitions
      const { data: comps } = await supabase.from('competitions').select('*').order('scheduled_start', { ascending: false })
      setCompetitions(comps || [])

      // Fetch recent attempts
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('*, student:profiles(*)')
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentAttempts(attempts || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Action: Finalize Competition Leaderboard & Generate Certificates
  const handleFinalize = async (compId: string) => {
    if (!confirm('Are you sure you want to finalize the competition? This will lock rankings and generate certificates for all submitted students.')) {
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
      await loadData()
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
      : 'Clear all test submissions, quiz attempts, generated certificates, and email logs? (Registered student profiles will be retained).'

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
      await loadData()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Header & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              AMR Quiz Operations Dashboard
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Live event monitoring, participant submissions, and evaluation controls.
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
              onClick={loadData}
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
            <div className="text-[11px] text-gray-400 mt-1">Health Sciences Students</div>
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
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Finalize Rankings &amp; Issue Certificates</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Recent Student Submissions</h3>
            <span className="text-xs text-gray-400">Latest 10 activities</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">College / Course</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {recentAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-gray-400">
                      No attempts recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-semibold text-gray-900">
                        {att.student?.full_name || 'Anonymous Student'}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {att.student?.college_name || 'N/A'} ({att.student?.course || '-'})
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          att.status === 'submitted' ? 'bg-emerald-100 text-emerald-800' :
                          att.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-blue-700">
                        {att.score !== null ? `${att.score} / ${att.total_questions}` : '-'}
                      </td>
                      <td className="px-5 py-3 text-gray-400">
                        {att.submitted_at ? new Date(att.submitted_at).toLocaleTimeString('en-IN') : 'In progress'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
