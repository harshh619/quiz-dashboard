'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { HEALTH_FACILITIES } from '@/constants'
import { formatPersonName, formatCollegeName } from '@/lib/textFormat'
import { User, Building2, Phone, CheckCircle, AlertCircle, Info, ShieldCheck } from 'lucide-react'

export default function RegisterProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    designation: 'Pharmacy Officer',
    other_designation: '',
    health_facility: '',
    other_facility: '',
    mobile: '',
  })

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const search = typeof window !== 'undefined' ? window.location.search : ''
        const redirectParam = search
          ? `/login?redirect=${encodeURIComponent(`/register${search}`)}`
          : '/login?redirect=/register'
        router.push(redirectParam)
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
        const existingFacility = (profile.college_name || '').trim()
        const isKnownFacility = HEALTH_FACILITIES.includes(
          existingFacility as (typeof HEALTH_FACILITIES)[number]
        )

        const existingCourse = (profile.course || '').trim()
        const isPharmacyOfficer = !existingCourse || existingCourse.toLowerCase() === 'pharmacy officer'

        setFormData({
          full_name: formatPersonName(profile.full_name || user.user_metadata?.full_name || '', true),
          designation: isPharmacyOfficer ? 'Pharmacy Officer' : 'OTHER',
          other_designation: isPharmacyOfficer ? '' : existingCourse,
          health_facility: isKnownFacility
            ? existingFacility
            : existingFacility
            ? 'OTHER'
            : '',
          other_facility: !isKnownFacility && existingFacility
            ? formatCollegeName(existingFacility, true)
            : '',
          mobile: (profile.mobile || '').replace(/\D/g, '').slice(-10),
        })
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

      const formattedFullName = formatPersonName(formData.full_name, true)
      const selectedFacility =
        formData.health_facility === 'OTHER'
          ? formatCollegeName(formData.other_facility, true)
          : formData.health_facility.trim()

      const selectedDesignation =
        formData.designation === 'OTHER'
          ? (formData.other_designation.trim() || 'GNM (In-charge Pharmacy Officer)')
          : 'Pharmacy Officer'

      const cleanMobile = formData.mobile.replace(/\D/g, '')

      if (!formattedFullName) {
        throw new Error('Please enter the Name of Participant.')
      }
      if (!selectedFacility) {
        throw new Error('Please select your Health Facility.')
      }
      if (formData.designation === 'OTHER' && !formData.other_designation.trim()) {
        throw new Error('Please specify your designation (e.g. GNM / Staff Nurse in-charge).')
      }
      if (!/^\d{10}$/.test(cleanMobile)) {
        throw new Error('Please enter a valid 10-digit mobile number.')
      }

      const regNum = `AMR-WAAW-2026-${Math.floor(100000 + Math.random() * 900000)}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formattedFullName,
          college_name: selectedFacility,
          course: selectedDesignation,
          year_semester: 'NMC Nagpur',
          mobile: cleanMobile,
          registration_number: regNum,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      const redirectParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null
      const target = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard'
      router.push(target)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3">
            <Image
              src="/logo.png"
              alt="AMR 2026 Logo"
              width={64}
              height={64}
              className="object-contain drop-shadow-md"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Participant Registration</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 px-2">
            Enter your details to participate in the Online Quiz Competition for Pharmacy Officers &amp; Health Facility Staff.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-gray-100 p-5 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name of Participant */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Name of Participant *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: formatPersonName(e.target.value, false) })
                  }
                  onBlur={() =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: formatPersonName(prev.full_name, true),
                    }))
                  }
                  placeholder="e.g. Harsh Wardhan Chandel"
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900"
                />
              </div>
              <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 text-[11px] text-amber-800 leading-snug">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Important:</strong> Please ensure your full official name is spelled correctly.
                </span>
              </div>
            </div>

            {/* Designation / पदनाम */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Designation / पदनाम *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <select
                  required
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      designation: e.target.value,
                      other_designation: e.target.value === 'OTHER' ? formData.other_designation : '',
                    })
                  }
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900 bg-white"
                >
                  <option value="Pharmacy Officer">Pharmacy Officer</option>
                  <option value="OTHER">Other (e.g. GNM / Staff Nurse in-charge)</option>
                </select>
              </div>

              {formData.designation === 'OTHER' && (
                <div className="mt-2.5 space-y-1">
                  <input
                    type="text"
                    required
                    value={formData.other_designation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        other_designation: e.target.value,
                      })
                    }
                    placeholder="Specify Designation (e.g. GNM Staff Nurse In-charge)"
                    className="block w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900"
                  />
                  <p className="text-[11px] text-gray-500">
                    उदा. GNM Staff Nurse (In-charge Pharmacy Officer)
                  </p>
                </div>
              )}
            </div>

            {/* Name of Health Facility */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Name of Health Facility *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <select
                  required
                  value={formData.health_facility}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      health_facility: e.target.value,
                      other_facility: e.target.value === 'OTHER' ? formData.other_facility : '',
                    })
                  }
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900 bg-white"
                >
                  <option value="" disabled>
                    -- Select Your NMC Health Facility (UPHC) --
                  </option>
                  {HEALTH_FACILITIES.map((facility) => (
                    <option key={facility} value={facility}>
                      {facility}
                    </option>
                  ))}
                  <option value="OTHER">Other (Specify Health Facility)</option>
                </select>
              </div>

              {formData.health_facility === 'OTHER' && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    required
                    value={formData.other_facility}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        other_facility: formatCollegeName(e.target.value, false),
                      })
                    }
                    onBlur={() =>
                      setFormData((prev) => ({
                        ...prev,
                        other_facility: formatCollegeName(prev.other_facility, true),
                      }))
                    }
                    placeholder="Enter Health Facility Name"
                    className="block w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900"
                  />
                </div>
              )}

              <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 text-[11px] text-amber-800 leading-snug">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Important:</strong> Your selected Health Facility will appear on your official results, leaderboards &amp; reports.
                </span>
              </div>
            </div>

            {/* 10-Digit Mobile Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Mobile Number (10 Digits) *
                </label>
                <span
                  className={`text-[11px] font-mono font-semibold ${
                    formData.mobile.length === 10 ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {formData.mobile.length}/10
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  minLength={10}
                  pattern="[0-9]{10}"
                  required
                  value={formData.mobile}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setFormData({ ...formData, mobile: digitsOnly })
                  }}
                  placeholder="Enter 10-digit mobile number"
                  title="Please enter a valid 10-digit mobile number"
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900 tracking-wide"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none shadow-md shadow-blue-500/20 transition-colors disabled:opacity-50 mt-6 cursor-pointer"
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
