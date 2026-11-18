'use client'

import { useState, useEffect, useMemo } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { Users, Search, Trash2, RefreshCw, CheckCircle2, AlertCircle, GraduationCap, FileSpreadsheet, Building2 } from 'lucide-react'

interface ParticipantRow {
  id: string
  full_name: string
  email: string
  college_name: string | null
  course: string | null
  year_semester: string | null
  mobile: string | null
  registration_number: string | null
  created_at: string
  registrations_count: number
  attempts_count: number
  latest_score: number | null
  latest_total: number | null
}

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<ParticipantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingAll, setDeletingAll] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const uniqueCollegesCount = useMemo(() => {
    const set = new Set<string>()
    for (const p of participants) {
      const c = (p.college_name || '').trim().toLowerCase().replace(/\s+/g, ' ')
      if (c) set.add(c)
    }
    return set.size
  }, [participants])

  const handleExportExcel = async () => {
    setExporting(true)
    setStatusMsg(null)
    try {
      const res = await fetch('/api/admin/participants/export')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to export Excel sheet')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStamp = new Date().toISOString().slice(0, 10)
      a.download = `MSU_Nagpur_Quiz_Summary_Report_${dateStamp}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setStatusMsg({
        type: 'success',
        text: `Summary Excel Report downloaded (${participants.length} students across ${uniqueCollegesCount} colleges)!`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Excel export failed'
      setStatusMsg({ type: 'error', text: msg })
    } finally {
      setExporting(false)
    }
  }

  const loadParticipants = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/participants', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load participants')
      setParticipants(data.participants || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading participants'
      setStatusMsg({ type: 'error', text: msg })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadParticipants()
  }, [])

  const handleDeleteParticipant = async (p: ParticipantRow) => {
    const ok = confirm(
      `Delete participant "${p.full_name || p.email}"?\n\nThis removes their profile, past registrations, quiz attempts, and login record so they can register completely fresh with updated Year/Semester.`
    )
    if (!ok) return

    setDeletingId(p.id)
    setStatusMsg(null)
    try {
      const res = await fetch(`/api/admin/participants?id=${encodeURIComponent(p.id)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to delete')

      setStatusMsg({ type: 'success', text: data.message || 'Participant deleted.' })
      setParticipants((prev) => prev.filter((item) => item.id !== p.id))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      setStatusMsg({ type: 'error', text: msg })
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteAll = async () => {
    if (participants.length === 0) return
    const ok = confirm(
      `DELETE ALL ${participants.length} REGISTERED PARTICIPANTS?\n\nThis will permanently delete all student accounts, profiles, registrations, quiz attempts, certificates, and email logs so students can re-register fresh next session/year.\n\n(Admin accounts will remain completely safe.)`
    )
    if (!ok) return

    setDeletingAll(true)
    setStatusMsg(null)
    try {
      const res = await fetch('/api/admin/participants?all=true', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to delete all')

      setStatusMsg({ type: 'success', text: data.message || 'All participants cleared.' })
      setParticipants([])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete all failed'
      setStatusMsg({ type: 'error', text: msg })
    } finally {
      setDeletingAll(false)
    }
  }

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.college_name?.toLowerCase().includes(q) ||
      p.course?.toLowerCase().includes(q) ||
      p.year_semester?.toLowerCase().includes(q) ||
      p.registration_number?.toLowerCase().includes(q) ||
      p.mobile?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span>Registered Participants</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              View or delete registered student profiles so students can re-register with updated Year &amp; Semester in future quizzes.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportExcel}
              disabled={exporting || participants.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{exporting ? 'Generating Summary...' : 'Download Summary (.xlsx)'}</span>
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll || participants.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deletingAll ? 'Deleting All...' : 'Delete All Participants'}</span>
            </button>
            <button
              onClick={loadParticipants}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              statusMsg.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            }`}
          >
            {statusMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              Colleges
            </span>
            <div className="text-2xl font-bold text-purple-700 mt-1">{uniqueCollegesCount}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Total Registered
            </span>
            <div className="text-2xl font-bold text-blue-700 mt-1">{participants.length}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Profile Completed
            </span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {participants.filter((p) => Boolean(p.college_name)).length}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Quiz Attempted
            </span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">
              {participants.filter((p) => p.attempts_count > 0).length}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, email, college, course, year/semester, mobile, or Reg ID..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Student Directory</h3>
            <span className="text-xs text-gray-400">
              Showing {filtered.length} of {participants.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3">College / Course / Year &amp; Sem</th>
                  <th className="px-4 py-3">Mobile &amp; Reg ID</th>
                  <th className="px-4 py-3">Quizzes</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Loading participants...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No registered participants found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{p.full_name || 'Unnamed'}</div>
                        <div className="text-[11px] text-gray-500">{p.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{p.college_name || 'Profile Incomplete'}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <GraduationCap className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>
                            {p.course || '-'} {p.year_semester ? `· ${p.year_semester}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] text-gray-700">{p.mobile || '-'}</div>
                        <div className="font-mono text-[10px] text-blue-700 mt-0.5">
                          {p.registration_number || 'Not Assigned'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold text-gray-700">
                          {p.attempts_count} attempt{p.attempts_count === 1 ? '' : 's'}
                        </span>
                        {p.latest_score !== null && (
                          <div className="text-[10px] font-mono font-bold text-emerald-700">
                            Score: {p.latest_score} / {p.latest_total}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteParticipant(p)}
                          disabled={deletingId === p.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                          title="Delete participant so they can re-register fresh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{deletingId === p.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
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
