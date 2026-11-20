'use client'

import { useState, useEffect, useMemo } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { createClient } from '@/lib/supabase/client'
import { extractAllCategories, parseCategoryTopic } from '@/lib/questionCategories'
import {
  Calendar,
  Plus,
  CheckCircle2,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Maximize2,
  X,
  FileText,
  Share2,
} from 'lucide-react'
import QRCode from 'qrcode'

export default function AdminCompetitionsPage() {
  const supabase = createClient()
  const [competitions, setCompetitions] = useState<any[]>([])
  const [lockedIds, setLockedIds] = useState<string[]>([])
  const [togglingLockId, setTogglingLockId] = useState<string | null>(null)
  const [bankQuestions, setBankQuestions] = useState<Array<{ id: string; topic: string }>>([])
  const [selectedQuestionCategory, setSelectedQuestionCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [enlargedComp, setEnlargedComp] = useState<any | null>(null)
  const [downloadingQrId, setDownloadingQrId] = useState<string | null>(null)

  const [newComp, setNewComp] = useState({
    title: 'World AMR Awareness Week 2026 – Online Quiz Competition',
    description: 'Online Quiz Competition for Pharmacy Officers.',
    scheduled_start: '',
    duration_minutes: 10,
    total_questions: 30,
    passing_score: 18,
    max_participants: 1000,
    status: 'draft',
  })

  useEffect(() => {
    // Round to nearest minute
    const now = new Date()
    now.setSeconds(0, 0)
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

    setNewComp(prev => ({
      ...prev,
      scheduled_start: localIso,
      duration_minutes: 10,
    }))
  }, [])

  const loadCompetitions = async () => {
    setLoading(true)
    const [{ data }, { data: qData }, lockRes] = await Promise.all([
      supabase.from('competitions').select('*').order('created_at', { ascending: false }),
      supabase.from('question_bank').select('id, topic'),
      fetch('/api/admin/competitions/lock', { cache: 'no-store' }).catch(() => null),
    ])

    setCompetitions(data || [])
    setBankQuestions((qData as Array<{ id: string; topic: string }>) || [])
    if (lockRes && lockRes.ok) {
      const lockData = await lockRes.json()
      setLockedIds(lockData.lockedIds || [])
    }
    setLoading(false)
  }

  const handleToggleLock = async (compId: string, currentlyLocked: boolean) => {
    if (currentlyLocked) {
      const ok = confirm(
        'Unlock this official competition? Once unlocked, it can be deleted or cleared by Clear Test Data.'
      )
      if (!ok) return
    }

    setTogglingLockId(compId)
    try {
      const res = await fetch('/api/admin/competitions/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId: compId, locked: !currentlyLocked }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to update lock')
      setLockedIds(data.lockedIds || [])
      setStatusMsg(data.message)
    } catch (err: any) {
      alert(err.message || 'Failed to update protection status')
    } finally {
      setTogglingLockId(null)
    }
  }

  const questionCategories = useMemo(
    () => extractAllCategories(bankQuestions),
    [bankQuestions]
  )

  const matchingBankQuestions = useMemo(() => {
    if (selectedQuestionCategory === 'all') return bankQuestions
    return bankQuestions.filter(
      (q) => parseCategoryTopic(q.topic).category === selectedQuestionCategory
    )
  }, [bankQuestions, selectedQuestionCategory])

  useEffect(() => {
    loadCompetitions()
  }, [])

  // Generate high-res QR codes for each competition
  useEffect(() => {
    if (typeof window === 'undefined' || competitions.length === 0) return

    const origin = window.location.origin
    const map: Record<string, string> = {}

    Promise.all(
      competitions.map(async (comp) => {
        try {
          const joinUrl = `${origin}/waiting-room/${comp.id}`
          const url = await QRCode.toDataURL(joinUrl, {
            width: 320,
            margin: 1,
            color: {
              dark: '#1e3a8a', // Deep royal navy
              light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
          })
          map[comp.id] = url
        } catch (err) {
          console.error('Error generating QR for competition', comp.id, err)
        }
      })
    ).then(() => {
      setQrCodeUrls(map)
    })
  }, [competitions])

  const handleCopyLink = async (compId: string) => {
    const origin = window.location.origin
    const url = `${origin}/waiting-room/${compId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(compId)
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopiedId(compId)
      setTimeout(() => setCopiedId(null), 2500)
    }
  }

  const handleDownloadBrandedQR = async (comp: any, format: 'png' | 'pdf' = 'png') => {
    const origin = window.location.origin
    const joinUrl = `${origin}/waiting-room/${comp.id}`
    const qrDataUrl = qrCodeUrls[comp.id]
    if (!qrDataUrl) return

    setDownloadingQrId(`${comp.id}_${format}`)

    try {
      const canvas = document.createElement('canvas')
      canvas.width = 900
      canvas.height = 1150
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Outer Decorative Border (Royal Navy)
      ctx.strokeStyle = '#1e3a8a'
      ctx.lineWidth = 14
      ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32)

      // Inner Decorative Border (Gold Amber)
      ctx.strokeStyle = '#d97706'
      ctx.lineWidth = 4
      ctx.strokeRect(34, 34, canvas.width - 68, canvas.height - 68)

      // Top Authority Header Box
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(38, 38, canvas.width - 76, 200)

      // Header Text
      ctx.textAlign = 'center'
      ctx.fillStyle = '#1e3a8a'
      ctx.font = 'bold 25px sans-serif'
      ctx.fillText('NAGPUR MUNICIPAL CORPORATION (NMC), NAGPUR', 450, 90)

      ctx.fillStyle = '#334155'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText('METROPOLITAN SURVEILLANCE UNIT (MSU), NAGPUR', 450, 126)

      ctx.fillStyle = '#b45309'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText('WORLD AMR AWARENESS WEEK (WAAW) 2026', 450, 164)

      ctx.fillStyle = '#64748b'
      ctx.font = '14px sans-serif'
      ctx.fillText('National Awareness Initiative · Antimicrobial Resistance (AMR) Containment', 450, 200)

      // Divider Line
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(60, 238)
      ctx.lineTo(840, 238)
      ctx.stroke()

      // Quiz Title
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 26px sans-serif'
      const maxTitleWidth = 780
      if (ctx.measureText(comp.title).width > maxTitleWidth) {
        ctx.font = 'bold 21px sans-serif'
      }
      ctx.fillText(comp.title, 450, 280)

      // Timing & Info Pill
      ctx.fillStyle = '#eff6ff'
      ctx.beginPath()
      ctx.roundRect(100, 310, 700, 48, 12)
      ctx.fill()
      ctx.strokeStyle = '#bfdbfe'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.fillStyle = '#1e40af'
      ctx.font = 'bold 16px sans-serif'
      const startStr = new Date(comp.scheduled_start).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      const durMin = Math.round(comp.duration_seconds / 60)
      ctx.fillText(`🗓 Starts: ${startStr}   ⏱ Duration: ${durMin} Mins (${comp.total_questions} MCQs)`, 450, 341)

      // Load QR Image
      const qrImg = new Image()
      qrImg.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve()
        qrImg.onerror = reject
        qrImg.src = qrDataUrl
      })

      // QR Code Card Container
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(220, 385, 460, 460, 20)
      ctx.fill()
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2.5
      ctx.stroke()

      ctx.drawImage(qrImg, 245, 410, 410, 410)

      // Scan Instructions Callout
      ctx.fillStyle = '#059669'
      ctx.font = 'bold 25px sans-serif'
      ctx.fillText('📲 SCAN WITH PHONE OR CLICK LINK TO JOIN', 450, 885)

      ctx.fillStyle = '#475569'
      ctx.font = '16px sans-serif'
      ctx.fillText('Scan this QR code with camera or tap the direct link below', 450, 920)

      // Direct Join Link Container
      ctx.fillStyle = '#f1f5f9'
      ctx.beginPath()
      ctx.roundRect(90, 948, 720, 46, 10)
      ctx.fill()
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = '#1e3a8a'
      ctx.font = 'bold 14px monospace'
      ctx.fillText(joinUrl, 450, 977)

      // Bottom One Health Slogan
      ctx.fillStyle = '#0b2566'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText('ONE HEALTH, ONE ACTION  ·  PREVENT AMR NOW!', 450, 1045)

      ctx.fillStyle = '#64748b'
      ctx.font = '13px sans-serif'
      ctx.fillText('Protect • Humans • Animals • Environment  ·  UPHC & Nagpur Municipal Corporation', 450, 1075)

      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        })
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height)
        // Add live clickable URI hyperlinks in PDF!
        doc.link(90, 948, 720, 46, { url: joinUrl })
        doc.link(220, 385, 460, 460, { url: joinUrl })
        doc.save(`AMR_Quiz_Poster_${comp.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.pdf`)
      } else {
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = `AMR_Quiz_QR_${comp.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.png`
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch (err) {
      console.error('Download poster failed:', err)
      alert('Failed to generate downloadable poster')
    } finally {
      setDownloadingQrId(null)
    }
  }

  const handleWhatsAppShare = (comp: any) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://quiz-msu-nagpur.vercel.app'
    const joinUrl = `${origin}/waiting-room/${comp.id}`
    const startStr = new Date(comp.scheduled_start).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    const text = `🏆 *${comp.title}*\n🏛️ *Nagpur Municipal Corporation (NMC) & MSU Nagpur*\n\n🗓️ *Starts:* ${startStr}\n⏱️ *Duration:* ${Math.round(comp.duration_seconds / 60)} Mins (${comp.total_questions} MCQs)\n\n📲 *Join Live Quiz Waiting Room (Click Link below):*\n👉 ${joinUrl}\n\n_Scan QR code or click link directly on mobile/PC to participate._`
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  const handleUpdateStatus = async (compId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('competitions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', compId)

      if (error) throw error
      setStatusMsg(`Competition status updated to ${status}!`)
      await loadCompetitions()
    } catch (err: unknown) {
      alert('Failed to update status')
    }
  }

  const handleDeleteCompetition = async (compId: string, title: string) => {
    if (lockedIds.includes(compId)) {
      alert('🔒 This competition is LOCKED & PROTECTED. Unlock it first if you really want to delete it.')
      return
    }
    if (!confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('competitions')
        .delete()
        .eq('id', compId)

      if (error) throw error
      setStatusMsg('Competition deleted successfully!')
      await loadCompetitions()
    } catch (err: any) {
      alert(`Failed to delete competition: ${err.message}`)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const maxQ = Number(newComp.total_questions) || matchingBankQuestions.length
      const questionsToLink = matchingBankQuestions.slice(0, maxQ)
      if (questionsToLink.length === 0) {
        alert(`No questions found in category "${selectedQuestionCategory}". Please add questions to this category first or select another category.`)
        return
      }

      const startTime = new Date(newComp.scheduled_start)
      const durationMin = Number(newComp.duration_minutes) || 10
      const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000)

      const payload = {
        title: newComp.title,
        description: newComp.description,
        scheduled_start: startTime.toISOString(),
        scheduled_end: endTime.toISOString(),
        duration_seconds: durationMin * 60,
        total_questions: questionsToLink.length,
        passing_score: Math.ceil(questionsToLink.length * 0.6),
        max_participants: newComp.max_participants,
        status: 'draft',
      }

      const { data, error } = await supabase.from('competitions').insert([payload]).select().single()

      if (error) throw error

      // Link questions from the selected Question Bank category
      const links = questionsToLink.map((q, idx) => ({
        competition_id: data.id,
        question_id: q.id,
        display_order: idx + 1,
      }))
      await supabase.from('competition_questions').insert(links)

      setShowCreateModal(false)
      setStatusMsg(
        `New competition saved as Draft (${durationMin} mins, ${questionsToLink.length} questions linked${
          selectedQuestionCategory !== 'all' ? ` from "${selectedQuestionCategory}"` : ''
        }). Switch status to "Scheduled" when ready to publish!`
      )
      await loadCompetitions()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Creation failed'
      alert(msg)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span>Competitions &amp; Quiz Schedule</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Control live quiz start times, durations, and participant registration status.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Competition</span>
          </button>
        </div>

        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {competitions.map((comp) => {
            const isLocked = lockedIds.includes(comp.id)
            const qrUrl = qrCodeUrls[comp.id]
            return (
              <div
                key={comp.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${
                  isLocked ? 'border-emerald-300 ring-1 ring-emerald-200/80' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-stretch lg:items-start justify-between gap-6">
                  {/* Left Column: Competition Details & Status Management */}
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-gray-900">{comp.title}</h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {comp.status}
                          </span>
                          {isLocked && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" />
                              Protected Official Quiz
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{comp.description}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                        <button
                          onClick={() => handleToggleLock(comp.id, isLocked)}
                          disabled={togglingLockId === comp.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                            isLocked
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                          title={
                            isLocked
                              ? 'Protected from Clear Test Data & deletion. Click to unlock.'
                              : 'Lock to protect all participant certificates & data from Clear Test Data'
                          }
                        >
                          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          <span>
                            {togglingLockId === comp.id
                              ? 'Updating...'
                              : isLocked
                              ? 'Locked (Protected)'
                              : 'Lock Official Quiz'}
                          </span>
                        </button>

                        {!isLocked && (
                          <button
                            onClick={() => handleDeleteCompetition(comp.id, comp.title)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            title="Delete Competition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Quiz</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Start Time</span>
                        <span className="font-semibold text-gray-800">{new Date(comp.scheduled_start).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">End Time</span>
                        <span className="font-semibold text-gray-800">{new Date(comp.scheduled_end).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Duration &amp; Qs</span>
                        <span className="font-semibold text-gray-800">{comp.duration_seconds / 60} Mins ({comp.total_questions} MCQs)</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Capacity</span>
                        <span className="font-semibold text-gray-800">Max {comp.max_participants} Participants</span>
                      </div>
                    </div>

                    {/* Status Controls */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500 font-medium mr-2">Status:</span>
                      {([
                        { key: 'draft', label: 'Draft' },
                        { key: 'scheduled', label: 'Scheduled (Auto Live by Time)' },
                        { key: 'results_published', label: 'Result Published' },
                      ] as const).map((st) => (
                        <button
                          key={st.key}
                          onClick={() => handleUpdateStatus(comp.id, st.key)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            comp.status === st.key
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Compact Participant Join QR Widget (Fits within Title-to-Status vertical bounds) */}
                  <div className="w-full lg:w-auto shrink-0 bg-slate-50/90 hover:bg-blue-50/50 rounded-2xl border border-blue-100/90 p-3 flex flex-col justify-between gap-2.5 transition-colors self-start min-w-[220px]">
                    
                    {/* Top: Header & Direct Clickable Join Link */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                          <QrCode className="w-3.5 h-3.5 text-blue-700" />
                          <span>Participant Join QR</span>
                        </div>
                        <a
                          href={`/waiting-room/${comp.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline mt-0.5 cursor-pointer"
                          title="Direct Click to Join Waiting Room"
                        >
                          <span>Click to Join Quiz</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEnlargedComp(comp)}
                        className="p-1 text-gray-400 hover:text-blue-700 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-colors cursor-pointer"
                        title="Enlarge QR Code"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* QR Thumbnail + Stacked Actions Side-by-Side */}
                    <div className="flex items-center gap-2.5">
                      {/* Compact QR Thumbnail */}
                      <div
                        className="relative group cursor-pointer shrink-0 bg-white p-1 rounded-xl border border-blue-200 shadow-2xs transition-transform group-hover:scale-102"
                        onClick={() => setEnlargedComp(comp)}
                        title="Click to Enlarge QR Code"
                      >
                        {qrUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={qrUrl}
                            alt={`Join QR for ${comp.title}`}
                            className="w-16 h-16 sm:w-18 sm:h-18 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center text-[10px] text-gray-400">
                            Loading...
                          </div>
                        )}
                        <div className="absolute inset-0 bg-blue-900/15 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-[9px] font-bold text-white bg-blue-900/80 px-1 py-0.5 rounded">View</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex-1 flex flex-col gap-1.5 min-w-[125px]">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDownloadBrandedQR(comp, 'pdf')}
                            disabled={downloadingQrId === `${comp.id}_pdf`}
                            className="flex-1 py-1.5 px-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[10px] font-bold shadow-2xs flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                            title="Download PDF Poster with Live Clickable Link"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{downloadingQrId === `${comp.id}_pdf` ? '...' : 'PDF Poster'}</span>
                          </button>

                          <button
                            onClick={() => handleDownloadBrandedQR(comp, 'png')}
                            disabled={downloadingQrId === `${comp.id}_png`}
                            className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold shadow-2xs flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                            title="Download PNG Image Poster"
                          >
                            <Download className="w-3 h-3" />
                            <span>{downloadingQrId === `${comp.id}_png` ? '...' : 'PNG'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleWhatsAppShare(comp)}
                            className="flex-1 py-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Share Invitation & Direct Link on WhatsApp"
                          >
                            <Share2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            onClick={() => handleCopyLink(comp.id)}
                            className="py-1 px-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Copy Direct Join URL"
                          >
                            {copiedId === comp.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </main>

      {/* Enlarged QR Code Presentation Modal */}
      {enlargedComp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center relative border border-gray-200">
            <button
              onClick={() => setEnlargedComp(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR Code or Click Link to Join</span>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                {enlargedComp.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Starts: {new Date(enlargedComp.scheduled_start).toLocaleString('en-IN')} · Duration: {Math.round(enlargedComp.duration_seconds / 60)} Mins
              </p>
            </div>

            {/* Large QR Display */}
            <div className="p-4 bg-white rounded-2xl border-2 border-blue-600 shadow-md inline-block mx-auto">
              {qrCodeUrls[enlargedComp.id] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrCodeUrls[enlargedComp.id]}
                  alt="QR Code"
                  className="w-60 h-60 sm:w-68 sm:h-68 object-contain"
                />
              )}
            </div>

            {/* Direct Clickable URL Box */}
            <a
              href={`/waiting-room/${enlargedComp.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-mono text-blue-900 transition-all group cursor-pointer text-center shadow-xs"
              title="Click to open waiting room directly in new tab"
            >
              <div className="flex items-center justify-center gap-1.5 font-sans font-bold text-blue-700 text-[11px] mb-1">
                <span>👉 Click Here to Open Quiz / Join Waiting Room</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="underline decoration-blue-300 group-hover:decoration-blue-700 break-all text-[11px]">
                {typeof window !== 'undefined' ? `${window.location.origin}/waiting-room/${enlargedComp.id}` : ''}
              </div>
            </a>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <button
                onClick={() => handleDownloadBrandedQR(enlargedComp, 'pdf')}
                disabled={downloadingQrId === `${enlargedComp.id}_pdf`}
                className="py-2.5 px-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                title="Download PDF Poster with Live Clickable Hyperlink"
              >
                <FileText className="w-4 h-4" />
                <span>{downloadingQrId === `${enlargedComp.id}_pdf` ? '...' : 'PDF Poster'}</span>
              </button>

              <button
                onClick={() => handleDownloadBrandedQR(enlargedComp, 'png')}
                disabled={downloadingQrId === `${enlargedComp.id}_png`}
                className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                title="Download PNG Image"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingQrId === `${enlargedComp.id}_png` ? '...' : 'PNG Poster'}</span>
              </button>

              <button
                onClick={() => handleWhatsAppShare(enlargedComp)}
                className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer"
                title="Share Invitation & Direct Link on WhatsApp"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => handleCopyLink(enlargedComp.id)}
                className="py-2.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                {copiedId === enlargedComp.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId === enlargedComp.id ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">Schedule New Competition</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Competition Title *</label>
                <input
                  type="text"
                  required
                  value={newComp.title}
                  onChange={(e) => setNewComp({ ...newComp, title: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newComp.description}
                  onChange={(e) => setNewComp({ ...newComp, description: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newComp.scheduled_start}
                    onChange={(e) => setNewComp({ ...newComp, scheduled_start: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    Starting date &amp; time of the quiz
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-gray-700">Duration (Minutes) *</label>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-xs">
                      {newComp.duration_minutes} Mins
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="180"
                        step="1"
                        value={newComp.duration_minutes}
                        onChange={(e) => setNewComp({ ...newComp, duration_minutes: Number(e.target.value) })}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="1"
                        max="300"
                        required
                        value={newComp.duration_minutes}
                        onChange={(e) => setNewComp({ ...newComp, duration_minutes: Math.max(1, Number(e.target.value)) })}
                        className="w-16 p-2 rounded-lg border border-gray-300 text-center font-bold text-xs"
                      />
                    </div>
                    {newComp.scheduled_start && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 block">
                        Calculated End Time: <strong>{new Date(new Date(newComp.scheduled_start).getTime() + (Number(newComp.duration_minutes) || 10) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> ({new Date(new Date(newComp.scheduled_start).getTime() + (Number(newComp.duration_minutes) || 10) * 60000).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Question Bank Category *</label>
                <select
                  value={selectedQuestionCategory}
                  onChange={(e) => setSelectedQuestionCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white font-medium text-gray-800"
                >
                  <option value="all">All Categories ({bankQuestions.length} Qs available)</option>
                  {questionCategories.map((cat) => {
                    const count = bankQuestions.filter(
                      (q) => parseCategoryTopic(q.topic).category === cat
                    ).length
                    return (
                      <option key={cat} value={cat}>
                        {cat} ({count} Qs available)
                      </option>
                    )
                  })}
                </select>
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  Up to 30 questions from this category will be linked automatically.
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800"
                >
                  Create &amp; Link {Math.min(30, matchingBankQuestions.length)} Questions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
