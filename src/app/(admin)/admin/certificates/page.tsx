'use client'

import { useState, useEffect } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { createClient } from '@/lib/supabase/client'
import { Award, Upload, CheckCircle2, UserCheck, ShieldCheck, ExternalLink } from 'lucide-react'

export default function AdminCertificatesPage() {
  const supabase = createClient()
  const [signatories, setSignatories] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    // 1. Fetch signatories
    const { data: signs } = await supabase
      .from('certificate_signatories')
      .select('*')
      .order('display_order', { ascending: true })

    setSignatories(signs || [])

    // 2. Fetch certificates list
    const { data: certs } = await supabase
      .from('certificates')
      .select('*, student:profiles(*)')
      .order('issued_at', { ascending: false })
      .limit(20)

    setCertificates(certs || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Update signatory text
  const handleUpdateSignatory = async (id: string, name: string, designation: string) => {
    setSavingId(id)
    try {
      const { error } = await supabase
        .from('certificate_signatories')
        .update({ name, designation })
        .eq('id', id)

      if (error) throw error
      setStatusMsg('Signatory details updated successfully!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed'
      alert(msg)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Top Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" />
            <span>Digital Certificates &amp; Signatures Control</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure the 3 official signatories whose digital signatures appear on all generated certificates.
          </p>
        </div>

        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* 3 Official Signatories Cards */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Official Certificate Signatories (3 Slots)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {signatories.map((sig, idx) => (
              <div key={sig.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    Signatory #{sig.display_order}
                  </span>
                  <UserCheck className="w-4 h-4 text-gray-400" />
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-500 font-medium mb-1">Name of Signatory</label>
                    <input
                      type="text"
                      defaultValue={sig.name}
                      onBlur={(e) => handleUpdateSignatory(sig.id, e.target.value, sig.designation)}
                      className="w-full p-2 rounded-lg border border-gray-300 font-semibold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-500 font-medium mb-1">Designation / Role</label>
                    <input
                      type="text"
                      defaultValue={sig.designation}
                      onBlur={(e) => handleUpdateSignatory(sig.id, sig.name, e.target.value)}
                      className="w-full p-2 rounded-lg border border-gray-300 text-gray-700"
                    />
                  </div>

                  {/* Signature Upload Placeholder */}
                  <div className="pt-2">
                    <label className="block text-gray-500 font-medium mb-1.5">Signature (Transparent PNG)</label>
                    <div className="border border-dashed border-gray-300 rounded-xl p-3 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                      <span className="text-[10px] text-gray-500">Upload signature file</span>
                    </div>
                  </div>
                </div>

                {savingId === sig.id && (
                  <span className="text-[10px] text-blue-600 block text-right">Saving...</span>
                )}
              </div>
            ))}
          </div>
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
                  <th className="px-5 py-3">QR Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                      No certificates generated yet. Finalize competition from Overview dashboard to issue certificates.
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
                      <td className="px-5 py-3">
                        <a
                          href={`/verify/${c.certificate_number}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
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
