'use client'

import { useState, useEffect, useMemo } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { createClient } from '@/lib/supabase/client'
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Send, RotateCw, Trash2, Sparkles } from 'lucide-react'

function getJobKey(job: any): string {
  const certNum = job.payload?.certificate_number || job.payload?.certificateNumber || ''
  return `${job.type}::${(job.to_email || '').toLowerCase()}::${certNum}`
}

export default function AdminEmailsPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [deduping, setDeduping] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadJobs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('email_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    setJobs(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadJobs()
  }, [])

  // Detect duplicate rows
  const duplicateCount = useMemo(() => {
    const seen = new Set<string>()
    let dupes = 0
    for (const j of jobs) {
      const k = getJobKey(j)
      if (seen.has(k)) dupes++
      else seen.add(k)
    }
    return dupes
  }, [jobs])

  // Remove duplicate rows
  const handleRemoveDuplicates = async () => {
    setDeduping(true)
    setStatusMsg(null)
    try {
      const res = await fetch('/api/admin/emails', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to clean duplicates')

      setStatusMsg({
        type: 'success',
        text: data.removed > 0
          ? `Removed ${data.removed} duplicate email log(s) cleanly!`
          : 'Email queue is already clean (0 duplicates found).',
      })
      await loadJobs()
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Deduplication failed' })
    } finally {
      setDeduping(false)
    }
  }

  // Delete single email log row
  const handleDeleteJob = async (job: any) => {
    if (!confirm(`Delete email log for ${job.to_name} (${job.to_email})?`)) return
    setDeletingId(job.id)
    try {
      const res = await fetch(`/api/admin/emails?id=${encodeURIComponent(job.id)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to delete')
      setJobs((prev) => prev.filter((item) => item.id !== job.id))
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Delete failed' })
    } finally {
      setDeletingId(null)
    }
  }

  // Single email resend
  const handleResendSingle = async (job: any) => {
    setResendingId(job.id)
    setStatusMsg(null)
    try {
      const res = await fetch('/api/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || data.reason || 'Failed to resend')
      }

      setStatusMsg({
        type: 'success',
        text: `Certificate email successfully re-sent to ${job.to_email} from msunagpur@gmail.com!`,
      })
      await loadJobs()
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Resend failed: ${err.message}. Please verify GMAIL_APP_PASSWORD in Vercel settings.`,
      })
    } finally {
      setResendingId(null)
    }
  }

  // Process email queue batch (deduplicates first so nobody ever gets emailed twice!)
  const handleProcessQueue = async () => {
    setProcessing(true)
    setStatusMsg(null)
    try {
      // 1. Clean any duplicates on server before sending
      await fetch('/api/admin/emails', { method: 'POST' })

      const { data: freshJobs } = await supabase
        .from('email_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(25)

      const pendingJobs = freshJobs || []
      if (pendingJobs.length === 0) {
        setStatusMsg({ type: 'success', text: 'No pending emails in the queue.' })
        await loadJobs()
        setProcessing(false)
        return
      }

      const sentKeys = new Set<string>()
      let sentNow = 0
      for (const job of pendingJobs) {
        const key = getJobKey(job)
        if (sentKeys.has(key)) continue
        sentKeys.add(key)

        await fetch('/api/resend-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id }),
        })
        sentNow++
      }

      setStatusMsg({
        type: 'success',
        text: `Successfully processed batch of ${sentNow} unique email(s)!`,
      })
      await loadJobs()
    } catch {
      setStatusMsg({ type: 'error', text: 'Error processing email queue' })
    } finally {
      setProcessing(false)
    }
  }

  const sentCount = jobs.filter((j) => j.status === 'sent').length
  const pendingCount = jobs.filter((j) => j.status === 'pending').length
  const failedCount = jobs.filter((j) => j.status === 'failed').length

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              <span>Email Delivery Queue (msunagpur@gmail.com)</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Automated delivery &amp; resend controls for student certificate emails (auto-deduplicated).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {duplicateCount > 0 && (
              <button
                onClick={handleRemoveDuplicates}
                disabled={deduping}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{deduping ? 'Cleaning...' : `Remove ${duplicateCount} Duplicate(s)`}</span>
              </button>
            )}
            <button
              onClick={handleProcessQueue}
              disabled={processing || pendingCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{processing ? 'Processing Batch...' : 'Process Next Batch (25)'}</span>
            </button>
            <button
              onClick={loadJobs}
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

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pending Queue</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Delivered</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{sentCount}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Failed / Retrying</span>
            <div className="text-2xl font-bold text-red-600 mt-1">{failedCount}</div>
          </div>
        </div>

        {/* Email Jobs Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Queued &amp; Dispatched Emails</h3>
            <span className="text-xs text-gray-400">{jobs.length} total logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Recipient</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created At</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                      No email jobs in queue. When you finalize competition, certificate emails are automatically queued here.
                    </td>
                  </tr>
                ) : (
                  jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-semibold text-gray-900">
                        {j.to_name} &lt;{j.to_email}&gt;
                      </td>
                      <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{j.subject}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 uppercase">
                          {j.type}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            j.status === 'sent'
                              ? 'bg-emerald-100 text-emerald-800'
                              : j.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {j.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400">
                        {new Date(j.created_at).toLocaleTimeString('en-IN')}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleResendSingle(j)}
                            disabled={resendingId === j.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${resendingId === j.id ? 'animate-spin' : ''}`} />
                            <span>{resendingId === j.id ? 'Resending...' : 'Resend Email'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteJob(j)}
                            disabled={deletingId === j.id}
                            title="Delete Email Log"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
