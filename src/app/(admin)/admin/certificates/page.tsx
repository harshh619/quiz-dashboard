'use client'

import { useState, useEffect } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { createClient } from '@/lib/supabase/client'
import type { CertificateSignatory } from '@/lib/signatories'
import {
  Award, Upload, CheckCircle2, AlertCircle, UserCheck,
  ExternalLink, Plus, Trash2, Save, Eye, Loader2, X, Download,
  ArrowLeftRight, ChevronLeft, ChevronRight, Star
} from 'lucide-react'

export default function AdminCertificatesPage() {
  const supabase = createClient()
  const [signatories, setSignatories] = useState<CertificateSignatory[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [sigRes, certsRes] = await Promise.all([
        fetch('/api/admin/signatories', { cache: 'no-store' }),
        supabase
          .from('certificates')
          .select('*, student:profiles(*)')
          .order('issued_at', { ascending: false })
          .limit(30),
      ])

      if (sigRes.ok) {
        const sigData = await sigRes.json()
        setSignatories(sigData.signatories || [])
      }
      setCertificates(certsRes.data || [])
    } catch (err) {
      console.error('Error loading certificate settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFieldChange = (
    id: string,
    field: 'name' | 'designation' | 'organization',
    value: string
  ) => {
    setSignatories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const handleAddSignatory = () => {
    if (signatories.length >= 4) {
      setStatusMsg({ type: 'error', text: 'Maximum 4 signatories can fit cleanly on A4 landscape certificate.' })
      return
    }
    const newId = `sig-${Date.now()}`
    setSignatories((prev) => [
      ...prev,
      {
        id: newId,
        name: `Signatory ${prev.length + 1}`,
        designation: 'Official Designation',
        organization: 'Nagpur Municipal Corporation, Nagpur',
        signatureUrl: null,
      },
    ])
    setStatusMsg({ type: 'success', text: 'New signatory slot added. Fill details and click "Save Changes".' })
  }

  const handleRemoveSignatory = (id: string) => {
    if (signatories.length <= 1) {
      setStatusMsg({ type: 'error', text: 'At least 1 signatory must remain on the certificate.' })
      return
    }
    setSignatories((prev) => prev.filter((s) => s.id !== id))
    setStatusMsg({ type: 'success', text: 'Signatory removed. Click "Save Changes" to apply to PDFs.' })
  }

  const handleMoveSignatory = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= signatories.length) return
    setSignatories((prev) => {
      const next = [...prev]
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      return next
    })
    setStatusMsg({
      type: 'success',
      text: 'Signatory position updated! Click "Save Changes" to apply to PDFs.',
    })
  }

  const handleMakePrimary = (index: number) => {
    if (index === signatories.length - 1) return
    setSignatories((prev) => {
      const next = [...prev]
      const [picked] = next.splice(index, 1)
      next.push(picked) // Primary is always rightmost on the PDF!
      return next
    })
    setStatusMsg({
      type: 'success',
      text: 'Moved to Primary (Right side on PDF)! Click "Save Changes" to confirm.',
    })
  }

  const handleSwapOrder = () => {
    if (signatories.length < 2) return
    setSignatories((prev) => [...prev].reverse())
    setStatusMsg({
      type: 'success',
      text: 'Swapped Primary (Right) & Secondary (Left) signatories! Click "Save Changes" to confirm.',
    })
  }

  const getPositionLabel = (idx: number, total: number) => {
    if (total === 1) return { role: 'Primary Signatory', pos: 'Right on PDF', isPrimary: true }
    if (idx === total - 1) return { role: 'Primary Signatory', pos: 'Right Side on PDF', isPrimary: true }
    if (total === 2 && idx === 0) return { role: 'Secondary Signatory', pos: 'Left Side on PDF', isPrimary: false }
    if (idx === 0) return { role: 'Secondary #1', pos: 'Left Side on PDF', isPrimary: false }
    return { role: `Secondary #${idx + 1}`, pos: 'Center on PDF', isPrimary: false }
  }

  const handleUploadPng = async (signatoryId: string, file: File | null) => {
    if (!file) return
    if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
      setStatusMsg({ type: 'error', text: 'Please select a PNG (.png) transparent signature file only.' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatusMsg({ type: 'error', text: 'PNG file size must be less than 2 MB.' })
      return
    }

    setUploadingId(signatoryId)
    setStatusMsg(null)
    try {
      const formData = new FormData()
      formData.append('signatoryId', signatoryId)
      formData.append('file', file)

      const res = await fetch('/api/admin/signatories', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Upload failed')

      // Update local state and immediately persist full signatories list so new slots are saved too
      const updatedList = signatories.map((s) =>
        s.id === signatoryId ? { ...s, signatureUrl: data.signatureUrl } : s
      )
      setSignatories(updatedList)

      await fetch('/api/admin/signatories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatories: updatedList }),
      })

      setStatusMsg({
        type: 'success',
        text: 'Transparent PNG signature uploaded & saved! Click "Preview Sample PDF" to verify.',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'PNG upload failed'
      setStatusMsg({ type: 'error', text: msg })
    } finally {
      setUploadingId(null)
    }
  }

  const handleRemovePng = (signatoryId: string) => {
    setSignatories((prev) =>
      prev.map((s) => (s.id === signatoryId ? { ...s, signatureUrl: null } : s))
    )
    setStatusMsg({ type: 'success', text: 'Signature PNG removed. Click "Save Changes" to confirm.' })
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setStatusMsg(null)
    try {
      const res = await fetch('/api/admin/signatories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatories }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Save failed')

      setSignatories(data.signatories)
      setStatusMsg({
        type: 'success',
        text: `Saved ${data.signatories.length} official signatory slot(s)! All newly downloaded & emailed PDF certificates will use this exact layout.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save signatories'
      setStatusMsg({ type: 'error', text: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-600" />
              <span>Digital Certificates &amp; Signatures Control</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Customize signatory count (1–4), names, designations, and upload transparent PNG signatures for all official PDF certificates.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/api/admin/certificates/preview?type=first_prize&t=${Date.now()}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>Preview Merit PDF</span>
            </a>

            <a
              href={`/api/admin/certificates/preview?type=participation&t=${Date.now()}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Preview Participation PDF</span>
            </a>

            <button
              onClick={handleSaveAll}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
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

        {/* Dynamic Official Signatories Cards (1 to 4) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Official Certificate Signatories ({signatories.length} of 4 Active)
              </h3>
              <p className="text-[11px] text-gray-500">
                Government protocol: <strong>Secondary</strong> appears on the <strong>Left</strong> and <strong>Primary</strong> always appears on the <strong>Right</strong> side of the PDF.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {signatories.length >= 2 && (
                <button
                  onClick={handleSwapOrder}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Switch Primary (Right) and Secondary (Left) positions"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Switch Primary / Secondary</span>
                </button>
              )}

              <button
                onClick={handleAddSignatory}
                disabled={signatories.length >= 4}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Signatory</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-xs text-gray-400">
              Loading signatories configuration...
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 ${signatories.length >= 3 ? 'xl:grid-cols-3' : ''} gap-4`}>
              {signatories.map((sig, idx) => {
                const posMeta = getPositionLabel(idx, signatories.length)
                return (
                <div
                  key={sig.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 transition-all ${
                    posMeta.isPrimary ? 'border-amber-300 ring-1 ring-amber-200/70' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1.5 ${
                          posMeta.isPrimary
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}
                      >
                        {posMeta.isPrimary ? <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" /> : <UserCheck className="w-3.5 h-3.5" />}
                        {posMeta.role}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        ({posMeta.pos})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {signatories.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleMoveSignatory(idx, -1)}
                            disabled={idx === 0}
                            title="Move Left (Secondary)"
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-25 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSignatory(idx, 1)}
                            disabled={idx === signatories.length - 1}
                            title="Move Right (Primary)"
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-25 cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {!posMeta.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleMakePrimary(idx)}
                          title="Set as Primary Signatory (Right side on PDF)"
                          className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                        >
                          Make Primary
                        </button>
                      )}

                      <button
                        onClick={() => handleRemoveSignatory(sig.id)}
                        disabled={signatories.length <= 1}
                        title="Remove this signatory"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-gray-600 font-semibold mb-1">
                        Name of Signatory *
                      </label>
                      <input
                        type="text"
                        value={sig.name}
                        onChange={(e) => handleFieldChange(sig.id, 'name', e.target.value)}
                        placeholder="e.g. Dr. Anuja Maitreya"
                        className="w-full p-2.5 rounded-lg border border-gray-300 font-semibold text-gray-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-600 font-semibold mb-1">
                        Designation / Role *
                      </label>
                      <input
                        type="text"
                        value={sig.designation}
                        onChange={(e) => handleFieldChange(sig.id, 'designation', e.target.value)}
                        placeholder="e.g. Epidemiologist, MSU Nagpur"
                        className="w-full p-2.5 rounded-lg border border-gray-300 text-gray-700 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-600 font-semibold mb-1">
                        Department / Organization Line (Optional)
                      </label>
                      <input
                        type="text"
                        value={sig.organization || ''}
                        onChange={(e) => handleFieldChange(sig.id, 'organization', e.target.value)}
                        placeholder="e.g. Nagpur Municipal Corporation, Nagpur"
                        className="w-full p-2.5 rounded-lg border border-gray-300 text-gray-700 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    {/* Transparent PNG Signature Upload */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-gray-600 font-semibold">
                          Digital Signature (PNG Only)
                        </label>
                        {sig.signatureUrl && (
                          <button
                            type="button"
                            onClick={() => handleRemovePng(sig.id)}
                            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 hover:underline cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Remove PNG
                          </button>
                        )}
                      </div>

                      {sig.signatureUrl ? (
                        <div className="rounded-xl border border-emerald-200 bg-slate-50 p-3 flex flex-col items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sig.signatureUrl}
                            alt={`${sig.name} signature`}
                            className="max-h-14 w-auto object-contain"
                          />
                          <label className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer">
                            {uploadingId === sig.id ? 'Uploading...' : 'Replace Signature PNG'}
                            <input
                              type="file"
                              accept="image/png"
                              className="hidden"
                              disabled={uploadingId === sig.id}
                              onChange={(e) => {
                                const f = e.target.files?.[0] || null
                                e.target.value = ''
                                void handleUploadPng(sig.id, f)
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="block border-2 border-dashed border-gray-300 rounded-xl p-4 text-center bg-gray-50 hover:bg-blue-50/40 hover:border-blue-300 cursor-pointer transition-colors">
                          {uploadingId === sig.id ? (
                            <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Uploading PNG...</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                              <span className="text-[11px] font-semibold text-gray-700 block">
                                Click to Upload Transparent PNG
                              </span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                PNG format only · Max 2 MB
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/png"
                            className="hidden"
                            disabled={uploadingId === sig.id}
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null
                              e.target.value = ''
                              void handleUploadPng(sig.id, f)
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Issued Certificates List */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Recently Generated Certificates</h3>
            <span className="text-xs text-gray-400">Total: {certificates.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Certificate Number</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Award Category</th>
                  <th className="px-5 py-3">Issued Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                      No certificates generated yet. Certificates are issued automatically once a scheduled competition finishes.
                    </td>
                  </tr>
                ) : (
                  certificates.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-mono font-bold text-blue-700">
                        {c.certificate_number}
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-900">
                        {c.student?.full_name || 'Student'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-800">
                          {c.certificate_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {new Date(c.issued_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-3">
                          <a
                            href={`/api/certificate/${c.attempt_id}/pdf`}
                            className="text-emerald-700 hover:underline font-semibold inline-flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </a>
                          <a
                            href={`/verify/${c.certificate_number}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Verify</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
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
