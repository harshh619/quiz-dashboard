'use client'

import { useState, useEffect, useMemo } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { createClient } from '@/lib/supabase/client'
import {
  Trophy, Download, Award, Search, RefreshCw, Medal,
  Building2, BrainCircuit, Sparkles, CheckCircle2, AlertTriangle,
  BarChart3, Users, ChevronRight, FileSpreadsheet, Loader2, Zap, Clock
} from 'lucide-react'

// Categorization helper for the 6 core AMR domains
function categorizeQuestionDomain(topic: string = ''): string {
  const t = topic.toLowerCase()
  if (t.includes('stewardship') || t.includes('aware') || t.includes('rational') || t.includes('missed')) {
    return 'Antimicrobial Stewardship & WHO AWaRe'
  }
  if (t.includes('lactam') || t.includes('pharmacology') || t.includes('history')) {
    return 'Pharmacology & β-Lactam Classes'
  }
  if (t.includes('diagnostic') || t.includes('mic') || t.includes('kirby') || t.includes('ast')) {
    return 'Laboratory Diagnostics & AST Breakpoints'
  }
  if (t.includes('environment') || t.includes('wastewater') || t.includes('disposal')) {
    return 'Environmental AMR & Safe Disposal'
  }
  if (t.includes('policy') || t.includes('action plan') || t.includes('one health')) {
    return 'One Health & Policy Action Plans'
  }
  return 'AMR Fundamentals & Resistance Mechanisms'
}

