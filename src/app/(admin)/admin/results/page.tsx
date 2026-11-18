'use client'

import { useState, useEffect } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Download, Award, Search, RefreshCw, Medal } from 'lucide-react'

export default function AdminResultsPage() {
  const supabase = createClient()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadResults = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('competition_results')
      .select('*, student:profiles(*), attempt:quiz_attempts(*)')
      .order('rank', { ascending: true })

    setResults(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadResults()
  }, [])

  // Export to CSV
  const handleExportCSV = () => {
    if (results.length === 0) return

    const headers = ['Rank', 'Name', 'Email', 'College', 'Course', 'Score', 'Time Submitted', 'Award']
    const rows = results.map(r => [
      r.rank,
      `"${r.student?.full_name || ''}"`,
      r.student?.email || '',
      `"${r.student?.college_name || ''}"`,
      r.student?.course || '',
      r.score,
      new Date(r.submitted_at).toLocaleString('en-IN'),
      r.certificate_type,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `AMR_Quiz_Leaderboard_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const winners = results.slice(0, 3)
  const filtered = results.filter(r => 
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
              <span>Official Leaderboard &amp; Rankings</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Accuracy &amp; Speed evaluation: Top correct answers and earlier server submission timestamps.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href="/api/admin/participants/export"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download NCDC Excel (.xlsx)</span>
            </a>
            <button
              onClick={handleExportCSV}
              disabled={results.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={loadResults}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

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
                placeholder="Search by student or college..."
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
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">College &amp; Course</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Submission Timestamp</th>
                  <th className="px-5 py-3">Award Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                      No results published yet. Click &quot;Finalize Rankings&quot; from the Overview tab once the quiz concludes.
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
                      <td className="px-5 py-3 text-gray-500">
                        {r.student?.college_name} ({r.student?.course})
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-blue-700">
                        {r.score} / 30
                      </td>
                      <td className="px-5 py-3 text-gray-400 font-mono">
                        {new Date(r.submitted_at).toLocaleTimeString('en-IN')}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.certificate_type === 'first_prize' ? 'bg-amber-100 text-amber-800' :
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

      </main>
    </div>
  )
}
