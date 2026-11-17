'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COURSES, APP_NAME } from '@/constants'
import { User, School, BookOpen, Calendar, Phone, CheckCircle, AlertCircle } from 'lucide-react'

export default function RegisterProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    college_name: '',
    course: 'B.Pharm',
    year_semester: '3rd Year / 5th Sem',
    mobile: '',
  })

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile && profile.college_name && profile.course) {
        // Already completed profile, redirect to dashboard
        router.push('/dashboard')
        return
      }

      if (profile) {
        setFormData(prev => ({
          ...prev,
          full_name: profile.full_name || user.user_metadata?.full_name || '',
          college_name: profile.college_name || '',
          course: profile.course || 'B.Pharm',
          year_semester: profile.year_semester || '',
          mobile: profile.mobile || '',
        }))
      }
      setInitLoading(false)
    }

    loadUser()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const regNum = `AMR-WAAW-2026-${Math.floor(100000 + Math.random() * 900000)}`

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: formData.full_name.trim(),
          college_name: formData.college_name.trim(),
          course: formData.course,
          year_semester: formData.year_semester.trim(),
          mobile: formData.mobile.trim(),
          registration_number: regNum,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })

      if (updateError) throw updateError

      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 bg-blue-700 rounded-xl items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20 mb-3">
            AMR
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Participant Profile Registration</h1>
          <p className="text-sm text-gray-600 mt-1">
            Complete your academic details to participate in the AMR Quiz Competition and receive your official certificate.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-gray-100 p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name (as it will appear on Certificate) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Dr. / Mr. / Ms. Rahul Sharma"
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900"
                />
              </div>
            </div>

            {/* College Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                College / Institution Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <School className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.college_name}
                  onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                  placeholder="e.g. Government College of Pharmacy, New Delhi"
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Course */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Course / Degree *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900 bg-white"
                  >
                    {COURSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Year / Semester */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Year / Semester *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.year_semester}
                    onChange={(e) => setFormData({ ...formData, year_semester: e.target.value })}
                    placeholder="e.g. 3rd Year / 6th Sem"
                    className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Contact Number *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none shadow-md shadow-blue-500/20 transition-colors disabled:opacity-50 mt-6"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Submitting Details...' : 'Complete Registration & Continue'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