export default function AdminResultsPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'individual' | 'facilities' | 'knowledge_gap'>('individual')
  const [results, setResults] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [responses, setResponses] = useState<any[]>([])
  const [competitions, setCompetitions] = useState<any[]>([])
  const [selectedCompId, setSelectedCompId] = useState<string>('')
  const [attemptStats, setAttemptStats] = useState<{ total: number; submitted: number; inProgress: number }>({
    total: 0,
    submitted: 0,
    inProgress: 0,
  })
  const [finalizing, setFinalizing] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadResults = async (targetCompId?: string) => {
    setLoading(true)
    try {
      const [resData, qData, respData, compData, attData] = await Promise.all([
        supabase
          .from('competition_results')
          .select('*, student:profiles(*), attempt:quiz_attempts(*)')
          .order('rank', { ascending: true }),
        supabase
          .from('question_bank')
          .select('id, question_text, topic, correct_option, difficulty'),
        supabase
          .from('quiz_responses')
          .select('question_id, selected_option'),
        supabase
          .from('competitions')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('quiz_attempts')
          .select('id, status, score, competition_id'),
      ])

      const comps = compData.data || []
      setCompetitions(comps)

      const activeCompId = targetCompId || selectedCompId || comps[0]?.id || ''
      if (!selectedCompId && activeCompId) {
        setSelectedCompId(activeCompId)
      }

      // Filter results for selected competition if any
      const allResults = resData.data || []
      const filteredByComp = activeCompId
        ? allResults.filter((r) => r.competition_id === activeCompId)
        : allResults

      setResults(filteredByComp.length > 0 ? filteredByComp : allResults)
      setQuestions(qData.data || [])
      setResponses(respData.data || [])

      // Count attempts for selected or latest competition
      const attempts = attData.data || []
      const compAttempts = activeCompId
        ? attempts.filter((a) => a.competition_id === activeCompId)
        : attempts

      const submitted = compAttempts.filter((a) => a.status === 'submitted' || a.score !== null).length
      const inProgress = compAttempts.filter((a) => a.status === 'in_progress').length
      setAttemptStats({
        total: compAttempts.length,
        submitted,
        inProgress,
      })
    } catch (err) {
      console.error('Error loading results & analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [])

  // Action: 1-Click Instant Declare Results & Finalize Rankings
  const handleDeclareResults = async (compId?: string) => {
    const targetId = compId || selectedCompId || competitions[0]?.id
    if (!targetId) {
      alert('No competition found to finalize.')
      return
    }

    const comp = competitions.find((c) => c.id === targetId)
    const title = comp?.title || 'the competition'

    const confirmMsg =
      `⚡ DECLARE RESULTS NOW for:\n"${title}"?\n\n` +
      `• Auto-submits any in-progress participant attempts.\n` +
      `• Computes final ranks (#1, #2, #3, etc.) based on score & speed.\n` +
      `• Generates verified official PDF certificates for all participants.\n` +
      `• Unlocks result, score & answer key immediately on participant screens.\n\n` +
      `Do you want to proceed and publish results now?`

    if (!confirm(confirmMsg)) return

    setFinalizing(true)
    setStatusMsg(null)

    try {
      const res = await fetch('/api/admin/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId: targetId }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to declare results')
      }

      setStatusMsg({
        type: 'success',
        text: `🎉 Official Results Published! ${data.total_finalized} participants ranked and certificates issued instantly.`,
      })

      await loadResults(targetId)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error declaring results'
      setStatusMsg({ type: 'error', text: msg })
    } finally {
      setFinalizing(false)
    }
  }

  // 1. UPHC Facility Aggregations
  const facilityStats = useMemo(() => {
    const map = new Map<string, {
      name: string
      participants: number
      scores: number[]
      meritWinners: number
      topScore: number
    }>()

    results.forEach((r) => {
      const fac = (r.student?.college_name || 'Unassigned Health Facility').trim()
      if (!map.has(fac)) {
        map.set(fac, {
          name: fac,
          participants: 0,
          scores: [],
          meritWinners: 0,
          topScore: 0,
        })
      }
      const entry = map.get(fac)!
      entry.participants += 1
      const score = Number(r.score) || 0
      entry.scores.push(score)
      if (score > entry.topScore) entry.topScore = score
      if (r.rank <= 3) entry.meritWinners += 1
    })

    return Array.from(map.values())
      .map((f) => {
        const sum = f.scores.reduce((a, b) => a + b, 0)
        const avg = f.scores.length > 0 ? Number((sum / f.scores.length).toFixed(1)) : 0
        const passCount = f.scores.filter((s) => s >= 18).length
        const passRate = f.scores.length > 0 ? Math.round((passCount / f.scores.length) * 100) : 0
        return {
          ...f,
          avgScore: avg,
          passRate,
        }
      })
      .sort((a, b) => b.avgScore - a.avgScore || b.participants - a.participants)
  }, [results])

  // 2. AMR Knowledge-Gap / Category Aggregations
  const domainStats = useMemo(() => {
    if (questions.length === 0 || responses.length === 0) return []

    const qMap = new Map<string, { topic: string; correct_option: string; domain: string }>()
    questions.forEach((q) => {
      qMap.set(q.id, {
        topic: q.topic || 'AMR Fundamentals',
        correct_option: q.correct_option,
        domain: categorizeQuestionDomain(q.topic),
      })
    })

    const domainMap = new Map<string, { totalAnswered: number; correctCount: number; qCount: number }>()

    questions.forEach((q) => {
      const d = categorizeQuestionDomain(q.topic)
      if (!domainMap.has(d)) {
        domainMap.set(d, { totalAnswered: 0, correctCount: 0, qCount: 0 })
      }
      domainMap.get(d)!.qCount += 1
    })

    responses.forEach((resp) => {
      const q = qMap.get(resp.question_id)
      if (q) {
        const d = domainMap.get(q.domain)
        if (d) {
          d.totalAnswered += 1
          if (resp.selected_option === q.correct_option) {
            d.correctCount += 1
          }
        }
      }
    })

    return Array.from(domainMap.entries()).map(([domain, data]) => {
      const accuracy = data.totalAnswered > 0
        ? Math.round((data.correctCount / data.totalAnswered) * 100)
        : 0

      let statusLevel: 'high' | 'moderate' | 'gap' = 'moderate'
      if (accuracy >= 75) statusLevel = 'high'
      else if (accuracy < 50) statusLevel = 'gap'

      return {
        domain,
        questionCount: data.qCount,
        totalAnswered: data.totalAnswered,
        correctCount: data.correctCount,
        accuracy,
        statusLevel,
      }
    }).sort((a, b) => b.accuracy - a.accuracy)
  }, [questions, responses])

  // Export Individual CSV
  const handleExportIndividualCSV = () => {
    if (results.length === 0) return

    const headers = ['Rank', 'Participant Name', 'Email', 'Name of Health Facility', 'Score', 'Time Submitted', 'Award']
    const rows = results.map((r) => [
      r.rank,
      `"${r.student?.full_name || ''}"`,
      r.student?.email || '',
      `"${r.student?.college_name || ''}"`,
      r.score,
      new Date(r.submitted_at).toLocaleString('en-IN'),
      r.certificate_type,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `AMR_Quiz_Individual_Leaderboard_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export UPHC Facility CSV
  const handleExportFacilityCSV = () => {
    if (facilityStats.length === 0) return

    const headers = ['Facility Rank', 'Name of Health Facility / UPHC', 'Total Participants', 'Average Score (/30)', 'Highest Score (/30)', 'Pass Rate (>=18)', 'Merit Winners (Top 3)']
    const rows = facilityStats.map((f, idx) => [
      idx + 1,
      `"${f.name}"`,
      f.participants,
      f.avgScore,
      f.topScore,
      `${f.passRate}%`,
      f.meritWinners,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `AMR_Quiz_UPHC_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const winners = results.slice(0, 3)
  const filtered = results.filter((r) =>
    r.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.student?.college_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              <span>Official Results &amp; Analytical Reports</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Comprehensive leaderboard, UPHC institutional comparative analysis, and AMR training gap assessments.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Quick Competition Switcher if multiple exist */}
            {competitions.length > 1 && (
              <select
                value={selectedCompId}
                onChange={(e) => {
                  const id = e.target.value
                  setSelectedCompId(id)
                  loadResults(id)
                }}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-2xs"
              >
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.status})
                  </option>
                ))}
              </select>
            )}

            {/* 1-Click Instant Declare Results Button */}
            <button
              onClick={() => handleDeclareResults()}
              disabled={finalizing || loading || competitions.length === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all disabled:opacity-50 cursor-pointer ${results.length > 0
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400/50'
                }`}
              title="Declare final results now without waiting for 10-minute countdown to expire"
            >
              {finalizing ? (
                <Loader2 className="w-4 h-4 animate-spin text-current" />
              ) : (
                <Sparkles className="w-4 h-4 text-current" />
              )}
              <span>
                {finalizing
                  ? 'Declaring Results & Issuing Certificates...'
                  : results.length > 0
                    ? '⚡ Re-Calculate / Update Results'
                    : '⚡ Declare Results Now'}
              </span>
            </button>

            <a
              href="/api/admin/participants/export"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Official Excel (.xlsx)</span>
            </a>
            <button
              onClick={activeTab === 'facilities' ? handleExportFacilityCSV : handleExportIndividualCSV}
              disabled={results.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{activeTab === 'facilities' ? 'Export UPHC CSV' : 'Export Leaderboard CSV'}</span>
            </button>
            <button
              onClick={() => loadResults()}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusMsg && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-2xs ${statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
              }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-semibold">{statusMsg.text}</span>
            </div>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'individual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Individual Leaderboard</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-mono">
              {results.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('facilities')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'facilities'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>UPHC Facility Analytics</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-mono">
              {facilityStats.length} UPHCs
            </span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge_gap')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'knowledge_gap'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>AMR Knowledge-Gap &amp; Training Assessment</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full font-extrabold">
              NEW
            </span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: INDIVIDUAL LEADERBOARD */}
        {/* ============================================================== */}
        {activeTab === 'individual' && (
          <div className="space-y-6">
            {/* Podium: Top 3 Winners */}
            {winners.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {winners.map((w, index) => {
                  const medals = [
                    { title: '1st Prize Winner', bg: 'bg-amber-50 border-amber-300 text-amber-800', badge: '🥇 First Prize' },
                    { title: '2nd Prize Winner', bg: 'bg-slate-100 border-slate-300 text-slate-800', badge: '🥈 Second Prize' },
                    { title: '3rd Prize Winner', bg: 'bg-orange-50 border-orange-300 text-orange-800', badge: '🥉 Third Prize' },
                  ]
                  const medal = medals[index]

                  return (
                    <div
                      key={w.id}
                      className={`rounded-2xl border-2 p-5 text-center space-y-2 shadow-xs ${medal.bg}`}
                    >
                      <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full bg-white shadow-2xs">
                        {medal.badge}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        {w.student?.full_name}
                      </h3>
                      <p className="text-xs text-gray-600 truncate">
                        {w.student?.college_name}
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-4 text-xs font-mono font-bold">
                        <span>Score: {w.score}/30</span>
                        <span>·</span>
                        <span>{new Date(w.submitted_at).toLocaleTimeString('en-IN')}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Search & Results Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by participant or health facility..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {filtered.length} Finalized Participants
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                    <tr>
                      <th className="px-5 py-3">Rank</th>
                      <th className="px-5 py-3">Participant Name</th>
                      <th className="px-5 py-3">Name of Health Facility</th>
                      <th className="px-5 py-3">Score</th>
                      <th className="px-5 py-3">Submission Timestamp</th>
                      <th className="px-5 py-3">Award Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center bg-slate-50/50">
                          <div className="max-w-md mx-auto space-y-3">
                            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                              <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900">
                                No Results Declared Yet
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                {attemptStats.submitted > 0 ? (
                                  <span className="text-emerald-700 font-semibold">
                                    ✅ {attemptStats.submitted} participant submission{attemptStats.submitted === 1 ? '' : 's'} recorded!
                                    {' '}Aap 10 minute ka timer khatam hone se pehle abhi result declare kar sakte hain:
                                  </span>
                                ) : attemptStats.inProgress > 0 ? (
                                  <span>
                                    ⚡ {attemptStats.inProgress} participant(s) currently taking the quiz. Aap chahein to abhi result finalize kar sakte hain.
                                  </span>
                                ) : (
                                  <span>
                                    Aap 10 minute khatam hone ka intezar kiye bina kisi bhi samay yahan se result declare kar sakte hain. Testing me bhi kaam aayega.
                                  </span>
                                )}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeclareResults()}
                              disabled={finalizing || loading || competitions.length === 0}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {finalizing ? (
                                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                              ) : (
                                <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                              )}
                              <span>
                                {finalizing
                                  ? 'Declaring Results & Issuing Certificates...'
                                  : '⚡ Declare Results & Issue Certificates Now'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/50">
                          <td className="px-5 py-3 font-mono font-bold text-gray-900">
                            #{r.rank}
                          </td>
                          <td className="px-5 py-3 font-semibold text-gray-900">
                            {r.student?.full_name}
                          </td>
                          <td className="px-5 py-3 text-gray-600 font-medium">
                            {r.student?.college_name || '-'}
                          </td>
                          <td className="px-5 py-3 font-mono font-bold text-blue-700">
                            {r.score} / 30
                          </td>
                          <td className="px-5 py-3 text-gray-400 font-mono">
                            {new Date(r.submitted_at).toLocaleTimeString('en-IN')}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.certificate_type === 'first_prize' ? 'bg-amber-100 text-amber-800' :
                                r.certificate_type === 'second_prize' ? 'bg-slate-200 text-slate-800' :
                                  r.certificate_type === 'third_prize' ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-50 text-blue-800'
                              }`}>
                              {r.certificate_type.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: UPHC FACILITY ANALYTICS */}
        {/* ============================================================== */}
        {activeTab === 'facilities' && (
          <div className="space-y-6">
            {/* Top Facility KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
                  <span>Total Participating UPHCs</span>
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 font-mono">
                  {facilityStats.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Institutions &amp; Health Units</div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
                  <span>Top Performing Facility</span>
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-lg sm:text-xl font-black text-blue-900 mt-2 truncate">
                  {facilityStats[0]?.name || 'N/A'}
                </div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">
                  Average Score: {facilityStats[0]?.avgScore || 0} / 30
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
                  <span>Highest Participation</span>
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                {(() => {
                  const topCountFac = [...facilityStats].sort((a, b) => b.participants - a.participants)[0]
                  return (
                    <>
                      <div className="text-lg sm:text-xl font-black text-indigo-900 mt-2 truncate">
                        {topCountFac?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-medium">
                        {topCountFac?.participants || 0} Officers Participated
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* UPHC Comparison Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Health Facility (UPHC) Comparative Ranking Table
                  </h3>
                  <p className="text-xs text-gray-500">
                    Ranked by Average Score and Antimicrobial Knowledge Demonstration.
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
                  {facilityStats.length} Total Facilities
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                    <tr>
                      <th className="px-5 py-3">Facility Rank</th>
                      <th className="px-5 py-3">Health Facility / UPHC Name</th>
                      <th className="px-5 py-3 text-center">Officers Participated</th>
                      <th className="px-5 py-3 text-center">Avg Score (/30)</th>
                      <th className="px-5 py-3 text-center">Top Score</th>
                      <th className="px-5 py-3 text-center">Pass Rate (≥18)</th>
                      <th className="px-5 py-3 text-center">Merit Winners</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {facilityStats.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                          No facility performance data available yet.
                        </td>
                      </tr>
                    ) : (
                      facilityStats.map((f, idx) => (
                        <tr key={f.name} className="hover:bg-gray-50/50">
                          <td className="px-5 py-3 font-mono font-bold text-gray-900">
                            #{idx + 1}
                          </td>
                          <td className="px-5 py-3 font-bold text-gray-900">
                            {f.name}
                          </td>
                          <td className="px-5 py-3 text-center font-mono font-semibold text-slate-700">
                            {f.participants}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="inline-block font-mono font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                              {f.avgScore}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center font-mono font-bold text-emerald-600">
                            {f.topScore}/30
                          </td>
                          <td className="px-5 py-3 text-center font-mono font-semibold">
                            {f.passRate}%
                          </td>
                          <td className="px-5 py-3 text-center">
                            {f.meritWinners > 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                <Trophy className="w-3 h-3 text-amber-500" />
                                <span>{f.meritWinners}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: AMR KNOWLEDGE-GAP & TRAINING ASSESSMENT */}
        {/* ============================================================== */}
        {activeTab === 'knowledge_gap' && (
          <div className="space-y-6">

            {/* Advisory Executive Note */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-2 border border-blue-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <BrainCircuit className="w-4 h-4" />
                <span>MSU Nagpur · Clinical AMR Gap Identification Report</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold">
                Domain-wise Mastery &amp; Antimicrobial Stewardship Evaluation
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                This diagnostic report analyzes the accuracy percentage of pharmacy officers across the 30 standardized AMR assessment questions. It helps the Metropolitan Surveillance Unit (MSU) and Nagpur Municipal Corporation identify specific topics requiring continuous professional training.
              </p>
            </div>

            {/* 6 Core Domain Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {domainStats.map((d) => (
                <div
                  key={d.domain}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{d.domain}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {d.questionCount} Questions in Assessment Pool
                      </p>
                    </div>

                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border shrink-0 ${d.statusLevel === 'high'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : d.statusLevel === 'gap'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                      {d.statusLevel === 'high' ? 'High Mastery' : d.statusLevel === 'gap' ? 'Critical Gap' : 'Moderate'}
                    </span>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono font-bold">
                      <span className="text-gray-500">Correct Response Rate:</span>
                      <span className={
                        d.statusLevel === 'high' ? 'text-emerald-700' :
                          d.statusLevel === 'gap' ? 'text-red-600' : 'text-amber-700'
                      }>
                        {d.accuracy}% ({d.correctCount}/{d.totalAnswered} answered)
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${d.statusLevel === 'high'
                            ? 'bg-emerald-500'
                            : d.statusLevel === 'gap'
                              ? 'bg-red-500'
                              : 'bg-amber-500'
                          }`}
                        style={{ width: `${Math.max(d.accuracy, 4)}%` }}
                      />
                    </div>
                  </div>

                  {/* Recommendation Tag */}
                  <div className="text-[11px] text-gray-600 pt-1 border-t border-gray-100 flex items-center gap-1.5">
                    {d.statusLevel === 'high' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Pharmacy Officers demonstrate strong knowledge in this area.</span>
                      </>
                    ) : d.statusLevel === 'gap' ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="text-red-700 font-semibold">Priority area for upcoming MSU Nagpur CME / Workshop.</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Good baseline; brief refresher circular recommended.</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </main>
    </div>
  )
}
